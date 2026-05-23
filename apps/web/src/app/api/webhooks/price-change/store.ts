import { createHmac } from 'node:crypto';

export type PriceChangeWebhookPayload = {
  chain: string;
  new_price: number;
  old_price: number;
  product_id: string;
};

export type PriceChangeWebhookDelivery = {
  status: 'delivered' | 'failed' | 'skipped';
  statusCode?: number;
  subscriptionId: string;
};

export type PriceChangeWebhookDispatchResult = {
  delivered: number;
  deliveries: PriceChangeWebhookDelivery[];
  payload: PriceChangeWebhookPayload;
  skippedReason?: 'drop_threshold_not_met' | 'no_subscriptions';
};

type WebhookSubscription = {
  callbackUrl: string;
  chain: string | null;
  id: string;
  productId: string | null;
  secret: string | null;
};

type WebhookSubscriptionRow = {
  callback_url: string;
  chain: string | null;
  id: string;
  product_id: string | null;
  secret: string | null;
};

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

export const PRICE_DROP_THRESHOLD = 0.95;

const productIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizePrice(value: unknown, field: 'old_price' | 'new_price') {
  const price = typeof value === 'string' ? Number(value) : value;
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    throw new Error(`${field} must be a non-negative number.`);
  }
  return price;
}

function normalizePayload(input: unknown): PriceChangeWebhookPayload {
  if (!input || typeof input !== 'object') throw new Error('Webhook payload must be an object.');
  const candidate = input as Record<string, unknown>;

  if (!isNonEmptyString(candidate.product_id) || !productIdPattern.test(candidate.product_id.trim())) {
    throw new Error('product_id must be a UUID.');
  }
  if (!isNonEmptyString(candidate.chain)) throw new Error('chain is required.');

  const old_price = normalizePrice(candidate.old_price, 'old_price');
  const new_price = normalizePrice(candidate.new_price, 'new_price');
  if (old_price === 0) throw new Error('old_price must be greater than zero for price-drop evaluation.');

  return {
    product_id: candidate.product_id.trim().toLowerCase(),
    old_price,
    new_price,
    chain: candidate.chain.trim().toLowerCase()
  };
}

function isPriceDropOverThreshold(event: PriceChangeWebhookPayload) {
  const { old_price, new_price } = event;
  return new_price < old_price * PRICE_DROP_THRESHOLD;
}

function assertSafeCallbackUrl(callbackUrl: string) {
  const parsed = new URL(callbackUrl);
  if (parsed.protocol !== 'https:') throw new Error('Webhook callback_url must use https:');
  if (parsed.username || parsed.password) throw new Error('Webhook callback_url must not contain credentials.');
}

function subscriptionFromRow(row: WebhookSubscriptionRow): WebhookSubscription {
  assertSafeCallbackUrl(row.callback_url);
  return {
    id: row.id,
    productId: row.product_id,
    chain: row.chain,
    callbackUrl: row.callback_url,
    secret: row.secret
  };
}

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function poolForDatabaseUrl(databaseUrl: string): Promise<PgPoolLike> {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return cachedPool;
}

async function listMatchingSubscriptions(pool: PgPoolLike, event: PriceChangeWebhookPayload): Promise<WebhookSubscription[]> {
  const result = await pool.query(
    `select id::text, product_id::text, chain, callback_url, secret
     from webhook_subscriptions
     where active = true
       and (product_id is null or product_id = $1::uuid)
       and (chain is null or lower(chain) = lower($2))
     order by created_at asc, id`,
    [event.product_id, event.chain]
  );
  return (result.rows as WebhookSubscriptionRow[]).map(subscriptionFromRow);
}

function signedHeaders(subscription: WebhookSubscription, payloadJson: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'GroceryView-price-change-webhook/1.0'
  };

  if (subscription.secret) {
    headers['X-GroceryView-Webhook-Signature'] = createHmac('sha256', subscription.secret)
      .update(payloadJson)
      .digest('hex');
  }

  return headers;
}

async function deliverSubscription(subscription: WebhookSubscription, event: PriceChangeWebhookPayload): Promise<PriceChangeWebhookDelivery> {
  try {
    assertSafeCallbackUrl(subscription.callbackUrl);
    const webhookPayload = {
      product_id: event.product_id,
      old_price: event.old_price,
      new_price: event.new_price,
      chain: event.chain
    };
    const payloadJson = JSON.stringify(webhookPayload);
    const response = await fetch(subscription.callbackUrl, {
      method: 'POST',
      headers: signedHeaders(subscription, payloadJson),
      body: payloadJson,
      signal: AbortSignal.timeout(5000)
    });

    return {
      subscriptionId: subscription.id,
      status: response.ok ? 'delivered' : 'failed',
      statusCode: response.status
    };
  } catch {
    return { subscriptionId: subscription.id, status: 'failed' };
  }
}

export async function dispatchPriceChangeWebhook(input: unknown): Promise<PriceChangeWebhookDispatchResult> {
  const payload = normalizePayload(input);

  if (!isPriceDropOverThreshold(payload)) {
    return { payload, delivered: 0, deliveries: [], skippedReason: 'drop_threshold_not_met' };
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('webhook_database_unconfigured');

  const pool = await poolForDatabaseUrl(databaseUrl);
  const subscriptions = await listMatchingSubscriptions(pool, payload);
  if (subscriptions.length === 0) {
    return { payload, delivered: 0, deliveries: [], skippedReason: 'no_subscriptions' };
  }

  const deliveries = await Promise.all(subscriptions.map((subscription) => deliverSubscription(subscription, payload)));
  const delivered = deliveries.filter((delivery) => delivery.status === 'delivered').length;

  return { payload, delivered, deliveries };
}
