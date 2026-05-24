export type ComparePriceSnapshotQuery = {
  sql: string;
  values: [itemIds: string[]];
};

export type ComparePriceSnapshotRow = {
  requested_item_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  store_id: string;
  store_slug: string | null;
  store_name: string | null;
  chain_id: string | null;
  chain_slug: string | null;
  chain_name: string | null;
  observation_id: string | null;
  price: string | number;
  regular_price: string | number | null;
  unit_price: string | number | null;
  currency: string | null;
  price_type: string | null;
  observed_at: string | Date | null;
  confidence: string | number | null;
  is_available: boolean | null;
};

export type ComparePriceSnapshot = {
  requestedItemId: string;
  productId: string;
  productSlug: string;
  productName: string;
  storeId: string;
  storeSlug: string | null;
  storeName: string | null;
  chainId: string | null;
  chainSlug: string | null;
  chainName: string | null;
  observationId: string | null;
  price: number;
  regularPrice: number | null;
  unitPrice: number | null;
  currency: string | null;
  priceType: string | null;
  observedAt: string | null;
  confidence: number | null;
  isAvailable: boolean;
};

function iso(value: string | Date | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function numberOrNull(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildComparePriceSnapshotsQuery(itemIds: string[]): ComparePriceSnapshotQuery {
  return {
    sql: `with requested_items as (
            select item_id, request_index
              from unnest($1::text[]) with ordinality as requested(item_id, request_index)
          ),
          matched_products as (
            select requested_items.item_id as requested_item_id,
                   requested_items.request_index,
                   products.id,
                   products.slug,
                   products.canonical_name
              from requested_items
              join products on products.id::text = requested_items.item_id
                         or products.slug = requested_items.item_id
             where products.domain = 'grocery'
          ),
          ranked_prices as (
            select matched_products.requested_item_id,
                   matched_products.request_index,
                   matched_products.id as product_id,
                   matched_products.slug as product_slug,
                   matched_products.canonical_name as product_name,
                   latest_prices.store_id,
                   latest_prices.chain_id,
                   latest_prices.observation_id,
                   latest_prices.price,
                   latest_prices.regular_price,
                   latest_prices.unit_price,
                   latest_prices.currency,
                   latest_prices.price_type,
                   latest_prices.observed_at,
                   latest_prices.confidence,
                   latest_prices.is_available,
                   row_number() over (
                     partition by matched_products.requested_item_id, latest_prices.store_id
                     order by latest_prices.price asc, latest_prices.observed_at desc, latest_prices.price_type asc
                   ) as price_rank
              from matched_products
              join latest_prices on latest_prices.product_id = matched_products.id
             where latest_prices.domain = 'grocery'
               and latest_prices.store_id is not null
               and latest_prices.price >= 0
               and coalesce(latest_prices.is_available, true) = true
          )
          select ranked_prices.requested_item_id,
                 ranked_prices.product_id::text,
                 ranked_prices.product_slug,
                 ranked_prices.product_name,
                 ranked_prices.store_id::text,
                 stores.slug as store_slug,
                 stores.name as store_name,
                 ranked_prices.chain_id::text,
                 chains.slug as chain_slug,
                 chains.name as chain_name,
                 ranked_prices.observation_id::text,
                 ranked_prices.price,
                 ranked_prices.regular_price,
                 ranked_prices.unit_price,
                 ranked_prices.currency,
                 ranked_prices.price_type,
                 ranked_prices.observed_at,
                 ranked_prices.confidence,
                 ranked_prices.is_available
            from ranked_prices
            left join stores on stores.id = ranked_prices.store_id
            left join chains on chains.id = ranked_prices.chain_id
           where ranked_prices.price_rank = 1
           order by ranked_prices.request_index, ranked_prices.price asc, stores.name nulls last`,
    values: [itemIds]
  };
}

export function mapComparePriceSnapshotRow(row: ComparePriceSnapshotRow): ComparePriceSnapshot {
  return {
    requestedItemId: row.requested_item_id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    storeId: row.store_id,
    storeSlug: row.store_slug,
    storeName: row.store_name,
    chainId: row.chain_id,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    observationId: row.observation_id,
    price: numberOrNull(row.price) ?? 0,
    regularPrice: numberOrNull(row.regular_price),
    unitPrice: numberOrNull(row.unit_price),
    currency: row.currency,
    priceType: row.price_type,
    observedAt: iso(row.observed_at),
    confidence: numberOrNull(row.confidence),
    isAvailable: row.is_available ?? true
  };
}
