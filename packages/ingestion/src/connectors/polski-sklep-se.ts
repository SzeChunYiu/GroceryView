import { isGroceryOverlapCategory, type GroceryOverlapCategory } from './overlapCategories.js';

export const POLSKI_SKLEP_SE_CHAIN = 'polski-sklep';
export const POLSKI_SKLEP_SE_RETAILER_TYPE = 'ethnic_polish_eastern_european';
export const POLSKI_SKLEP_SE_URL = 'https://polskisklep.se/';

export type PolskiSklepSeStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  franchised: boolean;
};

export type PolskiSklepSeRow = {
  country: 'SE';
  currency: 'SEK';
  chain: typeof POLSKI_SKLEP_SE_CHAIN;
  retailer_type: typeof POLSKI_SKLEP_SE_RETAILER_TYPE;
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

type PolskiSklepPayload = {
  stores?: unknown;
  products?: unknown;
};

type StoreCandidate = Record<string, unknown>;
type ProductCandidate = Record<string, unknown>;

export function parsePolskiSklepSeFixture(payload: PolskiSklepPayload, sourceUrl: string, retrievedAt: string): PolskiSklepSeRow[] {
  const stores = arrayOfRecords(payload.stores).map(normalizePolskiSklepStore).filter((store): store is PolskiSklepSeStore => store !== null);
  if (!isPolskiSklepMultiLocationNetwork(stores)) return [];
  const storesById = new Map(stores.map((store) => [store.storeId, store]));
  return arrayOfRecords(payload.products).flatMap((product) => normalizePolskiSklepProduct(product, storesById, sourceUrl, retrievedAt));
}

export function isPolskiSklepMultiLocationNetwork(stores: readonly PolskiSklepSeStore[]) {
  return stores.length >= 3 || stores.some((store) => store.franchised);
}

function normalizePolskiSklepStore(candidate: StoreCandidate): PolskiSklepSeStore | null {
  const storeId = text(candidate.storeId) || text(candidate.id);
  const name = text(candidate.name);
  const city = text(candidate.city);
  if (!storeId || !name || !city) return null;
  return {
    storeId,
    name,
    address: text(candidate.address),
    city,
    franchised: candidate.franchised === true || /franchise|franchised/i.test(text(candidate.networkType))
  };
}

function normalizePolskiSklepProduct(
  product: ProductCandidate,
  storesById: ReadonlyMap<string, PolskiSklepSeStore>,
  sourceUrl: string,
  retrievedAt: string
): PolskiSklepSeRow[] {
  const category = text(product.category).toLowerCase();
  const price = numberOrNull(product.price);
  const sku = text(product.sku) || text(product.id);
  const name = text(product.name);
  if (!isGroceryOverlapCategory(category) || price === null || !sku || !name) return [];
  const storeIds = arrayOfStrings(product.storeIds).filter((storeId) => storesById.has(storeId));
  return storeIds.map((storeId) => {
    const store = storesById.get(storeId)!;
    return {
      country: 'SE',
      currency: 'SEK',
      chain: POLSKI_SKLEP_SE_CHAIN,
      retailer_type: POLSKI_SKLEP_SE_RETAILER_TYPE,
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
