export type RollingAverageDealQuery = {
  sql: string;
  values: [asOf: string, category: string | null];
};

export type RollingAverageDealRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  category_path: string[] | null;
  store_id: string;
  store_slug: string;
  store_name: string;
  chain_id: string;
  chain_slug: string;
  chain_name: string;
  current_price: string | number;
  currency: string;
  observed_at: string | Date;
  rolling_average_price: string | number;
  discount_percentage: string | number;
};

export type RollingAverageDeal = {
  productId: string;
  productSlug: string;
  productName: string;
  category: string;
  categoryPath: string[];
  storeId: string;
  storeSlug: string;
  storeName: string;
  chainId: string;
  chainSlug: string;
  chainName: string;
  currentPrice: number;
  rollingAveragePrice: number;
  discountPercentage: number;
  currency: string;
  observedAt: string;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function buildRollingAverageDealsQuery(asOf: string, category?: string): RollingAverageDealQuery {
  return {
    sql: `with current_prices as (
            select latest_prices.product_id,
                   latest_prices.store_id,
                   latest_prices.chain_id,
                   latest_prices.price,
                   latest_prices.currency,
                   latest_prices.observed_at
              from latest_prices
             where latest_prices.domain = 'grocery'
               and coalesce(latest_prices.is_available, true) = true
               and latest_prices.price > 0
               and latest_prices.observed_at <= $1::timestamptz
          ),
          rolling_averages as (
            select current_prices.product_id,
                   current_prices.store_id,
                   avg(observations.price) as rolling_average_price
              from current_prices
              join observations
                on observations.product_id = current_prices.product_id
               and observations.store_id = current_prices.store_id
               and observations.price > 0
               and observations.observed_at > ($1::timestamptz - interval '30 days')
               and observations.observed_at <= $1::timestamptz
             group by current_prices.product_id, current_prices.store_id
          )
          select products.id::text as product_id,
                 products.slug as product_slug,
                 products.canonical_name as product_name,
                 products.category_path,
                 stores.id::text as store_id,
                 stores.slug as store_slug,
                 stores.name as store_name,
                 chains.id::text as chain_id,
                 chains.slug as chain_slug,
                 chains.name as chain_name,
                 current_prices.price as current_price,
                 current_prices.currency,
                 current_prices.observed_at,
                 rolling_averages.rolling_average_price,
                 round(((rolling_averages.rolling_average_price - current_prices.price) / rolling_averages.rolling_average_price * 100)::numeric, 2) as discount_percentage
            from current_prices
            join rolling_averages
              on rolling_averages.product_id = current_prices.product_id
             and rolling_averages.store_id = current_prices.store_id
            join products on products.id = current_prices.product_id
            join stores on stores.id = current_prices.store_id
            join chains on chains.id = current_prices.chain_id
           where current_prices.price < rolling_averages.rolling_average_price
             and ($2::text is null or exists (select 1 from unnest(products.category_path) category where lower(category) = lower($2::text)))
           order by discount_percentage desc, products.canonical_name asc, stores.name asc`,
    values: [asOf, category?.trim() ? category.trim() : null]
  };
}

export function mapRollingAverageDealRow(row: RollingAverageDealRow): RollingAverageDeal {
  const categoryPath = row.category_path?.filter((part) => part.trim().length > 0) ?? [];

  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    category: categoryPath[0] ?? 'uncategorized',
    categoryPath,
    storeId: row.store_id,
    storeSlug: row.store_slug,
    storeName: row.store_name,
    chainId: row.chain_id,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    currentPrice: Number(row.current_price),
    rollingAveragePrice: Number(row.rolling_average_price),
    discountPercentage: Number(row.discount_percentage),
    currency: row.currency,
    observedAt: iso(row.observed_at)
  };
}
