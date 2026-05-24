export type FavoritesSortMode = 'name' | 'price';

export type FavoritesListQueryOptions = {
  sort?: FavoritesSortMode;
  limit?: number;
};

export type FavoritesListQuery = {
  sql: string;
  values: [userId: string, limit: number];
};

export type FavoriteItemRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  cheapest_price: string | number | null;
  currency: string | null;
  cheapest_store_id: string | null;
  cheapest_store_slug: string | null;
  cheapest_store_name: string | null;
  observed_at: string | Date | null;
  added_at: string | Date;
};

export type FavoriteItem = {
  productId: string;
  productSlug: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  cheapestPrice: number | null;
  currency: string | null;
  cheapestStoreId: string | null;
  cheapestStoreSlug: string | null;
  cheapestStoreName: string | null;
  observedAt: string | null;
  addedAt: string;
};

function clampLimit(limit: number | undefined) {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return 50;
  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

function normalizeSort(sort: FavoritesSortMode | undefined): FavoritesSortMode {
  return sort === 'price' ? 'price' : 'name';
}

function iso(value: string | Date | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function numberOrNull(value: string | number | null): number | null {
  if (value === null) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

export function buildFavoritesListQuery(userId: string, options: FavoritesListQueryOptions = {}): FavoritesListQuery {
  const sort = normalizeSort(options.sort);
  const orderBy = sort === 'price'
    ? 'cheapest_price asc nulls last, product_name asc'
    : 'product_name asc, cheapest_price asc nulls last';

  return {
    sql: `with ranked_prices as (
            select latest_prices.product_id,
                   latest_prices.store_id,
                   latest_prices.price,
                   latest_prices.currency,
                   latest_prices.observed_at,
                   row_number() over (partition by latest_prices.product_id order by latest_prices.price asc, latest_prices.observed_at desc, latest_prices.store_id nulls last) as price_rank
              from latest_prices
             where latest_prices.domain = 'grocery'
               and coalesce(latest_prices.is_available, true) = true
               and latest_prices.price >= 0
          )
          select products.id::text as product_id,
                 products.slug as product_slug,
                 products.canonical_name as product_name,
                 products.brand,
                 products.image_url,
                 ranked_prices.price as cheapest_price,
                 ranked_prices.currency,
                 stores.id::text as cheapest_store_id,
                 stores.slug as cheapest_store_slug,
                 stores.name as cheapest_store_name,
                 ranked_prices.observed_at,
                 watchlist_items.created_at as added_at
            from watchlist_items
            join products on products.id = watchlist_items.product_id
            left join ranked_prices on ranked_prices.product_id = products.id and ranked_prices.price_rank = 1
            left join stores on stores.id = ranked_prices.store_id
           where watchlist_items.user_id = $1
           order by ${orderBy}
           limit $2`,
    values: [userId, clampLimit(options.limit)]
  };
}

export function mapFavoriteItemRow(row: FavoriteItemRow): FavoriteItem {
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    brand: row.brand,
    imageUrl: row.image_url,
    cheapestPrice: numberOrNull(row.cheapest_price),
    currency: row.currency,
    cheapestStoreId: row.cheapest_store_id,
    cheapestStoreSlug: row.cheapest_store_slug,
    cheapestStoreName: row.cheapest_store_name,
    observedAt: iso(row.observed_at),
    addedAt: iso(row.added_at) ?? ''
  };
}
