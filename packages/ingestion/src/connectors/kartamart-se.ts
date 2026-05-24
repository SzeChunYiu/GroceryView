import { isGroceryOverlapCategory, type GroceryOverlapCategory } from './overlapCategories.js';

export const KARTAMART_SE_CHAIN = 'kartamart';
export const KARTAMART_SE_RETAILER_TYPE = 'ethnic_asian';
export const KARTAMART_SE_URL = 'https://kartamart.se/';

export type KartaMartSeStore = {
  storeId: string;
  name: string;
  city: string;
  address: string;
  online: boolean;
};

export type KartaMartSeRow = {
  country: 'SE';
  currency: 'SEK';
  chain: typeof KARTAMART_SE_CHAIN;
  retailer_type: typeof KARTAMART_SE_RETAILER_TYPE;
  storeId: string;
  storeName: string;
  city: string;
  sku: string;
  name: string;
  brand: string;
  category: GroceryOverlapCategory;
  price: number;
  sourceUrl: string;
  retrievedAt: string;
};

type KartaMartPayload = {
  stores?: unknown;
  products?: unknown;
  nationalOnline?: unknown;
};

export function parseKartaMartSeFixture(payload: KartaMartPayload, sourceUrl: string, retrievedAt: string): KartaMartSeRow[] {
  const stores = arrayOfRecords(payload.stores).map(normalizeKartaMartStore).filter((store): store is KartaMartSeStore => store !== null);
  if (!isKartaMartInclusionEligible(stores, payload.nationalOnline === true)) return [];
  const storesById = new Map(stores.map((store) => [store.storeId, store]));
  return arrayOfRecords(payload.products).flatMap((product) => normalizeKartaMartProduct(product, storesById, sourceUrl, retrievedAt));
}

export function isKartaMartInclusionEligible(stores: readonly KartaMartSeStore[], nationalOnline: boolean) {
  return nationalOnline || stores.length >= 3 || stores.some((store) => store.online);
}

function normalizeKartaMartStore(candidate: Record<string, unknown>): KartaMartSeStore | null {
  const storeId = text(candidate.storeId) || text(candidate.id);
  const name = text(candidate.name);
  const city = text(candidate.city);
  if (!storeId || !name || !city) return null;
  return {
    storeId,
    name,
    city,
    address: text(candidate.address),
    online: candidate.online === true || candidate.nationalOnline === true
  };
}

function normalizeKartaMartProduct(
  product: Record<string, unknown>,
  storesById: ReadonlyMap<string, KartaMartSeStore>,
  sourceUrl: string,
  retrievedAt: string
): KartaMartSeRow[] {
  const category = text(product.category).toLowerCase();
  const price = numberOrNull(product.price);
  const sku = text(product.sku) || text(product.id);
  const name = text(product.name);
  if (!isGroceryOverlapCategory(category) || price === null || !sku || !name) return [];
  return arrayOfStrings(product.storeIds).filter((storeId) => storesById.has(storeId)).map((storeId) => {
    const store = storesById.get(storeId)!;
    return {
      country: 'SE',
      currency: 'SEK',
      chain: KARTAMART_SE_CHAIN,
      retailer_type: KARTAMART_SE_RETAILER_TYPE,
      storeId: store.storeId,
      storeName: store.name,
      city: store.city,
      sku,
      name,
      brand: text(product.brand),
      category,
      price,
      sourceUrl,
      retrievedAt
    };
  });
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)) : [];
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : NaN;
  return Number.isFinite(numeric) ? numeric : null;
}
