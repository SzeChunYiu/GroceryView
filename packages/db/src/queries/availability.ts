export type StoreAvailabilityFilterOptions = {
  storeSlugs?: readonly string[];
  storeIds?: readonly string[];
  parameterOffset?: number;
};

export type StoreAvailabilityFilterQuery = {
  sql: string;
  values: string[][];
};

function normalizedStoreValues(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? [])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

export function buildStoreAvailabilityFilter(options: StoreAvailabilityFilterOptions): StoreAvailabilityFilterQuery | null {
  const storeSlugs = normalizedStoreValues(options.storeSlugs);
  const storeIds = normalizedStoreValues(options.storeIds);
  if (storeSlugs.length === 0 && storeIds.length === 0) return null;

  const offset = options.parameterOffset ?? 1;
  const clauses: string[] = [];
  const values: string[][] = [];
  if (storeSlugs.length > 0) {
    clauses.push(`stores.slug = any($${offset + values.length}::text[])`);
    values.push(storeSlugs);
  }
  if (storeIds.length > 0) {
    clauses.push(`stores.id::text = any($${offset + values.length}::text[])`);
    values.push(storeIds);
  }

  return {
    sql: `exists (
      select 1
      from latest_prices
      join stores on stores.id = latest_prices.store_id
      where latest_prices.product_id = products.id
        and latest_prices.price is not null
        and coalesce(latest_prices.is_available, true) = true
        and (${clauses.join(' or ')})
    )`,
    values
  };
}
