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

const defaultMaxChangesPerUser = 10;
const weeklyDigestDays = 7;
const weeklyDigestType = 'weekly_personalized_digest';

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

export type WeeklyDigestDeal = {
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
  regularPrice?: number;
  savingsAmount?: number;
  savingsPercent?: number;
  currency: string;
  observedAt: string;
  confidence: number;
  reason: string;
};

export type WeeklyBasketPriceChange = WeeklyWatchlistPriceChange & {
  quantity: number;
  basketWeekStart: string;
};

export type BuildWeeklyDigestEmailInput = {
  baseUrl: string;
  basketChanges?: WeeklyBasketPriceChange[];
  bestDeals?: WeeklyDigestDeal[];
  items: WeeklyWatchlistPriceChange[];
  now: string;
  preferredStoreDeals?: WeeklyDigestDeal[];
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

export type WeeklyDigestJobSent = {
  userId: string;
  recipientEmail: string;
  messageId: string;
  itemCount: number;
};

export type WeeklyDigestJobSkipped = {
  userId: string;
  recipientEmail: string;
  reason: 'missing_recipient_email' | 'no_personalized_digest_items';
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

type WeeklyDigestDealRow = {
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
  regular_price: string | number | null;
  savings_amount: string | number | null;
  savings_percent: string | number | null;
  currency: string;
  observed_at: string | Date;
  confidence: string | number;
  reason: string;
};

type WeeklyBasketPriceChangeRow = WeeklyWatchlistPriceChangeRow & {
  quantity: string | number;
  basket_week_start: string | Date;
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
    const bestDeals = await listWeeklyBestDeals(input.executor, {
      limit: maxChangesPerUser,
      userId: subscription.userId,
      window
    });
    const basketChanges = await listWeeklyBasketPriceChanges(input.executor, {
      limit: maxChangesPerUser,
      userId: subscription.userId,
      window
    });
    const preferredStoreDeals = await listWeeklyPreferredStoreDeals(input.executor, {
      limit: maxChangesPerUser,
      userId: subscription.userId,
      window
    });
    const itemCount = items.length + bestDeals.length + basketChanges.length + preferredStoreDeals.length;

    if (itemCount === 0) {
      skipped.push({
        userId: subscription.userId,
        recipientEmail: subscription.recipientEmail,
        reason: 'no_personalized_digest_items'
      });
      continue;
    }

    const message = buildWeeklyDigestEmail({
      baseUrl: input.baseUrl,
      basketChanges,
      bestDeals,
      items,
      now,
      preferredStoreDeals,
      recipientEmail: subscription.recipientEmail,
      userId: subscription.userId,
      window
    });
    const messageId = await input.emailClient.send(message);
    sent.push({
      userId: subscription.userId,
      recipientEmail: subscription.recipientEmail,
      messageId,
      itemCount
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

export function buildWeeklyDigestEmail(input: BuildWeeklyDigestEmailInput): TransactionalEmailMessage {
  const bestDeals = input.bestDeals ?? [];
  const basketChanges = input.basketChanges ?? [];
  const preferredStoreDeals = input.preferredStoreDeals ?? [];
  const itemCount = input.items.length + bestDeals.length + basketChanges.length + preferredStoreDeals.length;
  const sections = [
    buildPriceChangeSection({
      baseUrl: input.baseUrl,
      items: input.items,
      now: input.now,
      title: 'Watchlist price changes'
    }),
    buildDealSection({
      baseUrl: input.baseUrl,
      items: bestDeals,
      now: input.now,
      title: 'Best deals from your saved items'
    }),
    buildBasketChangeSection({
      baseUrl: input.baseUrl,
      items: basketChanges,
      now: input.now,
      title: 'Basket changes since your last planning window'
    }),
    buildDealSection({
      baseUrl: input.baseUrl,
      items: preferredStoreDeals,
      now: input.now,
      title: 'Preferred-store deals'
    })
  ].filter((section): section is string[] => section.length > 0);

  const text = [
    'Here is your weekly personalized savings digest from GroceryView.',
    '',
    `Digest window: ${formatDate(input.window.since)} to ${formatDate(input.window.until)}`,
    `Included verified rows: ${itemCount}`,
    '',
    ...sections.flatMap((section) => [...section, '']),
    'Sections without verified rows were omitted to keep this email focused.',
    'Every item above comes from persisted GroceryView price observations or latest-price rows; no synthetic, estimated, or forecast-only rows are included.',
    'Confidence is the stored source confidence for the row, and freshness is calculated from the item observation time.',
    `Manage notification preferences: ${buildPreferencesUrl(input.baseUrl)}`,
    `Unsubscribe from weekly email digests: ${buildUnsubscribeUrl(input.baseUrl, input.recipientEmail)}`,
    '',
    `Sent at: ${input.now}`
  ].join('\n');

  return {
    to: input.recipientEmail,
    subject: 'Your GroceryView weekly savings digest',
    text,
    metadata: {
      type: weeklyDigestType,
      userId: input.userId,
      itemCount: String(itemCount),
      sendAt: input.now
    }
  };
}

function buildPriceChangeSection(input: {
  baseUrl: string;
  items: WeeklyWatchlistPriceChange[];
  now: string;
  title: string;
}): string[] {
  if (input.items.length === 0) return [];

  return [
    `${input.title}:`,
    ...input.items.flatMap((item, index) => {
      const location = [item.chainName, item.storeName].filter(Boolean).join(' · ');
      const productUrl = buildProductUrl(input.baseUrl, item.productSlug || item.productId);
      return [
        `${index + 1}. ${item.productName}${item.brand ? ` (${item.brand})` : ''}`,
        `   ${formatPrice(item.previousPrice, item.currency)} -> ${formatPrice(item.currentPrice, item.currency)} (${formatSignedPercent(item.changePercent)}, ${formatSignedMoney(item.changeAmount, item.currency)})`,
        `   ${location || 'GroceryView'} · ${humanizePriceType(item.priceType)} · observed ${formatDateTime(item.observedAt)} · freshness ${formatFreshness(item.observedAt, input.now)} · confidence ${Math.round(item.confidence * 100)}%`,
        `   ${productUrl}`
      ];
    })
  ];
}

function buildBasketChangeSection(input: {
  baseUrl: string;
  items: WeeklyBasketPriceChange[];
  now: string;
  title: string;
}): string[] {
  if (input.items.length === 0) return [];

  return [
    `${input.title}:`,
    ...input.items.flatMap((item, index) => {
      const location = [item.chainName, item.storeName].filter(Boolean).join(' · ');
      const productUrl = buildProductUrl(input.baseUrl, item.productSlug || item.productId);
      return [
        `${index + 1}. ${item.productName}${item.brand ? ` (${item.brand})` : ''}`,
        `   Basket qty ${formatQuantity(item.quantity)} from week ${formatDate(item.basketWeekStart)} · ${formatPrice(item.previousPrice, item.currency)} -> ${formatPrice(item.currentPrice, item.currency)} (${formatSignedPercent(item.changePercent)}, ${formatSignedMoney(item.changeAmount, item.currency)})`,
        `   ${location || 'GroceryView'} · ${humanizePriceType(item.priceType)} · observed ${formatDateTime(item.observedAt)} · freshness ${formatFreshness(item.observedAt, input.now)} · confidence ${Math.round(item.confidence * 100)}%`,
        `   ${productUrl}`
      ];
    })
  ];
}

function buildDealSection(input: {
  baseUrl: string;
  items: WeeklyDigestDeal[];
  now: string;
  title: string;
}): string[] {
  if (input.items.length === 0) return [];

  return [
    `${input.title}:`,
    ...input.items.flatMap((item, index) => {
      const location = [item.chainName, item.storeName].filter(Boolean).join(' · ');
      const savings = formatSavings(item);
      const productUrl = buildProductUrl(input.baseUrl, item.productSlug || item.productId);
      return [
        `${index + 1}. ${item.productName}${item.brand ? ` (${item.brand})` : ''}`,
        `   ${formatPrice(item.currentPrice, item.currency)}${savings ? ` · ${savings}` : ''}`,
        `   ${location || 'GroceryView'} · ${humanizePriceType(item.priceType)} · ${item.reason} · observed ${formatDateTime(item.observedAt)} · freshness ${formatFreshness(item.observedAt, input.now)} · confidence ${Math.round(item.confidence * 100)}%`,
        `   ${productUrl}`
      ];
    })
  ];
}

async function listWeeklyDigestSubscriptions(executor: QueryExecutor): Promise<WeeklyDigestSubscription[]> {
  const rows = await executor.query<WeeklyDigestSubscriptionRow>(
    `/* weekly_digest_subscriptions */
     select distinct on (notification_subscriptions.user_id)
            notification_subscriptions.user_id,
            notification_subscriptions.recipient as recipient_email
       from notification_subscriptions
       left join user_preferences on user_preferences.user_id = notification_subscriptions.user_id
      where notification_subscriptions.active = true
        and notification_subscriptions.channel = 'email'
        and notification_subscriptions.product_id is null
        and nullif(btrim(notification_subscriptions.recipient), '') is not null
        and lower(coalesce(user_preferences.notification_preferences #>> '{weekly_digest,email}', 'true')) not in ('false', 'paused', 'disabled')
        and lower(coalesce(user_preferences.notification_preferences #>> '{weekly_personalized_digest,email}', 'true')) not in ('false', 'paused', 'disabled')
        and not exists (
          select 1
            from notification_suppressions
           where notification_suppressions.active = true
             and notification_suppressions.channel = 'email'
             and lower(notification_suppressions.recipient) = lower(notification_subscriptions.recipient)
        )
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

async function listWeeklyBestDeals(
  executor: QueryExecutor,
  input: { userId: string; window: WeeklyDigestWindow; limit: number }
): Promise<WeeklyDigestDeal[]> {
  const rows = await executor.query<WeeklyDigestDealRow>(
    `/* weekly_best_deals */
     with interest_products as (
       select watchlist_items.product_id::text as product_id,
              'watchlist'::text as reason
         from watchlist_items
        where watchlist_items.user_id = $1
          and watchlist_items.product_id is not null
       union all
       select basket_items.product_id::text as product_id,
              'saved basket'::text as reason
         from weekly_baskets
         join basket_items on basket_items.basket_id = weekly_baskets.id
        where weekly_baskets.user_id = $1
          and basket_items.product_id is not null
     ), deal_candidates as (
       select products.id::text as product_id,
              products.slug as product_slug,
              products.canonical_name as product_name,
              products.brand,
              chains.slug as chain_slug,
              chains.name as chain_name,
              stores.slug as store_slug,
              stores.name as store_name,
              latest_prices.price_type,
              latest_prices.price as current_price,
              latest_prices.regular_price,
              case
                when latest_prices.regular_price is not null and latest_prices.regular_price > latest_prices.price
                  then round((latest_prices.regular_price - latest_prices.price)::numeric, 2)
                else null
              end as savings_amount,
              case
                when latest_prices.regular_price is not null and latest_prices.regular_price > 0 and latest_prices.regular_price > latest_prices.price
                  then round((((latest_prices.regular_price - latest_prices.price) / latest_prices.regular_price) * 100)::numeric, 2)
                else null
              end as savings_percent,
              latest_prices.currency,
              latest_prices.observed_at,
              latest_prices.confidence,
              string_agg(distinct interest_products.reason, ', ' order by interest_products.reason) as reason
         from interest_products
         join latest_prices on latest_prices.product_id::text = interest_products.product_id
         join products on products.id = latest_prices.product_id
         join chains on chains.id = latest_prices.chain_id
         left join stores on stores.id = latest_prices.store_id
        where latest_prices.domain = 'grocery'
          and latest_prices.observed_at >= $2::timestamptz
          and latest_prices.observed_at < $3::timestamptz
          and latest_prices.price >= 0
          and latest_prices.price_type <> 'estimated'
          and coalesce(latest_prices.is_available, true) = true
          and latest_prices.confidence >= 0.6
          and (
            (latest_prices.regular_price is not null and latest_prices.regular_price > latest_prices.price)
            or latest_prices.price_type in ('promotion', 'member')
          )
        group by products.id,
                 products.slug,
                 products.canonical_name,
                 products.brand,
                 chains.slug,
                 chains.name,
                 stores.slug,
                 stores.name,
                 latest_prices.price_type,
                 latest_prices.price,
                 latest_prices.regular_price,
                 latest_prices.currency,
                 latest_prices.observed_at,
                 latest_prices.confidence
     )
     select *
       from deal_candidates
      order by savings_percent desc nulls last,
               savings_amount desc nulls last,
               observed_at desc,
               product_slug,
               chain_slug nulls last,
               store_slug nulls last
      limit $4`,
    [input.userId, input.window.since, input.window.until, input.limit]
  );

  return rows.map(mapWeeklyDigestDealRow);
}

async function listWeeklyBasketPriceChanges(
  executor: QueryExecutor,
  input: { userId: string; window: WeeklyDigestWindow; limit: number }
): Promise<WeeklyBasketPriceChange[]> {
  const rows = await executor.query<WeeklyBasketPriceChangeRow>(
    `/* weekly_basket_price_changes */
     with basket_products as (
       select basket_items.product_id::text as product_id,
              max(basket_items.quantity) as quantity,
              max(weekly_baskets.week_start) as basket_week_start
         from weekly_baskets
         join basket_items on basket_items.basket_id = weekly_baskets.id
        where weekly_baskets.user_id = $1
          and basket_items.product_id is not null
          and weekly_baskets.week_start >= ($3::timestamptz::date - 90)
        group by basket_items.product_id
     ), ranked_observations as (
       select products.id as product_id,
              products.slug as product_slug,
              products.canonical_name as product_name,
              products.brand,
              basket_products.quantity,
              basket_products.basket_week_start,
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
         join basket_products on basket_products.product_id = observations.product_id::text
         join products on products.id = observations.product_id
         join chains on chains.id = observations.chain_id
         left join stores on stores.id = observations.store_id
        where observations.domain = 'grocery'
          and observations.observed_at >= ($2::timestamptz - interval '7 days')
          and observations.observed_at < $3::timestamptz
          and observations.price >= 0
          and observations.price_type <> 'estimated'
          and observations.confidence >= 0.6
     ), weekly_changes as (
       select product_id::text as product_id,
              product_slug,
              product_name,
              brand,
              quantity,
              basket_week_start,
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

  return rows.map(mapWeeklyBasketPriceChangeRow);
}

async function listWeeklyPreferredStoreDeals(
  executor: QueryExecutor,
  input: { userId: string; window: WeeklyDigestWindow; limit: number }
): Promise<WeeklyDigestDeal[]> {
  const rows = await executor.query<WeeklyDigestDealRow>(
    `/* weekly_preferred_store_deals */
     with preferred_stores as (
       select stores.id
         from favorite_stores
         join stores on stores.id = favorite_stores.store_id
        where favorite_stores.user_id = $1
       union
       select stores.id
         from user_preferences
         join stores on stores.id = any(user_preferences.favorite_stores)
                  or stores.slug = any(user_preferences.favorite_stores)
                  or stores.name = any(user_preferences.favorite_stores)
        where user_preferences.user_id = $1
     ), deal_candidates as (
       select products.id::text as product_id,
              products.slug as product_slug,
              products.canonical_name as product_name,
              products.brand,
              chains.slug as chain_slug,
              chains.name as chain_name,
              stores.slug as store_slug,
              stores.name as store_name,
              latest_prices.price_type,
              latest_prices.price as current_price,
              latest_prices.regular_price,
              case
                when latest_prices.regular_price is not null and latest_prices.regular_price > latest_prices.price
                  then round((latest_prices.regular_price - latest_prices.price)::numeric, 2)
                else null
              end as savings_amount,
              case
                when latest_prices.regular_price is not null and latest_prices.regular_price > 0 and latest_prices.regular_price > latest_prices.price
                  then round((((latest_prices.regular_price - latest_prices.price) / latest_prices.regular_price) * 100)::numeric, 2)
                else null
              end as savings_percent,
              latest_prices.currency,
              latest_prices.observed_at,
              latest_prices.confidence,
              'preferred store'::text as reason
         from preferred_stores
         join latest_prices on latest_prices.store_id = preferred_stores.id
         join products on products.id = latest_prices.product_id
         join chains on chains.id = latest_prices.chain_id
         join stores on stores.id = latest_prices.store_id
        where latest_prices.domain = 'grocery'
          and latest_prices.observed_at >= $2::timestamptz
          and latest_prices.observed_at < $3::timestamptz
          and latest_prices.price >= 0
          and latest_prices.price_type <> 'estimated'
          and coalesce(latest_prices.is_available, true) = true
          and latest_prices.confidence >= 0.6
          and (
            (latest_prices.regular_price is not null and latest_prices.regular_price > latest_prices.price)
            or latest_prices.price_type in ('promotion', 'member')
          )
     )
     select *
       from deal_candidates
      order by savings_percent desc nulls last,
               savings_amount desc nulls last,
               observed_at desc,
               product_slug,
               chain_slug,
               store_slug
      limit $4`,
    [input.userId, input.window.since, input.window.until, input.limit]
  );

  return rows.map(mapWeeklyDigestDealRow);
}

function mapWeeklyDigestDealRow(row: WeeklyDigestDealRow): WeeklyDigestDeal {
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
    regularPrice: numericOrUndefined(row.regular_price),
    savingsAmount: numericOrUndefined(row.savings_amount),
    savingsPercent: numericOrUndefined(row.savings_percent),
    currency: row.currency,
    observedAt: row.observed_at instanceof Date ? row.observed_at.toISOString() : row.observed_at,
    confidence: numeric(row.confidence),
    reason: row.reason
  };
}

function mapWeeklyBasketPriceChangeRow(row: WeeklyBasketPriceChangeRow): WeeklyBasketPriceChange {
  return {
    ...mapWeeklyWatchlistPriceChangeRow(row),
    quantity: numeric(row.quantity),
    basketWeekStart: row.basket_week_start instanceof Date ? row.basket_week_start.toISOString() : row.basket_week_start
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
  return `${baseUrl.replace(/\/+$/, '')}/account`;
}

function buildUnsubscribeUrl(baseUrl: string, recipientEmail: string): string {
  const url = new URL('/account', baseUrl.replace(/\/+$/, ''));
  url.searchParams.set('unsubscribe', 'weekly_digest');
  url.searchParams.set('channel', 'email');
  url.searchParams.set('email', recipientEmail);
  return url.toString();
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

function formatFreshness(observedAt: string, now: string): string {
  const observed = new Date(observedAt);
  const current = new Date(now);
  if (Number.isNaN(observed.getTime()) || Number.isNaN(current.getTime())) return 'observation time recorded';
  const ageHours = Math.max(0, Math.round((current.getTime() - observed.getTime()) / (60 * 60 * 1000)));
  if (ageHours < 24) return `${ageHours}h old`;
  const ageDays = Math.round(ageHours / 24);
  return `${ageDays}d old`;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatSavings(item: WeeklyDigestDeal): string {
  const parts: string[] = [];
  if (typeof item.regularPrice === 'number') parts.push(`regular ${formatPrice(item.regularPrice, item.currency)}`);
  if (typeof item.savingsAmount === 'number') parts.push(`save ${formatSignedMoney(item.savingsAmount, item.currency).replace(/^\+/, '')}`);
  if (typeof item.savingsPercent === 'number') parts.push(`${item.savingsPercent.toFixed(2)}% below regular`);
  return parts.join(' · ');
}

function humanizePriceType(value: string): string {
  return value.replace(/_/g, ' ');
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value)) return defaultMaxChangesPerUser;
  return Math.min(Math.max(Math.trunc(value), 1), 25);
}

function nullableString(value: string | null): string | undefined {
  return value === null || value.trim() === '' ? undefined : value;
}

function numeric(value: string | number): number {
  const result = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(result)) throw new Error(`Invalid weekly digest numeric value: ${value}`);
  return result;
}

function numericOrUndefined(value: string | number | null): number | undefined {
  if (value === null) return undefined;
  return numeric(value);
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(entrypoint).href);
}

if (isMainModule()) {
  runWeeklyDigestCli()
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
