export type ProductStoreVolatilityQueryOptions = {
  productId: string;
  storeIds: string[];
  days?: number;
};

export type ProductStoreVolatilityQuery = {
  sql: string;
  values: [productId: string, storeIds: string[], days: number];
};

export type ProductStoreVolatilityRow = {
  product_id: string;
  store_id: string;
  sample_count: string | number;
  min_price: string | number;
  max_price: string | number;
  average_price: string | number;
  volatility_score: string | number;
};

export type ProductStoreVolatilityResult = {
  productId: string;
  storeId: string;
  sampleCount: number;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  volatilityScore: number;
  source: 'postgres.price_daily_or_latest_prices';
};

export type ProductStoreVolatilityQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

function boundedDays(days: number | undefined): number {
  if (typeof days !== 'number' || !Number.isFinite(days)) return 30;
  return Math.min(Math.max(Math.trunc(days), 2), 180);
}

export function buildProductStoreVolatilityQuery(options: ProductStoreVolatilityQueryOptions): ProductStoreVolatilityQuery | null {
  const storeIds = [...new Set(options.storeIds.map((storeId) => storeId.trim()).filter(Boolean))];
  if (!options.productId.trim() || storeIds.length === 0) return null;

  return {
    sql: `with daily_history as (
            select product_id::text,
                   store_id::text,
                   observed_on::date as observed_on,
                   avg(price)::numeric as price
              from price_daily
             where product_id = $1::uuid
               and store_id = any($2::uuid[])
               and observed_on >= current_date - ($3::int * interval '1 day')
             group by product_id, store_id, observed_on
            union all
            select product_id::text,
                   store_id::text,
                   observed_at::date as observed_on,
                   avg(price)::numeric as price
              from latest_prices
             where product_id = $1::uuid
               and store_id = any($2::uuid[])
               and observed_at >= now() - ($3::int * interval '1 day')
             group by product_id, store_id, observed_at::date
          )
          select product_id,
                 store_id,
                 count(*) as sample_count,
                 min(price) as min_price,
                 max(price) as max_price,
                 avg(price) as average_price,
                 case when avg(price) = 0 then 0 else coalesce(stddev_pop(price) / avg(price) * 100, 0) end as volatility_score
            from daily_history
           group by product_id, store_id
           order by volatility_score desc, store_id asc`,
    values: [options.productId.trim(), storeIds, boundedDays(options.days)]
  };
}

export function mapProductStoreVolatilityRow(row: ProductStoreVolatilityRow): ProductStoreVolatilityResult {
  return {
    productId: row.product_id,
    storeId: row.store_id,
    sampleCount: Number(row.sample_count),
    minPrice: Number(row.min_price),
    maxPrice: Number(row.max_price),
    averagePrice: Number(row.average_price),
    volatilityScore: Number(row.volatility_score),
    source: 'postgres.price_daily_or_latest_prices'
  };
}

export async function listProductStoreVolatility(
  executor: ProductStoreVolatilityQueryExecutor,
  options: ProductStoreVolatilityQueryOptions
): Promise<ProductStoreVolatilityResult[]> {
  const query = buildProductStoreVolatilityQuery(options);
  if (!query) return [];

  const rows = await executor.query<ProductStoreVolatilityRow>(query.sql, query.values);
  return rows.map(mapProductStoreVolatilityRow);
}
