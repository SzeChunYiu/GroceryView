export type ProductStoreAvailabilityExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type ProductStoreAvailabilityInput = {
  productId: string;
  storeId: string;
  isAvailable: boolean;
  lastSeenAt?: Date | string;
};

export type ProductStoreAvailabilityRow = {
  product_id: string;
  store_id: string;
  is_available: boolean;
  last_seen_at: Date | string;
  updated_at: Date | string;
};

export type ProductStoreAvailabilityRecord = {
  productId: string;
  storeId: string;
  isAvailable: boolean;
  lastSeenAt: string;
  updatedAt: string;
};

export type ProductStoreAvailabilityQuery = {
  sql: string;
  values: unknown[];
};

function serializeTimestamp(value: Date | string | undefined) {
  if (value instanceof Date) return value.toISOString();
  return value ?? new Date().toISOString();
}

export function mapProductStoreAvailabilityRow(row: ProductStoreAvailabilityRow): ProductStoreAvailabilityRecord {
  return {
    productId: row.product_id,
    storeId: row.store_id,
    isAvailable: row.is_available,
    lastSeenAt: row.last_seen_at instanceof Date ? row.last_seen_at.toISOString() : row.last_seen_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

export function buildUpsertProductStoreAvailabilityQuery(input: ProductStoreAvailabilityInput): ProductStoreAvailabilityQuery {
  return {
    sql: `insert into product_store_availability (product_id, store_id, is_available, last_seen_at)
          values ($1, $2, $3, $4)
          on conflict (product_id, store_id) do update
            set is_available = excluded.is_available,
                last_seen_at = excluded.last_seen_at,
                updated_at = now()
          returning product_id, store_id, is_available, last_seen_at, updated_at`,
    values: [input.productId, input.storeId, input.isAvailable, serializeTimestamp(input.lastSeenAt)]
  };
}

export async function recordProductStoreAvailability(
  executor: ProductStoreAvailabilityExecutor,
  input: ProductStoreAvailabilityInput
): Promise<ProductStoreAvailabilityRecord> {
  const query = buildUpsertProductStoreAvailabilityQuery(input);
  const [row] = await executor.query<ProductStoreAvailabilityRow>(query.sql, query.values);
  if (!row) throw new Error(`Failed to record availability for product ${input.productId} at store ${input.storeId}`);
  return mapProductStoreAvailabilityRow(row);
}

export async function getProductStoreAvailability(
  executor: ProductStoreAvailabilityExecutor,
  productId: string,
  storeId: string
): Promise<ProductStoreAvailabilityRecord | null> {
  const rows = await executor.query<ProductStoreAvailabilityRow>(
    `select product_id, store_id, is_available, last_seen_at, updated_at
       from product_store_availability
      where product_id = $1
        and store_id = $2`,
    [productId, storeId]
  );

  return rows[0] ? mapProductStoreAvailabilityRow(rows[0]) : null;
}

export async function listUnavailableProductsForStore(
  executor: ProductStoreAvailabilityExecutor,
  storeId: string
): Promise<ProductStoreAvailabilityRecord[]> {
  const rows = await executor.query<ProductStoreAvailabilityRow>(
    `select product_id, store_id, is_available, last_seen_at, updated_at
       from product_store_availability
      where store_id = $1
        and is_available = false
      order by last_seen_at desc, product_id asc`,
    [storeId]
  );

  return rows.map(mapProductStoreAvailabilityRow);
}
