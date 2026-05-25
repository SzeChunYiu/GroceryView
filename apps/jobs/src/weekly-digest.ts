import { pathToFileURL } from 'node:url';
import type { QueryExecutor } from '@groceryview/db';
import { createPgQueryExecutor } from '@groceryview/db';
import {
  createTransactionalEmailClient,
  type CreateTransactionalEmailClientOptions,
  type TransactionalEmailClient,
  type TransactionalEmailFetch,
  type TransactionalEmailMessage
} from '@groceryview/notifications';
import { buildMyFlyerEmail, type MyFlyerEmailOffer } from '@groceryview/server/email/myFlyerEmail';

const defaultMaxChangesPerUser = 10;
const weeklyDigestDays = 7;

export type WeeklyDigestWindow = {
  since: string;
  until: string;
};

export type WeeklyDigestSubscription = {
  userId: string;
  recipientEmail: string;
};

export type WeeklyWatchlistPriceChange = {
  productId: string;
  productSlug: string;
  productName: string;
  brand?: string;
  chainSlug?: string;
  chainName?: string;
  storeSlug?: string;
  storeName?: string;
  priceType: string;
  currentPrice: number;
  previousPrice: number;
  changeAmount: number;
  changePercent: number;
  currency: string;
  observedAt: string;
  confidence: number;
};

export type BuildWeeklyDigestEmailInput = {
  baseUrl: string;
  items: WeeklyWatchlistPriceChange[];
  now: string;
  recipientEmail: string;
  userId: string;
  window: WeeklyDigestWindow;
};

export type WeeklyDigestJobInput = {
  baseUrl: string;
  emailClient: TransactionalEmailClient;
  executor: QueryExecutor;
  maxChangesPerUser?: number;
  now?: string;
};

export type MyFlyerDigestSubscription = {
  country: string;
  userId: string;
  recipientEmail: string;
};

export type MyFlyerDigestJobInput = {
  baseUrl: string;
  countries: string[];
  emailClient: TransactionalEmailClient;
  executor: QueryExecutor;
  maxOffersPerUser?: number;
  now?: string;
};

export type MyFlyerDigestJobSent = {
  country: string;
  userId: string;
  recipientEmail: string;
  messageId: string;
  itemCount: number;
};

export type MyFlyerDigestJobSkipped = {
  country: string;
  userId: string;
  recipientEmail: string;
  reason: 'missing_recipient_email' | 'no_my_flyer_offers';
};

export type MyFlyerDigestJobResult = {
  countries: string[];
  since: string;
  until: string;
  subscriptionCount: number;
  sent: MyFlyerDigestJobSent[];
  skipped: MyFlyerDigestJobSkipped[];
};

export type WeeklyDigestJobSent = {
  userId: string;
  recipientEmail: string;
  messageId: string;
  itemCount: number;
};

export type WeeklyDigestJobSkipped = {
  userId: string;
  recipientEmail: string;
  reason: 'missing_recipient_email' | 'no_watchlist_price_changes';
};

export type WeeklyDigestJobResult = {
  since: string;
  until: string;
  subscriptionCount: number;
  sent: WeeklyDigestJobSent[];
  skipped: WeeklyDigestJobSkipped[];
};

export type WeeklyDigestResendClientOptions = Omit<CreateTransactionalEmailClientOptions, 'provider'>;

export type WeeklyDigestEnv = Record<string, string | undefined>;

export type WeeklyDigestCliResult = WeeklyDigestJobResult & {
  status: 'sent' | 'no_recipients' | 'no_changes';
};

export type MyFlyerDigestCliResult = MyFlyerDigestJobResult & {
  status: 'sent' | 'no_recipients' | 'no_offers';
};

type WeeklyDigestSubscriptionRow = {
  user_id: string;
  recipient_email: string;
};

type WeeklyWatchlistPriceChangeRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  chain_slug: string | null;
  chain_name: string | null;
  store_slug: string | null;
  store_name: string | null;
  price_type: string;
  current_price: string | number;
  previous_price: string | number;
  change_amount: string | number;
  change_percent: string | number;
  currency: string;
  observed_at: string | Date;
  confidence: string | number;
};

type MyFlyerDigestSubscriptionRow = {
  country: string | null;
  user_id: string;
  recipient_email: string;
};

type MyFlyerEmailOfferRow = {
  product_id: string;
  product_name: string;
  brand: string | null;
  chain_name: string;
  store_name: string | null;
  offer_price: string | number;
  regular_price: string | number | null;
  unit_price: string | number | null;
  currency: string;
  valid_until: string | Date | null;
  image_url: string | null;
  source_url: string | null;
  confidence: string | number;
};

type PgLikeClient = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string }) => PgLikeClient;
};

export function weeklyDigestWindow(now: string = new Date().toISOString()): WeeklyDigestWindow {
  const until = new Date(now);
  if (Number.isNaN(until.getTime())) throw new Error('now must be an ISO date.');
  const since = new Date(until.getTime() - weeklyDigestDays * 24 * 60 * 60 * 1000);
  return {
    since: since.toISOString(),
    until: until.toISOString()
  };
}

export function createWeeklyDigestResendClient(options: WeeklyDigestResendClientOptions): TransactionalEmailClient {
  return createTransactionalEmailClient({ ...options, provider: 'resend' });
}

export function createWeeklyDigestResendClientFromEnv(
  env: WeeklyDigestEnv = process.env,
  fetchImpl?: TransactionalEmailFetch
): TransactionalEmailClient {
  return createWeeklyDigestResendClient({
    apiKey: requiredEnv(env, 'RESEND_API_KEY'),
    fromEmail: requiredEnv(env, 'WEEKLY_DIGEST_FROM_EMAIL'),
    fetch: fetchImpl
  });
}

export async function runWeeklyDigestJob(input: WeeklyDigestJobInput): Promise<WeeklyDigestJobResult> {
  const now = input.now ?? new Date().toISOString();
  const window = weeklyDigestWindow(now);
  const maxChangesPerUser = normalizeLimit(input.maxChangesPerUser ?? defaultMaxChangesPerUser);
  const subscriptions = await listWeeklyDigestSubscriptions(input.executor);
  const sent: WeeklyDigestJobSent[] = [];
  const skipped: WeeklyDigestJobSkipped[] = [];

  for (const subscription of subscriptions) {
    if (!subscription.recipientEmail.trim()) {
      skipped.push({
        userId: subscription.userId,
        recipientEmail: subscription.recipientEmail,
        reason: 'missing_recipient_email'
      });
      continue;
    }

    const items = await listWeeklyWatchlistPriceChanges(input.executor, {
      limit: maxChangesPerUser,
      userId: subscription.userId,
      window
    });

    if (items.length === 0) {
      skipped.push({
        userId: subscription.userId,
        recipientEmail: subscription.recipientEmail,
        reason: 'no_watchlist_price_changes'
      });
      continue;
    }

    const message = buildWeeklyDigestEmail({
      baseUrl: input.baseUrl,
      items,
      now,
      recipientEmail: subscription.recipientEmail,
      userId: subscription.userId,
      window
    });
    const messageId = await input.emailClient.send(message);
    sent.push({
      userId: subscription.userId,
      recipientEmail: subscription.recipientEmail,
      messageId,
      itemCount: items.length
    });
  }

  return {
    since: window.since,
    until: window.until,
    subscriptionCount: subscriptions.length,
    sent,
    skipped
  };
}

export async function runMyFlyerDigestJob(input: MyFlyerDigestJobInput): Promise<MyFlyerDigestJobResult> {
  const now = input.now ?? new Date().toISOString();
  const window = weeklyDigestWindow(now);
  const countries = normalizeCountries(input.countries);
  const maxOffersPerUser = normalizeLimit(input.maxOffersPerUser ?? defaultMaxChangesPerUser);
  const subscriptions = await listMyFlyerDigestSubscriptions(input.executor, countries);
  const sent: MyFlyerDigestJobSent[] = [];
  const skipped: MyFlyerDigestJobSkipped[] = [];

  for (const subscription of subscriptions) {
    if (!subscription.recipientEmail.trim()) {
      skipped.push({
        country: subscription.country,
        userId: subscription.userId,
        recipientEmail: subscription.recipientEmail,
        reason: 'missing_recipient_email'
      });
      continue;
    }

    const offers = await listMyFlyerEmailOffers(input.executor, {
      country: subscription.country,
      limit: maxOffersPerUser,
      userId: subscription.userId,
      window
    });

    if (offers.length === 0) {
      skipped.push({
        country: subscription.country,
        userId: subscription.userId,
        recipientEmail: subscription.recipientEmail,
        reason: 'no_my_flyer_offers'
      });
      continue;
    }

    const message = buildMyFlyerEmail({
      baseUrl: input.baseUrl,
      country: subscription.country,
      generatedAt: now,
      offers,
      recipientEmail: subscription.recipientEmail,
      userId: subscription.userId,
      weekStartsOn: window.since,
      weekEndsOn: window.until
    });
    const messageId = await input.emailClient.send(message);
    sent.push({
      country: subscription.country,
      userId: subscription.userId,
      recipientEmail: subscription.recipientEmail,
      messageId,
      itemCount: offers.length
    });
  }

  return {
    countries,
    since: window.since,
    until: window.until,
    subscriptionCount: subscriptions.length,
    sent,
    skipped
  };
}

export function buildWeeklyDigestEmail(input: BuildWeeklyDigestEmailInput): TransactionalEmailMessage {
  const itemLines = input.items.flatMap((item, index) => {
    const location = [item.chainName, item.storeName].filter(Boolean).join(' · ');
    const productUrl = buildProductUrl(input.baseUrl, item.productSlug || item.productId);
    return [
      `${index + 1}. ${item.productName}${item.brand ? ` (${item.brand})` : ''}`,
      `   ${formatPrice(item.previousPrice, item.currency)} → ${formatPrice(item.currentPrice, item.currency)} (${formatSignedPercent(item.changePercent)}, ${formatSignedMoney(item.changeAmount, item.currency)})`,
      `   ${location || 'GroceryView'} · ${humanizePriceType(item.priceType)} · observed ${formatDateTime(item.observedAt)} · confidence ${Math.round(item.confidence * 100)}%`,
      `   ${productUrl}`
    ];
  });

  const text = [
    'Here is your 7-day watchlist summary from GroceryView.',
    '',
    `Watchlist price changes from ${formatDate(input.window.since)} to ${formatDate(input.window.until)}:`,
    ...itemLines,
    '',
    'No synthetic or estimated rows are included; this digest is compiled from persisted GroceryView observation history for products on your watchlist.',
    `Manage notification preferences: ${buildPreferencesUrl(input.baseUrl)}`,
    '',
    `Sent at: ${input.now}`
  ].join('\n');

  return {
    to: input.recipientEmail,
    subject: 'Your GroceryView weekly watchlist summary',
    text,
    metadata: {
      type: 'weekly_watchlist_digest',
      userId: input.userId,
      itemCount: String(input.items.length),
      sendAt: input.now
    }
  };
}

async function listWeeklyDigestSubscriptions(executor: QueryExecutor): Promise<WeeklyDigestSubscription[]> {
  const rows = await executor.query<WeeklyDigestSubscriptionRow>(
    `/* weekly_digest_subscriptions */
     select distinct on (notification_subscriptions.user_id)
            notification_subscriptions.user_id,
            notification_subscriptions.recipient as recipient_email
       from notification_subscriptions
      where notification_subscriptions.active = true
        and notification_subscriptions.channel = 'email'
        and nullif(btrim(notification_subscriptions.recipient), '') is not null
      order by notification_subscriptions.user_id,
               notification_subscriptions.updated_at desc,
               notification_subscriptions.id`,
    []
  );

  return rows.map((row) => ({
    userId: row.user_id,
    recipientEmail: row.recipient_email.trim()
  }));
}

async function listMyFlyerDigestSubscriptions(
  executor: QueryExecutor,
  countries: string[]
): Promise<MyFlyerDigestSubscription[]> {
  const rows = await executor.query<MyFlyerDigestSubscriptionRow>(
    `/* my_flyer_digest_subscriptions */
     select distinct on (notification_subscriptions.user_id, lower(coalesce(user_preferences.notification_preferences ->> 'myFlyerCountry', 'se')))
            lower(coalesce(user_preferences.notification_preferences ->> 'myFlyerCountry', 'se')) as country,
            notification_subscriptions.user_id,
            notification_subscriptions.recipient as recipient_email
       from notification_subscriptions
       join user_preferences on user_preferences.user_id = notification_subscriptions.user_id
      where notification_subscriptions.active = true
        and notification_subscriptions.channel = 'email'
        and user_preferences.notification_preferences ->> 'myFlyerWeeklyEmail' = 'true'
        and lower(coalesce(user_preferences.notification_preferences ->> 'myFlyerCountry', 'se')) = any($1::text[])
        and nullif(btrim(notification_subscriptions.recipient), '') is not null
      order by notification_subscriptions.user_id,
               lower(coalesce(user_preferences.notification_preferences ->> 'myFlyerCountry', 'se')),
               notification_subscriptions.updated_at desc,
               notification_subscriptions.id`,
    [countries]
  );

  return rows.map((row) => ({
    country: normalizeCountry(row.country ?? 'se'),
    userId: row.user_id,
    recipientEmail: row.recipient_email.trim()
  }));
}

async function listWeeklyWatchlistPriceChanges(
  executor: QueryExecutor,
  input: { userId: string; window: WeeklyDigestWindow; limit: number }
): Promise<WeeklyWatchlistPriceChange[]> {
  const rows = await executor.query<WeeklyWatchlistPriceChangeRow>(
    `/* weekly_watchlist_price_changes */
     with watched_products as (
       select products.id,
              products.slug,
              products.canonical_name,
              products.brand,
              array_agg(distinct allowed_price_type) as allowed_price_types
         from watchlist_items
         join products on products.id::text = watchlist_items.product_id
                    or products.slug = watchlist_items.product_id
         cross join lateral unnest(coalesce(watchlist_items.allowed_price_types, array['shelf']::text[])) as allowed_price_types(allowed_price_type)
        where watchlist_items.user_id = $1
        group by products.id, products.slug, products.canonical_name, products.brand
     ), ranked_observations as (
       select watched_products.id as product_id,
              watched_products.slug as product_slug,
              watched_products.canonical_name as product_name,
              watched_products.brand,
              chains.slug as chain_slug,
              chains.name as chain_name,
              stores.slug as store_slug,
              stores.name as store_name,
              observations.price_type,
              observations.price as current_price,
              lag(observations.price) over (
                partition by observations.product_id, observations.chain_id, observations.store_id, observations.price_type
                order by observations.observed_at, observations.id
              ) as previous_price,
              observations.currency,
              observations.observed_at,
              observations.confidence
         from observations
         join watched_products on watched_products.id = observations.product_id
         join chains on chains.id = observations.chain_id
         left join stores on stores.id = observations.store_id
        where observations.domain = 'grocery'
          and observations.observed_at >= ($2::timestamptz - interval '7 days')
          and observations.observed_at < $3::timestamptz
          and observations.price >= 0
          and observations.price_type = any(watched_products.allowed_price_types)
          and observations.price_type <> 'estimated'
     ), weekly_changes as (
       select product_id::text as product_id,
              product_slug,
              product_name,
              brand,
              chain_slug,
              chain_name,
              store_slug,
              store_name,
              price_type,
              current_price,
              previous_price,
              round((current_price - previous_price)::numeric, 2) as change_amount,
              round((((current_price - previous_price) / nullif(previous_price, 0)) * 100)::numeric, 2) as change_percent,
              currency,
              observed_at,
              confidence
         from ranked_observations
        where observed_at >= $2::timestamptz
          and previous_price is not null
          and previous_price <> current_price
     )
     select *
       from weekly_changes
      order by abs(change_percent) desc nulls last,
               observed_at desc,
               product_slug,
               chain_slug nulls last,
               store_slug nulls last,
               price_type
      limit $4`,
    [input.userId, input.window.since, input.window.until, input.limit]
  );

  return rows.map(mapWeeklyWatchlistPriceChangeRow);
}

async function listMyFlyerEmailOffers(
  executor: QueryExecutor,
  input: { country: string; userId: string; window: WeeklyDigestWindow; limit: number }
): Promise<MyFlyerEmailOffer[]> {
  const rows = await executor.query<MyFlyerEmailOfferRow>(
    `/* my_flyer_email_offers */
     with watched_products as (
       select product_id
         from watchlist_items
        where user_id = $1
          and active = true
     ), ranked_flyer_rows as (
       select products.id::text as product_id,
              products.canonical_name as product_name,
              products.brand,
              chains.name as chain_name,
              stores.name as store_name,
              observations.price as offer_price,
              observations.regular_price,
              observations.unit_price,
              observations.currency,
              coalesce(observations.valid_until, observations.promotion_ends_on::timestamptz) as valid_until,
              products.image_url,
              observations.provenance ->> 'sourceUrl' as source_url,
              observations.confidence,
              case when watched_products.product_id is not null then 1 else 0 end as watchlist_rank
         from observations
         join products on products.id = observations.product_id
         join chains on chains.id = observations.chain_id
         left join stores on stores.id = observations.store_id
         left join watched_products on watched_products.product_id = products.id::text
        where observations.domain = 'grocery'
          and chains.country_code = upper($2)
          and observations.price_type in ('promotion', 'member')
          and observations.observed_at >= $3::timestamptz
          and observations.observed_at < $4::timestamptz
          and observations.price >= 0
          and observations.price_type <> 'estimated'
     )
     select product_id,
            product_name,
            brand,
            chain_name,
            store_name,
            offer_price,
            regular_price,
            unit_price,
            currency,
            valid_until,
            image_url,
            source_url,
            confidence
       from ranked_flyer_rows
      order by watchlist_rank desc,
               greatest(coalesce(regular_price - offer_price, 0), 0) desc,
               confidence desc,
               product_name,
               chain_name
      limit $5`,
    [input.userId, input.country, input.window.since, input.window.until, input.limit]
  );

  return rows.map(mapMyFlyerEmailOfferRow);
}

function mapWeeklyWatchlistPriceChangeRow(row: WeeklyWatchlistPriceChangeRow): WeeklyWatchlistPriceChange {
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    brand: nullableString(row.brand),
    chainSlug: nullableString(row.chain_slug),
    chainName: nullableString(row.chain_name),
    storeSlug: nullableString(row.store_slug),
    storeName: nullableString(row.store_name),
    priceType: row.price_type,
    currentPrice: numeric(row.current_price),
    previousPrice: numeric(row.previous_price),
    changeAmount: numeric(row.change_amount),
    changePercent: numeric(row.change_percent),
    currency: row.currency,
    observedAt: row.observed_at instanceof Date ? row.observed_at.toISOString() : row.observed_at,
    confidence: numeric(row.confidence)
  };
}

function mapMyFlyerEmailOfferRow(row: MyFlyerEmailOfferRow): MyFlyerEmailOffer {
  return {
    productId: row.product_id,
    productName: row.product_name,
    brand: nullableString(row.brand),
    chainName: row.chain_name,
    storeName: nullableString(row.store_name),
    offerPrice: numeric(row.offer_price),
    regularPrice: nullableNumeric(row.regular_price),
    unitPrice: nullableNumeric(row.unit_price),
    currency: row.currency,
    validUntil: row.valid_until instanceof Date ? row.valid_until.toISOString() : nullableString(row.valid_until),
    imageUrl: nullableString(row.image_url),
    sourceUrl: nullableString(row.source_url),
    confidence: numeric(row.confidence)
  };
}

export async function runWeeklyDigestCli(env: WeeklyDigestEnv = process.env): Promise<WeeklyDigestCliResult> {
  const databaseUrl = requiredEnv(env, 'DATABASE_URL');
  const baseUrl = env.GROCERYVIEW_BASE_URL?.trim() || 'https://groceryview.se';
  const now = env.WEEKLY_DIGEST_NOW?.trim() || new Date().toISOString();
  const maxChangesPerUser = env.WEEKLY_DIGEST_MAX_CHANGES_PER_USER
    ? Number(env.WEEKLY_DIGEST_MAX_CHANGES_PER_USER)
    : defaultMaxChangesPerUser;
  const emailClient = createWeeklyDigestResendClientFromEnv(env);
  const pgModule = await importPgModule();
  const pool = new pgModule.Pool({ connectionString: databaseUrl });

  try {
    const result = await runWeeklyDigestJob({
      baseUrl,
      emailClient,
      executor: createPgQueryExecutor(pool),
      maxChangesPerUser,
      now
    });
    return {
      ...result,
      status: result.sent.length > 0 ? 'sent' : result.subscriptionCount === 0 ? 'no_recipients' : 'no_changes'
    };
  } finally {
    await pool.end();
  }
}

export async function runMyFlyerDigestCli(env: WeeklyDigestEnv = process.env): Promise<MyFlyerDigestCliResult> {
  const databaseUrl = requiredEnv(env, 'DATABASE_URL');
  const baseUrl = env.GROCERYVIEW_BASE_URL?.trim() || 'https://groceryview.se';
  const now = env.WEEKLY_DIGEST_NOW?.trim() || new Date().toISOString();
  const maxOffersPerUser = env.MY_FLYER_DIGEST_MAX_OFFERS_PER_USER
    ? Number(env.MY_FLYER_DIGEST_MAX_OFFERS_PER_USER)
    : defaultMaxChangesPerUser;
  const countries = (env.MY_FLYER_DIGEST_COUNTRIES?.split(',') ?? ['se', 'no', 'dk', 'fi']).map((country) => country.trim());
  const emailClient = createWeeklyDigestResendClientFromEnv(env);
  const pgModule = await importPgModule();
  const pool = new pgModule.Pool({ connectionString: databaseUrl });

  try {
    const result = await runMyFlyerDigestJob({
      baseUrl,
      countries,
      emailClient,
      executor: createPgQueryExecutor(pool),
      maxOffersPerUser,
      now
    });
    return {
      ...result,
      status: result.sent.length > 0 ? 'sent' : result.subscriptionCount === 0 ? 'no_recipients' : 'no_offers'
    };
  } finally {
    await pool.end();
  }
}

function requiredEnv(env: WeeklyDigestEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = (await loadModule('pg')) as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

function buildProductUrl(baseUrl: string, productIdOrSlug: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/product/${encodeURIComponent(productIdOrSlug)}`;
}

function buildPreferencesUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/watchlist`;
}

function formatPrice(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

function formatSignedMoney(value: number, currency: string): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} ${currency}`;
}

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDateTime(value: string): string {
  return new Date(value).toISOString().replace('T', ' ').slice(0, 16).concat(' UTC');
}

function humanizePriceType(value: string): string {
  return value.replace(/_/g, ' ');
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value)) return defaultMaxChangesPerUser;
  return Math.min(Math.max(Math.trunc(value), 1), 25);
}

function normalizeCountries(values: string[]): string[] {
  const countries = values.map(normalizeCountry).filter(Boolean);
  return [...new Set(countries.length > 0 ? countries : ['se'])];
}

function normalizeCountry(value: string): string {
  return value.trim().toLowerCase().slice(0, 2);
}

function nullableString(value: string | null | undefined): string | undefined {
  return value === null || value === undefined || value.trim() === '' ? undefined : value;
}

function numeric(value: string | number): number {
  const result = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(result)) throw new Error(`Invalid weekly digest numeric value: ${value}`);
  return result;
}

function nullableNumeric(value: string | number | null): number | undefined {
  if (value === null) return undefined;
  return numeric(value);
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(entrypoint).href);
}

if (isMainModule()) {
  runMyFlyerDigestCli()
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
