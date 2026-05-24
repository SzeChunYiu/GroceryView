import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

export type CityGrossStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  url: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type CityGrossProduct = {
  code: string;
  gtin: string;
  name: string;
  brand: string;
  superCategory: string;
  category: string;
  packageText: string;
  storeId: string;
  price: number;
  regularPrice: number | null;
  unitPrice: number | null;
  unitPriceUnit: string;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type CityGrossStoreResponse = {
  data?: {
    storeName?: unknown;
    siteId?: unknown;
    url?: unknown;
    storeLocation?: { coordinates?: unknown };
  };
};

type CityGrossProductResponse = {
  items?: CityGrossProductApiRow[];
  totalCount?: unknown;
};

type CityGrossProductApiRow = {
  id?: unknown;
  gtin?: unknown;
  name?: unknown;
  brand?: unknown;
  superCategory?: unknown;
  category?: unknown;
  descriptiveSize?: unknown;
  url?: unknown;
  images?: Array<{ url?: unknown }>;
  productStoreDetails?: {
    prices?: {
      currentPrice?: CityGrossPrice;
      ordinaryPrice?: CityGrossPrice | null;
    };
  };
};

type CityGrossPrice = {
  price?: unknown;
  unit?: unknown;
  comparativePrice?: unknown;
  comparativePriceUnit?: unknown;
};

export const CITY_GROSS_BASE_URL = 'https://www.citygross.se';
export const CITY_GROSS_API_BASE_URL = 'https://www.citygross.se/api/v1';
export const CITY_GROSS_STORES_PATH = 'PageData/stores';
export const CITY_GROSS_PRODUCTS_PATH = 'Loop54/products';
export const DEFAULT_CITY_GROSS_PRODUCT_PAGE_SIZE = 100;
export const CITY_GROSS_GROCERY_SUPER_CATEGORIES = [
  'Skafferiet',
  'Mejeri, ost & ägg',
  'Bröd & bageri',
  'Bröd & Bageri',
  'Frukt & grönt',
  'Godis',
  'Chark',
  'Chark & pålägg',
  'Fryst',
  'Dryck',
  'Kyld färdigmat',
  'Snacks',
  'Kött & fågel',
  'Fisk & Skaldjur'
] as const;

export const DEFAULT_CITY_GROSS_PRODUCT_QUERIES = [
  'kaffe',
  'mjolk',
  'pasta',
  'ris',
  'smor',
  'ost',
  'kyckling',
  'yoghurt'
] as const;
export const DEFAULT_CITY_GROSS_LIVE_PRODUCT_MAX_STORES = 60;
export const DEFAULT_CITY_GROSS_LIVE_PRODUCT_MAX_ROWS_PER_STORE = 260;

export type FetchCityGrossStoresOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  apiBaseUrl?: string;
};

export type FetchCityGrossProductsOptions = {
  fetchImpl?: typeof fetch;
  siteId: string;
  query?: string;
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
  apiBaseUrl?: string;
};

export type FetchCityGrossProductsForAllStoresOptions = Omit<FetchCityGrossProductsOptions, 'siteId' | 'query' | 'maxRows'> & AllStoreTaskRunnerControls & {
  queries?: readonly string[];
  maxStores?: number;
  maxRowsPerStore?: number;
};

export function buildCityGrossStoresUrl(apiBaseUrl = CITY_GROSS_API_BASE_URL): string {
  return new URL(CITY_GROSS_STORES_PATH, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`).toString();
}

export function buildCityGrossProductsUrl(input: {
  siteId: string;
  query?: string;
  take?: number;
  skip?: number;
  apiBaseUrl?: string;
}): string {
  const url = new URL(CITY_GROSS_PRODUCTS_PATH, (input.apiBaseUrl ?? CITY_GROSS_API_BASE_URL).endsWith('/')
    ? input.apiBaseUrl ?? CITY_GROSS_API_BASE_URL
    : `${input.apiBaseUrl ?? CITY_GROSS_API_BASE_URL}/`);
  if (input.query) url.searchParams.set('Q', input.query);
  url.searchParams.set('skip', String(input.skip ?? 0));
  url.searchParams.set('take', String(input.take ?? 24));
  url.searchParams.set('siteId', input.siteId);
  return url.toString();
}

export async function fetchCityGrossStores(options: FetchCityGrossStoresOptions = {}): Promise<CityGrossStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = buildCityGrossStoresUrl(options.apiBaseUrl);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`City Gross stores request failed: ${response.status}`);
  const payload = await response.json() as CityGrossStoreResponse[];
  if (!Array.isArray(payload)) throw new Error('City Gross store response must be an array.');
  const rows: CityGrossStore[] = [];
  const seen = new Set<string>();
  for (const candidate of payload) {
    const row = normalizeCityGrossStore(candidate, sourceUrl, retrievedAt);
    if (!row || seen.has(row.storeId)) continue;
    seen.add(row.storeId);
    rows.push(row);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('City Gross store catalog had no usable stores.');
  return rows;
}

export async function fetchCityGrossProducts(options: FetchCityGrossProductsOptions): Promise<CityGrossProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const pageSize = options.pageSize ?? DEFAULT_CITY_GROSS_PRODUCT_PAGE_SIZE;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: CityGrossProduct[] = [];
  const seen = new Set<string>();
  let skip = 0;
  while (rows.length < maxRows) {
    const sourceUrl = buildCityGrossProductsUrl({
      siteId: options.siteId,
      query: options.query,
      take: Math.min(pageSize, maxRows - rows.length),
      skip,
      apiBaseUrl: options.apiBaseUrl
    });
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`City Gross products request failed for site ${options.siteId}: ${response.status}`);
    const payload = await response.json() as CityGrossProductResponse;
    const items = payload.items ?? [];
    for (const item of items) {
      const row = normalizeCityGrossProduct(item, options.siteId, sourceUrl, retrievedAt);
      if (!row || seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
    const totalCount = numberOrNull(payload.totalCount);
    if (items.length === 0 || items.length < pageSize) break;
    skip += items.length;
    if (totalCount !== null && skip >= totalCount) break;
  }
  return rows;
}

export async function fetchCityGrossProductsForAllStores(
  options: FetchCityGrossProductsForAllStoresOptions = {}
): Promise<CityGrossProduct[]> {
  const stores = await fetchCityGrossStores({
    fetchImpl: options.fetchImpl,
    maxRows: options.maxStores,
    retrievedAt: options.retrievedAt,
    apiBaseUrl: options.apiBaseUrl
  });
  const queries: readonly (string | undefined)[] = options.queries ?? [undefined];
  const { rows: fetchedRows, failures } = await runAllStoreTasks({
    stores,
    storeId: (store) => store.storeId,
    storeConcurrency: options.storeConcurrency,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: async (store) => {
      const rows: CityGrossProduct[] = [];
      for (const query of queries) {
        rows.push(...await fetchCityGrossProducts({
          fetchImpl: options.fetchImpl,
          siteId: store.storeId,
          query,
          maxRows: options.maxRowsPerStore,
          pageSize: options.pageSize,
          retrievedAt: options.retrievedAt,
          apiBaseUrl: options.apiBaseUrl
        }));
      }
      return rows;
    }
  });
  const rows: CityGrossProduct[] = [];
  const seen = new Set<string>();
  for (const product of fetchedRows) {
    const key = `${product.storeId}:${product.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(product);
  }
  if (rows.length === 0 && failures.length > 0) throw new Error(`City Gross all-store product requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  return rows;
}

export function normalizeCityGrossStore(
  row: CityGrossStoreResponse,
  sourceUrl: string,
  retrievedAt: string
): CityGrossStore | null {
  const data = row.data;
  const siteId = data?.siteId === undefined || data.siteId === null ? '' : String(data.siteId);
  const name = text(data?.storeName);
  if (!siteId || !name) return null;
  const [latitude, longitude] = parseCoordinates(text(data?.storeLocation?.coordinates));
  const path = text(data?.url);
  return {
    storeId: siteId,
    name,
    address: '',
    city: name.replace(/^City Gross\s+/i, '').trim() || name,
    latitude,
    longitude,
    url: path ? new URL(path, CITY_GROSS_BASE_URL).toString() : CITY_GROSS_BASE_URL,
    sourceUrl,
    retrievedAt
  };
}

export function normalizeCityGrossProduct(
  product: CityGrossProductApiRow,
  storeId: string,
  sourceUrl: string,
  retrievedAt: string
): CityGrossProduct | null {
  const code = text(product.id);
  const name = text(product.name);
  const superCategory = text(product.superCategory);
  const currentPrice = product.productStoreDetails?.prices?.currentPrice;
  const price = numberOrNull(currentPrice?.price);
  if (!code || !name || price === null) return null;
  if (superCategory && !isCityGrossGrocerySuperCategory(superCategory)) return null;
  const regularPrice = numberOrNull(product.productStoreDetails?.prices?.ordinaryPrice?.price);
  const productPath = text(product.url);
  const imageUrl = text(product.images?.[0]?.url);
  return {
    code,
    gtin: text(product.gtin),
    name,
    brand: text(product.brand),
    superCategory,
    category: text(product.category),
    packageText: text(product.descriptiveSize),
    storeId,
    price,
    regularPrice,
    unitPrice: numberOrNull(currentPrice?.comparativePrice),
    unitPriceUnit: text(currentPrice?.comparativePriceUnit),
    priceText: `${price.toFixed(2)} SEK`,
    productUrl: productPath ? new URL(productPath, CITY_GROSS_BASE_URL).toString() : '',
    imageUrl: imageUrl ? new URL(imageUrl.startsWith('/') ? imageUrl : `/images/${imageUrl}`, CITY_GROSS_BASE_URL).toString() : '',
    sourceUrl,
    retrievedAt
  };
}

function isCityGrossGrocerySuperCategory(value: string): boolean {
  const normalized = value.toLocaleLowerCase('sv-SE');
  return CITY_GROSS_GROCERY_SUPER_CATEGORIES.some((category) => category.toLocaleLowerCase('sv-SE') === normalized);
}

function parseCoordinates(value: string): [number | null, number | null] {
  const [lat, lon] = value.split(',').map((part) => Number(part.trim()));
  return [Number.isFinite(lat) ? lat : null, Number.isFinite(lon) ? lon : null];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
