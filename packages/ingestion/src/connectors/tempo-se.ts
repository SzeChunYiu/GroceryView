import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

export type TempoProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'tempo';
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  price: number;
  priceText: string;
  unitPriceText: string;
  unitPriceUnit: string;
  imageUrl: string;
  labels: string[];
  online: boolean;
  outOfStock: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

export type TempoStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  onlineStore: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

export type TempoStoreProduct = TempoProduct & {
  storeId: string;
  storeName: string;
  city: string;
};

type AxfoodSearchProduct = {
  code?: unknown;
  name?: unknown;
  manufacturer?: unknown;
  productLine2?: unknown;
  pickupProductLine2?: unknown;
  googleAnalyticsCategory?: unknown;
  priceValue?: unknown;
  price?: unknown;
  comparePrice?: unknown;
  comparePriceUnit?: unknown;
  image?: { url?: unknown };
  labels?: unknown;
  online?: unknown;
  outOfStock?: unknown;
};

type AxfoodSearchResponse = {
  results?: AxfoodSearchProduct[];
  pagination?: {
    numberOfPages?: unknown;
  };
};

type TempoStoreAddress = {
  line1?: unknown;
  town?: unknown;
  postalCode?: unknown;
  country?: { isocode?: unknown };
  formattedAddress?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

type TempoStoreApiRow = {
  storeId?: unknown;
  name?: unknown;
  address?: TempoStoreAddress;
  geoPoint?: { latitude?: unknown; longitude?: unknown };
  onlineStore?: unknown;
};

export type FetchTempoProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  storeId?: string;
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export type FetchTempoStoresOptions = {
  fetchImpl?: typeof fetch;
  online?: boolean;
  maxRows?: number;
  retrievedAt?: string;
  storeApiUrl?: string;
};

export type FetchTempoProductsForAllStoresOptions = Omit<FetchTempoProductsOptions, 'storeId'> & AllStoreTaskRunnerControls & {
  storeApiUrl?: string;
  maxStores?: number;
  maxRowsPerStore?: number;
};

export const TEMPO_SEARCH_BASE_URL = 'https://www.tempo.nu/search';
export const TEMPO_STORE_API_URL = 'https://www.tempo.nu/axfood/rest/store';
export const DEFAULT_TEMPO_SEARCH_QUERIES = ['kaffe', 'mjölk', 'pasta', 'bröd'];

export function buildTempoSearchUrl(query: string, size = 100, page = 0, storeId?: string): string {
  const url = new URL(TEMPO_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  if (storeId) url.searchParams.set('store', storeId);
  return url.toString();
}

export function buildTempoStoresUrl(options: { online?: boolean; storeApiUrl?: string } = {}): string {
  const url = new URL(options.storeApiUrl ?? TEMPO_STORE_API_URL);
  if (options.online !== undefined) url.searchParams.set('online', String(options.online));
  return url.toString();
}

export async function fetchTempoStores(options: FetchTempoStoresOptions = {}): Promise<TempoStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = buildTempoStoresUrl({ online: options.online, storeApiUrl: options.storeApiUrl });
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, { headers: requestHeaders() });
  if (!response.ok) throw new Error(`Tempo store catalog request failed: ${response.status}`);
  const payload = await response.json() as TempoStoreApiRow[];
  if (!Array.isArray(payload)) throw new Error('Tempo store catalog response must be an array.');
  const rows: TempoStore[] = [];
  const seenStoreIds = new Set<string>();
  for (const store of payload) {
    const row = normalizeTempoStore(store, sourceUrl, retrievedAt);
    if (!row || seenStoreIds.has(row.storeId)) continue;
    seenStoreIds.add(row.storeId);
    rows.push(row);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('Tempo store catalog had no usable stores.');
  return rows;
}

export async function fetchTempoProducts(options: FetchTempoProductsOptions = {}): Promise<TempoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries?.length ? options.queries : DEFAULT_TEMPO_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const pageSize = options.pageSize ?? 100;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: TempoProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    let page = 0;
    let pageCount: number | null = null;
    while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
      const sourceUrl = buildTempoSearchUrl(query, pageSize, page, options.storeId);
      const response = await fetchImpl(sourceUrl, { headers: requestHeaders() });
      if (!response.ok) throw new Error(`Tempo search request failed for ${query}: ${response.status}`);
      const payload = await response.json() as AxfoodSearchResponse;
      const results = payload.results ?? [];
      const responsePageCount = numberOrNull(payload.pagination?.numberOfPages);
      pageCount = responsePageCount && responsePageCount > 0 ? responsePageCount : page + 1;
      for (const product of results) {
        const row = normalizeTempoProduct(product, sourceUrl, retrievedAt);
        if (!row || seenCodes.has(row.code)) continue;
        seenCodes.add(row.code);
        rows.push(row);
        if (rows.length >= maxRows) return rows;
      }
      if (results.length === 0) break;
      page += 1;
    }
  }

  return rows;
}

export async function fetchTempoProductsForAllStores(options: FetchTempoProductsForAllStoresOptions = {}): Promise<TempoStoreProduct[]> {
  const stores = await fetchTempoStores({
    fetchImpl: options.fetchImpl,
    online: true,
    maxRows: options.maxStores,
    retrievedAt: options.retrievedAt,
    storeApiUrl: options.storeApiUrl
  });
  const { rows, failures } = await runAllStoreTasks({
    stores,
    storeId: (store) => store.storeId,
    storeConcurrency: options.storeConcurrency,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: async (store) => {
      const products = await fetchTempoProducts({
        fetchImpl: options.fetchImpl,
        queries: options.queries,
        storeId: store.storeId,
        maxRows: options.maxRowsPerStore,
        pageSize: options.maxRowsPerStore ?? options.pageSize,
        retrievedAt: options.retrievedAt
      });
      return products.map((product) => ({ ...product, storeId: store.storeId, storeName: store.name, city: store.city }));
    }
  });
  if (rows.length === 0 && failures.length > 0) throw new Error(`Tempo all-store product requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  return rows;
}

export function normalizeTempoProduct(product: AxfoodSearchProduct, sourceUrl: string, retrievedAt: string): TempoProduct | null {
  const code = text(product.code);
  const name = text(product.name);
  const price = numberOrNull(product.priceValue);
  if (!code || !name || price === null) return null;
  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'tempo',
    code,
    name,
    brand: text(product.manufacturer),
    packageText: text(product.productLine2) || text(product.pickupProductLine2),
    category: text(product.googleAnalyticsCategory),
    price,
    priceText: text(product.price),
    unitPriceText: text(product.comparePrice),
    unitPriceUnit: text(product.comparePriceUnit),
    imageUrl: text(product.image?.url),
    labels: stringArray(product.labels),
    online: product.online === true,
    outOfStock: product.outOfStock === true,
    sourceUrl,
    retrievedAt
  };
}

export function normalizeTempoStore(store: TempoStoreApiRow, sourceUrl: string, retrievedAt: string): TempoStore | null {
  const storeId = text(store.storeId);
  const name = text(store.name);
  const address = text(store.address?.line1) || text(store.address?.formattedAddress);
  const city = text(store.address?.town);
  if (!storeId || !name || !address || !city) return null;
  return {
    storeId,
    name,
    address,
    city,
    postalCode: text(store.address?.postalCode),
    countryCode: text(store.address?.country?.isocode) || 'SE',
    latitude: numberOrNull(store.geoPoint?.latitude) ?? numberOrNull(store.address?.latitude),
    longitude: numberOrNull(store.geoPoint?.longitude) ?? numberOrNull(store.address?.longitude),
    onlineStore: store.onlineStore === true,
    sourceUrl,
    retrievedAt
  };
}

function requestHeaders() {
  return {
    accept: 'application/json',
    'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
