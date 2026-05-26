import { ACTIVE_PRODUCTS_PREDICATE } from './items.js';

export type BackInStockAvailabilityQueryOptions = {
  limit?: number;
  lookbackDays?: number;
};

export type BackInStockAvailabilityQuery = {
  sql: string;
  values: [productSlugOrId: string, lookbackDays: number, limit: number];
};

export type BackInStockAvailabilityRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  store_id: string | null;
  store_slug: string | null;
  store_name: string;
  chain_slug: string;
  chain_name: string;
  current_observed_at: string | Date;
  previous_out_of_stock_at: string | Date;
  price: string | number;
  currency: string;
};

export type BackInStockAvailability = {
  productId: string;
  productSlug: string;
  productName: string;
  storeId: string | null;
  storeSlug: string | null;
  storeName: string;
  chainSlug: string;
  chainName: string;
  currentObservedAt: string;
  previousOutOfStockAt: string;
  price: number;
  currency: string;
};

export type AvailabilityQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

function clampLookbackDays(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 14;
  return Math.min(Math.max(Math.trunc(value), 1), 90);
}

function clampLimit(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 3;
  return Math.min(Math.max(Math.trunc(value), 1), 10);
}

function asIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

export function buildBackInStockAvailabilityQuery(
  productSlugOrId: string,
  options: BackInStockAvailabilityQueryOptions = {}
): BackInStockAvailabilityQuery {
  return {
    sql: `with current_available as (
            select products.id::text as product_id,
                   products.slug as product_slug,
                   products.canonical_name as product_name,
                   latest_prices.chain_id,
                   latest_prices.store_id,
                   latest_prices.domain,
                   latest_prices.price_type,
                   stores.slug as store_slug,
                   coalesce(stores.name, chains.name) as store_name,
                   chains.slug as chain_slug,
                   chains.name as chain_name,
                   latest_prices.observed_at as current_observed_at,
                   latest_prices.price,
                   latest_prices.currency
              from latest_prices
              join products on products.id = latest_prices.product_id
              join chains on chains.id = latest_prices.chain_id
              left join stores on stores.id = latest_prices.store_id
             where (products.slug = $1 or products.id::text = $1)
               and latest_prices.domain = 'grocery'
               and coalesce(latest_prices.is_available, true) = true
               and ${ACTIVE_PRODUCTS_PREDICATE}
          )
          select current_available.*,
                 previous_outage.observed_at as previous_out_of_stock_at
            from current_available
            join lateral (
              select observations.observed_at
                from observations
               where observations.product_id::text = current_available.product_id
                 and observations.chain_id = current_available.chain_id
                 and observations.store_id is not distinct from current_available.store_id
                 and observations.domain = current_available.domain
                 and observations.price_type = current_available.price_type
                 and observations.observed_at < current_available.current_observed_at
                 and observations.observed_at >= current_available.current_observed_at - ($2::int * interval '1 day')
                 and coalesce(observations.is_available, true) = false
               order by observations.observed_at desc
               limit 1
            ) previous_outage on true
           order by current_available.current_observed_at desc, current_available.store_name asc
           limit $3`,
    values: [productSlugOrId, clampLookbackDays(options.lookbackDays), clampLimit(options.limit)]
  };
}

export function mapBackInStockAvailabilityRow(row: BackInStockAvailabilityRow): BackInStockAvailability {
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    storeId: row.store_id,
    storeSlug: row.store_slug,
    storeName: row.store_name,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    currentObservedAt: asIso(row.current_observed_at),
    previousOutOfStockAt: asIso(row.previous_out_of_stock_at),
    price: Number(row.price),
    currency: row.currency
  };
}

export async function findBackInStockAvailability(
  executor: AvailabilityQueryExecutor,
  productSlugOrId: string,
  options: BackInStockAvailabilityQueryOptions = {}
): Promise<BackInStockAvailability[]> {
  const query = buildBackInStockAvailabilityQuery(productSlugOrId, options);
  const rows = await executor.query<BackInStockAvailabilityRow>(query.sql, query.values);
  return rows.map(mapBackInStockAvailabilityRow);
}
