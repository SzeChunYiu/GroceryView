export type StoreAssortmentOverviewQuery = {
  sql: string;
  values: [storeSlug: string, limit: number];
};

export type StoreAssortmentOverviewQueryOptions = {
  limit?: number;
};

export type StoreAssortmentOverviewRow = {
  store_id: string;
  store_slug: string;
  store_name: string;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  opening_hours: unknown;
  product_id: string;
  product_slug: string;
  canonical_name: string;
  category_path: string[] | null;
  price: string | number;
  unit_price: string | number | null;
  currency: string;
  observed_at: string;
};

export type StoreAssortmentOverviewItem = {
  storeId: string;
  storeSlug: string;
  storeName: string;
  address: string;
  openingHours: string[];
  productId: string;
  productSlug: string;
  productName: string;
  category: string;
  price: number;
  unitPrice: number | null;
  currency: string;
  observedAt: string;
};

function clampLimit(limit: number | undefined) {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return 200;
  return Math.min(Math.max(Math.trunc(limit), 1), 500);
}

function normalizeOpeningHours(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (typeof value === 'string' && value.trim().length > 0) return [value.trim()];
  if (value && typeof value === 'object') return [JSON.stringify(value)];
  return [];
}

function normalizedAddress(row: Pick<StoreAssortmentOverviewRow, 'address_line1' | 'address_line2' | 'postal_code' | 'city'>) {
  return [row.address_line1, row.address_line2, row.postal_code, row.city]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(', ');
}

export function buildStoreAssortmentOverviewQuery(
  storeSlug: string,
  options: StoreAssortmentOverviewQueryOptions = {}
): StoreAssortmentOverviewQuery {
  return {
    sql: `select stores.id as store_id,
                 stores.slug as store_slug,
                 stores.name as store_name,
                 stores.address_line1,
                 stores.address_line2,
                 stores.postal_code,
                 stores.city,
                 stores.opening_hours,
                 products.id as product_id,
                 products.slug as product_slug,
                 products.canonical_name,
                 products.category_path,
                 coalesce(products.category_path[1], 'uncategorized') as category_label,
                 latest_prices.price,
                 latest_prices.unit_price,
                 latest_prices.currency,
                 latest_prices.observed_at
          from stores
          join latest_prices on latest_prices.store_id = stores.id
          join products on products.id = latest_prices.product_id
          where stores.slug = $1
            and latest_prices.domain = 'grocery'
            and coalesce(latest_prices.is_available, true) = true
          order by category_label asc, products.canonical_name asc
          limit $2`,
    values: [storeSlug, clampLimit(options.limit)]
  };
}

export function mapStoreAssortmentOverviewRow(row: StoreAssortmentOverviewRow): StoreAssortmentOverviewItem {
  const category = row.category_path?.find((part) => part.trim().length > 0) ?? 'uncategorized';
  const unitPrice = row.unit_price === null ? null : Number(row.unit_price);

  return {
    storeId: row.store_id,
    storeSlug: row.store_slug,
    storeName: row.store_name,
    address: normalizedAddress(row),
    openingHours: normalizeOpeningHours(row.opening_hours),
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.canonical_name,
    category,
    price: Number(row.price),
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : null,
    currency: row.currency,
    observedAt: row.observed_at
  };
}
