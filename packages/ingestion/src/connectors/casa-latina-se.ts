export const CASA_LATINA_SE_CONNECTOR_VERSION = 'casa-latina-se-v1';

export const CASA_LATINA_SE_OVERLAP_CATEGORIES = [
  'beans-rice-grains',
  'corn-tortillas-masa',
  'salsas-sauces',
  'chile-spices',
  'soft-drinks-juices',
  'sweets-snacks',
  'frozen-latin'
] as const;

export type CasaLatinaSeOverlapCategory = (typeof CASA_LATINA_SE_OVERLAP_CATEGORIES)[number];

export type CasaLatinaSeStore = {
  store_id: string;
  name: string;
  city: string;
  country: 'SE';
  source_url: string;
};

export type CasaLatinaSeRow = {
  id: string;
  country: 'SE';
  currency: 'SEK';
  chain: 'casa-latina';
  retailer_type: 'ethnic_latin';
  store_id: string;
  store_name: string;
  city: string;
  product_name: string;
  brand?: string;
  category: CasaLatinaSeOverlapCategory;
  price: number;
  unit?: string;
  source_url: string;
  captured_at: string;
};

type RawCasaLatinaRow = Record<string, unknown>;

export const CASA_LATINA_SE_STORES: CasaLatinaSeStore[] = [
  {
    store_id: 'casa-latina-stockholm',
    name: 'Casa Latina Stockholm',
    city: 'Stockholm',
    country: 'SE',
    source_url: 'https://www.latinamerikanska.se/'
  },
  {
    store_id: 'casa-latina-malmo',
    name: 'Casa Latina Malmö',
    city: 'Malmö',
    country: 'SE',
    source_url: 'https://tiendalatina.se/'
  },
  {
    store_id: 'casa-latina-goteborg',
    name: 'Casa Latina Göteborg',
    city: 'Göteborg',
    country: 'SE',
    source_url: 'https://www.casalatina.se/'
  }
];

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function price(value: unknown) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value.replace(',', '.')) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round((parsed + Number.EPSILON) * 100) / 100 : undefined;
}

function isOverlapCategory(value: string): value is CasaLatinaSeOverlapCategory {
  return (CASA_LATINA_SE_OVERLAP_CATEGORIES as readonly string[]).includes(value);
}

function rowsFromPayload(payload: unknown): RawCasaLatinaRow[] {
  if (Array.isArray(payload)) return payload.filter((row): row is RawCasaLatinaRow => row !== null && typeof row === 'object');
  if (!payload || typeof payload !== 'object') return [];
  const rows = (payload as { rows?: unknown; products?: unknown }).rows ?? (payload as { products?: unknown }).products;
  return Array.isArray(rows) ? rows.filter((row): row is RawCasaLatinaRow => row !== null && typeof row === 'object') : [];
}

export function verifiedCasaLatinaSeStores(stores: readonly CasaLatinaSeStore[] = CASA_LATINA_SE_STORES) {
  const seStores = stores.filter((store) => store.country === 'SE' && store.store_id && store.city && store.source_url);
  return {
    stores: seStores,
    verifiedStoreCount: seStores.length,
    hasMinimumStoreCoverage: seStores.length >= 3
  };
}

export function parseCasaLatinaSeRows(
  payload: unknown,
  options: { capturedAt: string; stores?: readonly CasaLatinaSeStore[] } = { capturedAt: new Date().toISOString() }
): CasaLatinaSeRow[] {
  const stores = options.stores ?? CASA_LATINA_SE_STORES;
  const storeById = new Map(stores.map((store) => [store.store_id, store]));
  const coverage = verifiedCasaLatinaSeStores(stores);
  if (!coverage.hasMinimumStoreCoverage) {
    throw new Error('Casa Latina SE connector requires at least three verified Swedish stores.');
  }

  return rowsFromPayload(payload).flatMap((row) => {
    const category = text(row.category ?? row.overlapCategory ?? row.category_id);
    const storeId = text(row.store_id ?? row.storeId) || stores[0]?.store_id;
    const store = storeId ? storeById.get(storeId) : undefined;
    const productName = text(row.product_name ?? row.productName ?? row.name);
    const parsedPrice = price(row.price ?? row.price_sek);
    if (!store || !isOverlapCategory(category) || !productName || parsedPrice === undefined) return [];

    return [{
      id: text(row.id) || `${store.store_id}:${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      country: 'SE' as const,
      currency: 'SEK' as const,
      chain: 'casa-latina' as const,
      retailer_type: 'ethnic_latin' as const,
      store_id: store.store_id,
      store_name: store.name,
      city: store.city,
      product_name: productName,
      ...(text(row.brand) ? { brand: text(row.brand) } : {}),
      category,
      price: parsedPrice,
      ...(text(row.unit) ? { unit: text(row.unit) } : {}),
      source_url: text(row.source_url ?? row.sourceUrl) || store.source_url,
      captured_at: options.capturedAt
    }];
  });
}
