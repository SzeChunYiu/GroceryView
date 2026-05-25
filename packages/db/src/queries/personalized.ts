export type PersonalizedWeeklyDigestQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type PersonalizedWeeklyDigestQueryOptions = {
  since: string;
  until: string;
  limitPerUser?: number;
};

export type PersonalizedWeeklyDigestQuery = {
  sql: string;
  values: [since: string, until: string, limitPerUser: number];
};

export type PersonalizedWeeklyDigestDealRow = {
  user_id: string;
  recipient_email: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  chain_slug: string;
  chain_name: string;
  store_slug: string | null;
  store_name: string | null;
  price_type: string;
  price: string | number;
  regular_price: string | number | null;
  unit_price: string | number | null;
  currency: string;
  observed_at: string | Date;
  interest_sources: string[];
};

export type PersonalizedWeeklyDigestDeal = {
  productId: string;
  productSlug: string;
  productName: string;
  brand: string | null;
  chainSlug: string;
  chainName: string;
  storeSlug: string | null;
  storeName: string | null;
  priceType: string;
  price: number;
  regularPrice: number | null;
  unitPrice: number | null;
  currency: string;
  observedAt: string;
  interestSources: string[];
};

export type PersonalizedWeeklyDigestRecipient = {
  userId: string;
  email: string;
  deals: PersonalizedWeeklyDigestDeal[];
};

const DEFAULT_DIGEST_LIMIT = 10;
const MAX_DIGEST_LIMIT = 10;

function clampDigestLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_DIGEST_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_DIGEST_LIMIT);
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function numberOrNull(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildPersonalizedWeeklyDigestQuery(options: PersonalizedWeeklyDigestQueryOptions): PersonalizedWeeklyDigestQuery {
  const limit = clampDigestLimit(options.limitPerUser);

  return {
    sql: `/* personalized_weekly_digest */
          with opted_in_users as (
            select app_users.id as user_id,
                   app_users.email as recipient_email
              from app_users
              join user_preferences on user_preferences.user_id = app_users.id
             where app_users.email is not null
               and user_preferences.notification_channels @> array['email']::text[]
          ),
          user_interest_products as (
            select user_product_searches.user_id,
                   user_product_searches.product_id,
                   'search'::text as source
              from user_product_searches
             where user_product_searches.searched_at >= $1::timestamptz - interval '90 days'
               and user_product_searches.searched_at < $2::timestamptz
            union all
            select watchlist_items.user_id,
                   watchlist_items.product_id,
                   'watchlist'::text as source
              from watchlist_items
            union all
            select weekly_baskets.user_id,
                   basket_items.product_id,
                   'basket'::text as source
              from weekly_baskets
              join basket_items on basket_items.basket_id = weekly_baskets.id
          ),
          user_interest_summary as (
            select opted_in_users.user_id,
                   opted_in_users.recipient_email,
                   user_interest_products.product_id,
                   array_agg(distinct user_interest_products.source order by user_interest_products.source) as interest_sources
              from opted_in_users
              join user_interest_products on user_interest_products.user_id = opted_in_users.user_id
             group by opted_in_users.user_id, opted_in_users.recipient_email, user_interest_products.product_id
          ),
          ranked_deals as (
            select user_interest_summary.user_id,
                   user_interest_summary.recipient_email,
                   user_interest_summary.interest_sources,
                   products.id::text as product_id,
                   products.slug as product_slug,
                   products.canonical_name as product_name,
                   products.brand,
                   chains.slug as chain_slug,
                   chains.name as chain_name,
                   stores.slug as store_slug,
                   stores.name as store_name,
                   latest_prices.price_type,
                   latest_prices.price,
                   latest_prices.regular_price,
                   latest_prices.unit_price,
                   latest_prices.currency,
                   latest_prices.observed_at,
                   row_number() over (
                     partition by user_interest_summary.user_id
                     order by latest_prices.price asc,
                              latest_prices.observed_at desc,
                              products.canonical_name asc,
                              chains.name asc,
                              stores.name asc nulls last,
                              latest_prices.price_type asc
                   ) as deal_rank
              from user_interest_summary
              join latest_prices on latest_prices.product_id::text = user_interest_summary.product_id::text
              join products on products.id = latest_prices.product_id
              join chains on chains.id = latest_prices.chain_id
              left join stores on stores.id = latest_prices.store_id
             where latest_prices.domain = 'grocery'
               and coalesce(latest_prices.is_available, true) = true
               and latest_prices.price >= 0
               and latest_prices.observed_at >= $1::timestamptz
               and latest_prices.observed_at < $2::timestamptz
          )
          select user_id,
                 recipient_email,
                 product_id,
                 product_slug,
                 product_name,
                 brand,
                 chain_slug,
                 chain_name,
                 store_slug,
                 store_name,
                 price_type,
                 price,
                 regular_price,
                 unit_price,
                 currency,
                 observed_at,
                 interest_sources
            from ranked_deals
           where deal_rank <= $3
           order by user_id, deal_rank`,
    values: [options.since, options.until, limit]
  };
}

export function mapPersonalizedWeeklyDigestDealRow(row: PersonalizedWeeklyDigestDealRow): PersonalizedWeeklyDigestDeal {
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    brand: row.brand,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    storeSlug: row.store_slug,
    storeName: row.store_name,
    priceType: row.price_type,
    price: Number(row.price),
    regularPrice: numberOrNull(row.regular_price),
    unitPrice: numberOrNull(row.unit_price),
    currency: row.currency,
    observedAt: iso(row.observed_at),
    interestSources: row.interest_sources
  };
}

export function mapPersonalizedWeeklyDigestRows(rows: PersonalizedWeeklyDigestDealRow[]): PersonalizedWeeklyDigestRecipient[] {
  const recipients = new Map<string, PersonalizedWeeklyDigestRecipient>();

  for (const row of rows) {
    const key = `${row.user_id}::${row.recipient_email}`;
    const recipient = recipients.get(key) ?? {
      userId: row.user_id,
      email: row.recipient_email,
      deals: []
    };
    recipient.deals.push(mapPersonalizedWeeklyDigestDealRow(row));
    recipients.set(key, recipient);
  }

  return [...recipients.values()];
}

export async function listPersonalizedWeeklyDigestRecipients(
  executor: PersonalizedWeeklyDigestQueryExecutor,
  options: PersonalizedWeeklyDigestQueryOptions
): Promise<PersonalizedWeeklyDigestRecipient[]> {
  const query = buildPersonalizedWeeklyDigestQuery(options);
  const rows = await executor.query<PersonalizedWeeklyDigestDealRow>(query.sql, query.values);
  return mapPersonalizedWeeklyDigestRows(rows);
}
