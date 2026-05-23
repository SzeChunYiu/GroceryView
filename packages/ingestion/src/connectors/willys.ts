import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

export type WillysProduct = {
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

export type WillysStoreProduct = WillysProduct & {
  storeId: string;
  storeName: string;
  city: string;
};

export type WillysWeeklyDiscount = {
  code: string;
  productCode: string;
  name: string;
  brand: string;
  storeId: string;
  campaignType: string;
  promotionType: string;
  price: number;
  priceText: string;
  comparePriceText: string;
  regularPriceText: string;
  savePriceText: string;
  packageText: string;
  conditionText: string;
  redeemLimitText: string;
  startDate: string;
  endDate: string;
  validUntil: string;
  category: string;
  imageUrl: string;
  labels: string[];
  sourceUrl: string;
  retrievedAt: string;
};

export type WillysStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  onlineStore: boolean;
  clickAndCollect: boolean;
  flyerUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type WillysSearchProduct = {
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

type WillysSearchResponse = {
  results?: WillysSearchProduct[];
  pagination?: {
    numberOfPages?: unknown;
    currentPage?: unknown;
  };
};

type AxfoodCategoryTreeNode = {
  url?: unknown;
  valid?: unknown;
  children?: AxfoodCategoryTreeNode[];
};

type AxfoodCampaignPromotion = {
  code?: unknown;
  mainProductCode?: unknown;
  name?: unknown;
  brands?: unknown;
  campaignType?: unknown;
  promotionType?: unknown;
  price?: unknown;
  cartLabel?: unknown;
  rewardLabel?: unknown;
  comparePrice?: unknown;
  savePrice?: unknown;
  weightVolume?: unknown;
  conditionLabel?: unknown;
  redeemLimitLabel?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  validUntil?: unknown;
};

type AxfoodCampaignProduct = {
  manufacturer?: unknown;
  name?: unknown;
  priceNoUnit?: unknown;
  googleAnalyticsCategory?: unknown;
  displayVolume?: unknown;
  image?: { url?: unknown };
  thumbnail?: { url?: unknown };
  labels?: unknown;
  potentialPromotions?: AxfoodCampaignPromotion[];
};

type AxfoodCampaignResponse = {
  results?: AxfoodCampaignProduct[];
  pagination?: {
    numberOfPages?: unknown;
    currentPage?: unknown;
  };
};

type WillysStoreAddress = {
  line1?: unknown;
  town?: unknown;
  postalCode?: unknown;
  country?: { isocode?: unknown };
  formattedAddress?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

type WillysStoreApiRow = {
  storeId?: unknown;
  name?: unknown;
  address?: WillysStoreAddress;
  geoPoint?: { latitude?: unknown; longitude?: unknown };
  onlineStore?: unknown;
  clickAndCollect?: unknown;
  flyerURL?: unknown;
};

export const WILLYS_SEARCH_BASE_URL = 'https://www.willys.se/search';
export const WILLYS_WEEKLY_DISCOUNTS_BASE_URL = 'https://www.willys.se/search/campaigns/offline';
export const WILLYS_STORE_API_URL = 'https://www.willys.se/axfood/rest/store';
export const WILLYS_CATEGORY_TREE_URL = 'https://www.willys.se/leftMenu/categorytree';
export const WILLYS_CATEGORY_BASE_URL = 'https://www.willys.se/c';
export const DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_ID = '2110';
export const DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_IDS = [
  '2110',
  '2187',
  '2102',
  '2149',
  '2355',
  '2268',
  '2121',
  '2212',
  '2193',
  '2207',
  '2219',
  '2260',
  '2259',
  '2232',
  '2206',
  '2353',
  '2103',
  '2329',
  '2348',
  '2328',
  '2249',
  '2225',
  '2152',
  '2224',
  '2118',
  '2282',
  '2240',
  '2325',
  '2267',
  '2322',
  '2230',
  '2248',
  '2292',
  '2241',
  '2132',
  '2223',
  '2288',
  '2111',
  '2247',
  '2226',
  '2321',
  '2137',
  '2236',
  '2335',
  '2271',
  '2196',
  '2324',
  '2173',
  '2338',
  '2250',
  '2296',
  '2349',
  '2234',
  '2135',
  '2285',
  '2238',
  '2145',
  '2153',
  '2117',
  '2290',
  '2358',
  '2210',
  '2334',
  '2266',
  '2108',
  '2337',
  '2275',
  '2104',
  '2201',
  '2198',
  '2269',
  '2105',
  '2160',
  '2298',
  '2256',
  '2347',
  '2127',
  '2179',
  '2176',
  '2354',
  '2360',
  '2125',
  '2244',
  '2114',
  '2144',
  '2253',
  '2150',
  '2279',
  '2189',
  '2202',
  '2141',
  '2215',
  '2170',
  '2192',
  '2159',
  '2336',
  '2246',
  '2281',
  '2278',
  '2188',
  '2227',
  '2323',
  '2257',
  '2211',
  '2291',
  '2327',
  '2208',
  '2199',
  '2299',
  '2277',
  '2270',
  '2294',
  '2228',
  '2220',
  '2200',
  '2351',
  '2205',
  '2252',
  '2350',
  '2295',
  '2129',
  '2345',
  '2163',
  '2134',
  '2660',
  '2242',
  '2214',
  '2167',
  '2344',
  '2340',
  '2239',
  '2138',
  '2284',
  '2229',
  '2330',
  '2361',
  '2274',
  '2143',
  '2151',
  '2213',
  '2106',
  '2262',
  '2184',
  '2203',
  '2333',
  '2276',
  '2194',
  '2218',
  '2272',
  '2341',
  '2235',
  '2161',
  '2182',
  '2342',
  '2346',
  '2162',
  '2320',
  '2263',
  '2204',
  '2297',
  '2171',
  '2339',
  '2261',
  '2343',
  '2265',
  '2131',
  '2231',
  '2286',
  '2280',
  '2662',
  '2174',
  '2254',
  '2326',
  '2233',
  '2222',
  '2289',
  '2123',
  '2139',
  '2197',
  '2120',
  '2357',
  '2860',
  '2823',
  '2878',
  '2810',
  '2874',
  '2858',
  '2857',
  '2871',
  '2875',
  '2850',
  '2859',
  '2820'
] as const;

export const DEFAULT_WILLYS_SEARCH_QUERIES = [
  'makaroner',
  'mjolk',
  'kaffe',
  'ris',
  'pasta',
  'yoghurt',
  'brod',
  'ost',
  'agg',
  'smor',
  'potatis',
  'banan',
  'kyckling',
  'ketchup',
  'havregryn',
  'juice',
  'flingor',
  'mjol',
  'olja',
  'tomat',
  'fisk',
  'kottfars',
  'korv',
  'glass',
  'choklad',
  'frukt',
  'gronsaker',
  'godis',
  'soppa',
  'tacos',
  'nudlar',
  'falukorv',
  'lax',
  'tonfisk',
  'gurka',
  'paprika'
] as const;
export const DEFAULT_WILLYS_PRODUCTS_MAX_ROWS = 500;
export const DEFAULT_WILLYS_CATEGORY_PAGE_SIZE = 100;

export type FetchWillysProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  categoryPaths?: readonly string[];
  categoryTreeUrl?: string;
  storeId?: string;
  maxRows?: number;
  retrievedAt?: string;
};

export type FetchWillysProductsForAllStoresOptions = Omit<FetchWillysProductsOptions, 'storeId' | 'maxRows'> & AllStoreTaskRunnerControls & {
  storeApiUrl?: string;
  maxStores?: number;
  maxRowsPerStore?: number;
};

export type FetchWillysWeeklyDiscountsOptions = {
  fetchImpl?: typeof fetch;
  storeId?: string;
  storeIds?: readonly string[];
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export type FetchWillysAllStoreWeeklyDiscountsOptions = Omit<FetchWillysWeeklyDiscountsOptions, 'storeId' | 'storeIds'> & AllStoreTaskRunnerControls & {
  storeApiUrl?: string;
  maxStores?: number;
};

export type FetchWillysStoresOptions = {
  fetchImpl?: typeof fetch;
  online?: boolean;
  maxRows?: number;
  retrievedAt?: string;
  storeApiUrl?: string;
};


const WILLYS_REQUEST_TIMEOUT_MS = 20_000;

function withWillysRequestTimeout(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init = {}) => {
    const timeoutSignal = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      ? AbortSignal.timeout(WILLYS_REQUEST_TIMEOUT_MS)
      : undefined;
    return fetchImpl(input, timeoutSignal ? { ...init, signal: init.signal ?? timeoutSignal } : init);
  };
}

export function buildWillysSearchUrl(query: string, storeId?: string): string {
  const url = new URL(WILLYS_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  if (storeId) url.searchParams.set('store', storeId);
  return url.toString();
}

export function buildWillysCategoryUrl(categoryPath: string, size = DEFAULT_WILLYS_CATEGORY_PAGE_SIZE, page = 0, storeId?: string): string {
  const safePath = categoryPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const url = new URL(`${WILLYS_CATEGORY_BASE_URL}/${safePath}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  if (storeId) url.searchParams.set('store', storeId);
  return url.toString();
}

export async function fetchWillysCategoryPaths(options: { fetchImpl?: typeof fetch; categoryTreeUrl?: string } = {}): Promise<string[]> {
  const fetchImpl = withWillysRequestTimeout(options.fetchImpl ?? fetch);
  const sourceUrl = options.categoryTreeUrl ?? WILLYS_CATEGORY_TREE_URL;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Willys category tree request failed: ${response.status}`);
  const root = await response.json() as AxfoodCategoryTreeNode;
  const paths = (root.children ?? [])
    .filter((node) => node.valid !== false)
    .map((node) => text(node.url))
    .filter((url): url is string => Boolean(url));
  if (paths.length === 0) throw new Error('Willys category tree had no usable category paths.');
  return paths;
}

export function buildWillysWeeklyDiscountsUrl(
  storeId = DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_ID,
  size = 100,
  page = 0
): string {
  const url = new URL(WILLYS_WEEKLY_DISCOUNTS_BASE_URL);
  url.searchParams.set('q', storeId);
  url.searchParams.set('type', 'PERSONAL_GENERAL');
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  return url.toString();
}

export function buildWillysStoresUrl(
  options: { online?: boolean; storeApiUrl?: string } = {}
): string {
  const url = new URL(options.storeApiUrl ?? WILLYS_STORE_API_URL);
  if (options.online !== undefined) url.searchParams.set('online', String(options.online));
  return url.toString();
}

export async function fetchWillysStores(options: FetchWillysStoresOptions = {}): Promise<WillysStore[]> {
  const fetchImpl = withWillysRequestTimeout(options.fetchImpl ?? fetch);
  const sourceUrl = buildWillysStoresUrl({ online: options.online, storeApiUrl: options.storeApiUrl });
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Willys store catalog request failed: ${response.status}`);
  const payload = await response.json() as WillysStoreApiRow[];
  if (!Array.isArray(payload)) throw new Error('Willys store catalog response must be an array.');
  const rows: WillysStore[] = [];
  const seenStoreIds = new Set<string>();
  for (const store of payload) {
    const row = normalizeWillysStore(store, sourceUrl, retrievedAt);
    if (!row || seenStoreIds.has(row.storeId)) continue;
    seenStoreIds.add(row.storeId);
    rows.push(row);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('Willys store catalog had no usable stores.');
  return rows;
}

export async function fetchWillysProducts(options: FetchWillysProductsOptions = {}): Promise<WillysProduct[]> {
  const fetchImpl = withWillysRequestTimeout(options.fetchImpl ?? fetch);
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: WillysProduct[] = [];
  const seenCodes = new Set<string>();

  if (options.queries) {
    for (const query of options.queries) {
      const sourceUrl = buildWillysSearchUrl(query, options.storeId);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        }
      });

      if (!response.ok) {
        throw new Error(`Willys search request failed for ${query}: ${response.status}`);
      }

      const payload = await response.json() as WillysSearchResponse;
      for (const product of payload.results ?? []) {
        const row = normalizeWillysProduct(product, sourceUrl, retrievedAt);
        if (!row || seenCodes.has(row.code)) continue;
        seenCodes.add(row.code);
        rows.push(row);
        if (rows.length >= maxRows) return rows;
      }
    }
    return rows;
  }

  const categoryPaths = options.categoryPaths ?? await fetchWillysCategoryPaths({
    fetchImpl,
    categoryTreeUrl: options.categoryTreeUrl
  });
  for (const categoryPath of categoryPaths) {
    let page = 0;
    let pageCount: number | null = null;

    while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
      const sourceUrl = buildWillysCategoryUrl(categoryPath, DEFAULT_WILLYS_CATEGORY_PAGE_SIZE, page, options.storeId);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        }
      });

      if (!response.ok) {
        throw new Error(`Willys category request failed for ${categoryPath}: ${response.status}`);
      }

      const payload = await response.json() as WillysSearchResponse;
      const results = payload.results ?? [];
      const responsePageCount = numberOrNull(payload.pagination?.numberOfPages);
      pageCount = responsePageCount && responsePageCount > 0 ? responsePageCount : page + 1;

      for (const product of results) {
        const row = normalizeWillysProduct(product, sourceUrl, retrievedAt);
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


export async function fetchWillysProductsForAllStores(
  options: FetchWillysProductsForAllStoresOptions = {}
): Promise<WillysStoreProduct[]> {
  const stores = await fetchWillysStores({
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
      const products = await fetchWillysProducts({
        fetchImpl: options.fetchImpl,
        queries: options.queries,
        categoryPaths: options.categoryPaths,
        categoryTreeUrl: options.categoryTreeUrl,
        storeId: store.storeId,
        maxRows: options.maxRowsPerStore,
        retrievedAt: options.retrievedAt
      });
      return products.map((product) => ({
        ...product,
        storeId: store.storeId,
        storeName: store.name,
        city: store.city
      }));
    }
  });
  if (rows.length === 0 && failures.length > 0) throw new Error(`Willys all-store product requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  return rows;
}

export async function fetchWillysWeeklyDiscounts(
  options: FetchWillysWeeklyDiscountsOptions = {}
): Promise<WillysWeeklyDiscount[]> {
  const fetchImpl = withWillysRequestTimeout(options.fetchImpl ?? fetch);
  const storeIds = options.storeIds && options.storeIds.length > 0
    ? options.storeIds
    : options.storeId
      ? [options.storeId]
      : DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_IDS;
  const maxRows = options.maxRows ?? storeIds.length * 300;
  const pageSize = options.pageSize ?? Math.min(maxRows, 100);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: WillysWeeklyDiscount[] = [];
  const seenCodes = new Set<string>();

  for (const storeId of storeIds) {
    let page = 0;
    let pageCount: number | null = null;

    while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
      const sourceUrl = buildWillysWeeklyDiscountsUrl(storeId, pageSize, page);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        }
      });

      if (!response.ok) {
        throw new Error(`Willys weekly discounts request failed for ${storeId}: ${response.status}`);
      }

      const payload = await response.json() as AxfoodCampaignResponse;
      const results = payload.results ?? [];
      const responsePageCount = numberOrNull(payload.pagination?.numberOfPages);
      pageCount = responsePageCount && responsePageCount > 0 ? responsePageCount : page + 1;

      for (const product of results) {
        for (const promotion of product.potentialPromotions ?? []) {
          const row = normalizeWillysWeeklyDiscount(product, promotion, sourceUrl, retrievedAt, storeId);
          const rowKey = row ? `${row.storeId}:${row.code}` : '';
          if (!row || seenCodes.has(rowKey)) {
            continue;
          }
          seenCodes.add(rowKey);
          rows.push(row);
          if (rows.length >= maxRows) {
            return rows;
          }
        }
      }

      if (results.length === 0) {
        break;
      }
      page += 1;
    }
  }

  return rows;
}

export async function fetchWillysWeeklyDiscountsForAllStores(
  options: FetchWillysAllStoreWeeklyDiscountsOptions = {}
): Promise<WillysWeeklyDiscount[]> {
  const stores = await fetchWillysStores({
    fetchImpl: options.fetchImpl,
    online: true,
    maxRows: options.maxStores,
    retrievedAt: options.retrievedAt,
    storeApiUrl: options.storeApiUrl
  });
  const perStoreMaxRows = Math.min(options.maxRows ?? 300, 300);
  const { rows, failures } = await runAllStoreTasks({
    stores,
    storeId: (store) => store.storeId,
    storeConcurrency: options.storeConcurrency,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: async (store) => await fetchWillysWeeklyDiscounts({
        fetchImpl: options.fetchImpl,
        storeIds: [store.storeId],
        maxRows: perStoreMaxRows,
        pageSize: options.pageSize,
        retrievedAt: options.retrievedAt
      })
  });
  if (options.maxRows && rows.length >= options.maxRows) return rows.slice(0, options.maxRows);
  if (rows.length === 0 && failures.length > 0) throw new Error(`Willys all-store weekly discount requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  return rows;
}

export function normalizeWillysStore(
  store: WillysStoreApiRow,
  sourceUrl: string,
  retrievedAt: string
): WillysStore | null {
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
    clickAndCollect: store.clickAndCollect === true,
    flyerUrl: text(store.flyerURL),
    sourceUrl,
    retrievedAt
  };
}

export function normalizeWillysProduct(
  product: WillysSearchProduct,
  sourceUrl: string,
  retrievedAt: string
): WillysProduct | null {
  const code = text(product.code);
  const name = text(product.name);
  const price = numberOrNull(product.priceValue);
  if (!code || !name || price === null) {
    return null;
  }

  return {
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

export function normalizeWillysWeeklyDiscount(
  product: AxfoodCampaignProduct,
  promotion: AxfoodCampaignPromotion,
  sourceUrl: string,
  retrievedAt: string,
  storeId: string
): WillysWeeklyDiscount | null {
  const promotionCode = text(promotion.code);
  const productCode = text(promotion.mainProductCode);
  const name = text(promotion.name) || text(product.name);
  const price = numberOrNull(promotion.price);
  if (!promotionCode || !productCode || !name || price === null) {
    return null;
  }

  return {
    code: promotionCode,
    productCode,
    name,
    brand: firstString(promotion.brands) || text(product.manufacturer),
    storeId,
    campaignType: text(promotion.campaignType),
    promotionType: text(promotion.promotionType),
    price,
    priceText: text(promotion.cartLabel) || text(promotion.rewardLabel),
    comparePriceText: text(promotion.comparePrice),
    regularPriceText: text(product.priceNoUnit),
    savePriceText: text(promotion.savePrice),
    packageText: text(promotion.weightVolume) || text(product.displayVolume),
    conditionText: text(promotion.conditionLabel),
    redeemLimitText: text(promotion.redeemLimitLabel),
    startDate: text(promotion.startDate),
    endDate: text(promotion.endDate),
    validUntil: epochMillisToIso(promotion.validUntil),
    category: text(product.googleAnalyticsCategory),
    imageUrl: text(product.image?.url) || text(product.thumbnail?.url),
    labels: stringArray(product.labels),
    sourceUrl,
    retrievedAt
  };
}

function epochMillisToIso(value: unknown): string {
  const millis = numberOrNull(value);
  return millis === null ? '' : new Date(millis).toISOString();
}

function firstString(value: unknown): string {
  return Array.isArray(value) ? text(value.find((item) => typeof item === 'string')) : '';
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
