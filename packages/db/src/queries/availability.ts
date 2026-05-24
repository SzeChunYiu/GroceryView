import type { QueryExecutor } from '../index.js';

export type AvailabilityHistoryPoint = Readonly<{
  chainId: string;
  chainName?: string;
  storeId?: string;
  storeName?: string;
  isAvailable: boolean;
  observedAt: string;
}>;

export type BackInStockNotice = Readonly<{
  productId: string;
  store: string;
  observedAt: string;
  previousOutOfStockAt: string;
}>;

type BackInStockRow = {
  product_id: string;
  chain_id: string;
  chain_name: string | null;
  store_id: string | null;
  store_name: string | null;
  observed_at: string | Date;
  previous_out_of_stock_at: string | Date;
};

function asIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function locationKey(point: AvailabilityHistoryPoint) {
  return `${point.chainId}:${point.storeId ?? 'chain'}`;
}

function locationLabel(point: Pick<AvailabilityHistoryPoint, 'chainId' | 'chainName' | 'storeName'>) {
  return point.storeName || point.chainName || point.chainId;
}

export function findBackInStockNoticeFromHistory(productId: string, history: readonly AvailabilityHistoryPoint[]): BackInStockNotice | null {
  const byLocation = new Map<string, AvailabilityHistoryPoint[]>();

  for (const point of history) {
    byLocation.set(locationKey(point), [...(byLocation.get(locationKey(point)) ?? []), point]);
  }

  const notices = [...byLocation.values()]
    .map((points) => [...points].sort((left, right) => right.observedAt.localeCompare(left.observedAt)))
    .map((points) => {
      const latest = points[0];
      if (!latest?.isAvailable) return null;
      const previousOutOfStock = points.slice(1).find((point) => point.isAvailable === false);
      if (!previousOutOfStock) return null;
      return {
        productId,
        store: locationLabel(latest),
        observedAt: latest.observedAt,
        previousOutOfStockAt: previousOutOfStock.observedAt
      } satisfies BackInStockNotice;
    })
    .filter((notice): notice is BackInStockNotice => notice !== null)
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt));

  return notices[0] ?? null;
}

export async function findBackInStockNotice(executor: QueryExecutor, productId: string): Promise<BackInStockNotice | null> {
  const rows = await executor.query<BackInStockRow>(
    `with ranked as (
       select observations.product_id,
              observations.chain_id,
              chains.name as chain_name,
              observations.store_id,
              stores.name as store_name,
              observations.is_available,
              observations.observed_at,
              lag(observations.is_available) over (
                partition by observations.product_id, observations.chain_id, observations.store_id
                order by observations.observed_at
              ) as previous_is_available,
              lag(observations.observed_at) over (
                partition by observations.product_id, observations.chain_id, observations.store_id
                order by observations.observed_at
              ) as previous_out_of_stock_at
       from observations
       join products on products.id = observations.product_id
       join chains on chains.id = observations.chain_id
       left join stores on stores.id = observations.store_id
       where (observations.product_id::text = $1 or products.slug = $1)
         and observations.domain = 'grocery'
         and observations.observed_at >= now() - interval '14 days'
     )
     select product_id,
            chain_id,
            chain_name,
            store_id,
            store_name,
            observed_at,
            previous_out_of_stock_at
     from ranked
     where is_available = true
       and previous_is_available = false
       and previous_out_of_stock_at is not null
     order by observed_at desc
     limit 1`,
    [productId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    productId: row.product_id,
    store: row.store_name || row.chain_name || row.chain_id,
    observedAt: asIso(row.observed_at),
    previousOutOfStockAt: asIso(row.previous_out_of_stock_at)
  };
}
