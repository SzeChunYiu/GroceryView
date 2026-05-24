import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

export type HemkopProduct = {
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

export type HemkopWeeklyDiscount = {
  code: string;
  productCode: string;
  name: string;
  brand: string;
  storeId: string;
  storeName: string;
  city: string;
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

export type HemkopStore = {
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

export type HemkopStoreProduct = HemkopProduct & {
  storeId: string;
  storeName: string;
  city: string;
};

type HemkopSearchProduct = {
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

type HemkopSearchResponse = {
  results?: HemkopSearchProduct[];
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

type HemkopStoreAddress = {
  line1?: unknown;
  town?: unknown;
  postalCode?: unknown;
  country?: { isocode?: unknown };
  formattedAddress?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

type HemkopStoreApiRow = {
  storeId?: unknown;
  name?: unknown;
  address?: HemkopStoreAddress;
  geoPoint?: { latitude?: unknown; longitude?: unknown };
  onlineStore?: unknown;
  clickAndCollect?: unknown;
  flyerURL?: unknown;
};

export const HEMKOP_SEARCH_BASE_URL = 'https://www.hemkop.se/search';
export const HEMKOP_WEEKLY_DISCOUNTS_BASE_URL = 'https://www.hemkop.se/search/campaigns/offline';
export const HEMKOP_STORE_API_URL = 'https://www.hemkop.se/axfood/rest/store';
export const HEMKOP_CATEGORY_TREE_URL = 'https://www.hemkop.se/leftMenu/categorytree';
export const HEMKOP_CATEGORY_BASE_URL = 'https://www.hemkop.se/c';
export const DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_ID = '4003';
export const DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_IDS = [
  '4102',
  '4103',
  '4111',
  '4114',
  '4119',
  '4123',
  '4127',
  '4129',
  '4131',
  '4138',
  '4142',
  '4146',
  '4147',
  '4150',
  '4156',
  '4162',
  '4168',
  '4175',
  '4183',
  '4189',
  '4190',
  '4191',
  '4193',
  '4195',
  '4196',
  '4199',
  '4200',
  '4201',
  '4202',
  '4203',
  '4204',
  '4207',
  '4208',
  '4212',
  '4214',
  '4216',
  '4219',
  '4220',
  '4221',
  '4222',
  '4224',
  '4225',
  '4228',
  '4229',
  '4230',
  '4231',
  '4232',
  '4234',
  '4239',
  '4245',
  '4247',
  '4252',
  '4254',
  '4256',
  '4263',
  '4264',
  '4265',
  '4266',
  '4269',
  '4273',
  '4277',
  '4293',
  '4297',
  '4307',
  '4349',
  '4353',
  '4359',
  '4360',
  '4504',
  '4507',
  '4508',
  '4511',
  '4512',
  '4513',
  '4514',
  '4515',
  '4517',
  '4519',
  '4520',
  '4521',
  '4524',
  '4526',
  '4527',
  '4530',
  '4534',
  '4535',
  '4537',
  '4539',
  '4541',
  '4542',
  '4545',
  '4546',
  '4547',
  '4549',
  '4550',
  '4552',
  '4554',
  '4555',
  '4557',
  '4558',
  '4559',
  '4560',
  '4561',
  '4563',
  '4566',
  '4569',
  '4573',
  '4580',
  '4585',
  '4587',
  '4590',
  '4592',
  '4604',
  '4605',
  '4606',
  '4607',
  '4608',
  '4609',
  '4610',
  '4616',
  '4623',
  '4624',
  '4626',
  '4627',
  '4628',
  '4629',
  '4633',
  '4638',
  '4639',
  '4640',
  '4641',
  '4642',
  '4644',
  '4647',
  '4655',
  '4656',
  '4657',
  '4658',
  '4660',
  '4667',
  '4669',
  '4670',
  '4671',
  '4672',
  '4673',
  '4674',
  '4676',
  '4681',
  '4682',
  '4683',
  '4684',
  '4685',
  '4687',
  '4688',
  '4689',
  '4690',
  '4695',
  '4697',
  '4698',
  '4701',
  '4702',
  '4705',
  '4706',
  '4714',
  '4716',
  '4720',
  '4721',
  '4725',
  '4726',
  '4727',
  '4730',
  '4732',
  '4734',
  '4735',
  '4736',
  '4737',
  '4738',
  '4748',
  '4751',
  '4753',
  '4754',
  '4755',
  '4756',
  '4757',
  '4766',
  '4767',
  '4770',
  '4771',
  '4772',
  '4773',
  '4774',
  '4775',
  '4781',
  '4785',
  '4789',
  '4792',
  '4794',
  '4797',
  '4798',
  '4799',
  '4930',
  '4936',
  '4937',
  '4938',
  '4939'
] as const;

export const DEFAULT_HEMKOP_CATEGORY_PAGE_SIZE = 100;

export const DEFAULT_HEMKOP_SEARCH_QUERIES = [
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
  'paprika',
  'morot',
  'lok',
  'vitlok',
  'apelsin',
  'apple',
  'citron',
  'broccoli',
  'majs',
  'bonor',
  'linser',
  'skinka',
  'bacon',
  'gradde',
  'kvarg',
  'knackebrod',
  'mineralvatten',
  'havredryck',
  'toalettpapper'
] as const;
export const DEFAULT_HEMKOP_LIVE_PRODUCT_MAX_ROWS = 7600;
export const DEFAULT_HEMKOP_LIVE_WEEKLY_DISCOUNT_MAX_ROWS = 70000;

export type FetchHemkopProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  categoryPaths?: readonly string[];
  categoryTreeUrl?: string;
  storeId?: string;
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export type FetchHemkopProductsForAllStoresOptions = Omit<FetchHemkopProductsOptions, 'storeId' | 'maxRows'> & AllStoreTaskRunnerControls & {
  storeApiUrl?: string;
  maxStores?: number;
  maxRowsPerStore?: number;
};

export type FetchHemkopWeeklyDiscountsOptions = {
  fetchImpl?: typeof fetch;
  storeId?: string;
  storeIds?: readonly string[];
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export type FetchHemkopAllStoreWeeklyDiscountsOptions = Omit<FetchHemkopWeeklyDiscountsOptions, 'storeId' | 'storeIds'> & AllStoreTaskRunnerControls & {
  storeApiUrl?: string;
  maxStores?: number;
};

export type FetchHemkopStoresOptions = {
  fetchImpl?: typeof fetch;
  online?: boolean;
  maxRows?: number;
  retrievedAt?: string;
  storeApiUrl?: string;
};

export function buildHemkopSearchUrl(query: string, size?: number, page = 0, storeId?: string): string {
  const url = new URL(HEMKOP_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  if (storeId) url.searchParams.set('store', storeId);
  if (size !== undefined) {
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));
  }
  return url.toString();
}

export function buildHemkopCategoryUrl(categoryPath: string, size = DEFAULT_HEMKOP_CATEGORY_PAGE_SIZE, page = 0, storeId?: string): string {
  const safePath = categoryPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const url = new URL(`${HEMKOP_CATEGORY_BASE_URL}/${safePath}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  if (storeId) url.searchParams.set('store', storeId);
  return url.toString();
}

export async function fetchHemkopCategoryPaths(options: { fetchImpl?: typeof fetch; categoryTreeUrl?: string } = {}): Promise<string[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.categoryTreeUrl ?? HEMKOP_CATEGORY_TREE_URL;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Hemkop category tree request failed: ${response.status}`);
  const root = await response.json() as AxfoodCategoryTreeNode;
  const paths = (root.children ?? [])
    .filter((node) => node.valid !== false)
    .map((node) => text(node.url))
    .filter((url): url is string => Boolean(url));
  if (paths.length === 0) throw new Error('Hemkop category tree had no usable category paths.');
  return paths;
}

export function buildHemkopWeeklyDiscountsUrl(
  storeId = DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_ID,
  size = 100,
  page = 0
): string {
  const url = new URL(HEMKOP_WEEKLY_DISCOUNTS_BASE_URL);
  url.searchParams.set('q', storeId);
  url.searchParams.set('type', 'PERSONAL_GENERAL');
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  return url.toString();
}

export function buildHemkopStoresUrl(
  options: { online?: boolean; storeApiUrl?: string } = {}
): string {
  const url = new URL(options.storeApiUrl ?? HEMKOP_STORE_API_URL);
  if (options.online !== undefined) url.searchParams.set('online', String(options.online));
  return url.toString();
}

export async function fetchHemkopStores(options: FetchHemkopStoresOptions = {}): Promise<HemkopStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = buildHemkopStoresUrl({ online: options.online, storeApiUrl: options.storeApiUrl });
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Hemkop store catalog request failed: ${response.status}`);
  const payload = await response.json() as HemkopStoreApiRow[];
  if (!Array.isArray(payload)) throw new Error('Hemkop store catalog response must be an array.');
  const rows: HemkopStore[] = [];
  const seenStoreIds = new Set<string>();
  for (const store of payload) {
    const row = normalizeHemkopStore(store, sourceUrl, retrievedAt);
    if (!row || seenStoreIds.has(row.storeId)) continue;
    seenStoreIds.add(row.storeId);
    rows.push(row);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('Hemkop store catalog had no usable stores.');
  return rows;
}

export async function fetchHemkopProducts(options: FetchHemkopProductsOptions = {}): Promise<HemkopProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const pageSize = options.pageSize ?? DEFAULT_HEMKOP_CATEGORY_PAGE_SIZE;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: HemkopProduct[] = [];
  const seenCodes = new Set<string>();

  if (options.queries) {
    for (const query of options.queries) {
      let page = 0;
      let pageCount: number | null = null;

      while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
        const sourceUrl = buildHemkopSearchUrl(query, pageSize, page, options.storeId);
        const response = await fetchImpl(sourceUrl, {
          headers: {
            accept: 'application/json',
            'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
          }
        });

        if (!response.ok) {
          throw new Error(`Hemkop search request failed for ${query}: ${response.status}`);
        }

        const payload = await response.json() as HemkopSearchResponse;
        const results = payload.results ?? [];
        const responsePageCount = numberOrNull(payload.pagination?.numberOfPages);
        pageCount = responsePageCount && responsePageCount > 0 ? responsePageCount : page + 1;

        for (const product of results) {
          const row = normalizeHemkopProduct(product, sourceUrl, retrievedAt);
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

  const categoryPaths = options.categoryPaths ?? await fetchHemkopCategoryPaths({
    fetchImpl,
    categoryTreeUrl: options.categoryTreeUrl
  });
  for (const categoryPath of categoryPaths) {
    let page = 0;
    let pageCount: number | null = null;

    while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
      const sourceUrl = buildHemkopCategoryUrl(categoryPath, pageSize, page, options.storeId);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        }
      });

      if (!response.ok) {
        throw new Error(`Hemkop category request failed for ${categoryPath}: ${response.status}`);
      }

      const payload = await response.json() as HemkopSearchResponse;
      const results = payload.results ?? [];
      const responsePageCount = numberOrNull(payload.pagination?.numberOfPages);
      pageCount = responsePageCount && responsePageCount > 0 ? responsePageCount : page + 1;

      for (const product of results) {
        const row = normalizeHemkopProduct(product, sourceUrl, retrievedAt);
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



export async function fetchHemkopProductsForAllStores(
  options: FetchHemkopProductsForAllStoresOptions = {}
): Promise<HemkopStoreProduct[]> {
  const stores = await fetchHemkopStores({
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
      const products = await fetchHemkopProducts({
        fetchImpl: options.fetchImpl,
        queries: options.queries,
        categoryPaths: options.categoryPaths,
        categoryTreeUrl: options.categoryTreeUrl,
        storeId: store.storeId,
        maxRows: options.maxRowsPerStore,
        pageSize: options.queries ? options.maxRowsPerStore ?? options.pageSize : options.pageSize,
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
  if (rows.length === 0 && failures.length > 0) throw new Error(`Hemkop all-store product requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  return rows;
}

export async function fetchHemkopWeeklyDiscounts(
  options: FetchHemkopWeeklyDiscountsOptions = {}
): Promise<HemkopWeeklyDiscount[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const storeIds = options.storeIds && options.storeIds.length > 0
    ? options.storeIds
    : options.storeId
      ? [options.storeId]
      : DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_IDS;
  const maxRows = options.maxRows ?? storeIds.length * 300;
  const pageSize = options.pageSize ?? Math.min(maxRows, 100);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: HemkopWeeklyDiscount[] = [];
  const seenCodes = new Set<string>();

  for (const storeId of storeIds) {
    let page = 0;
    let pageCount: number | null = null;

    while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
      const sourceUrl = buildHemkopWeeklyDiscountsUrl(storeId, pageSize, page);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        }
      });

      if (!response.ok) {
        throw new Error(`Hemkop weekly discounts request failed for ${storeId}: ${response.status}`);
      }

      const payload = await response.json() as AxfoodCampaignResponse;
      const results = payload.results ?? [];
      const responsePageCount = numberOrNull(payload.pagination?.numberOfPages);
      pageCount = responsePageCount && responsePageCount > 0 ? responsePageCount : page + 1;

      for (const product of results) {
        for (const promotion of product.potentialPromotions ?? []) {
          const row = normalizeHemkopWeeklyDiscount(product, promotion, sourceUrl, retrievedAt, storeId);
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

export async function fetchHemkopWeeklyDiscountsForAllStores(
  options: FetchHemkopAllStoreWeeklyDiscountsOptions = {}
): Promise<HemkopWeeklyDiscount[]> {
  const stores = await fetchHemkopStores({
    fetchImpl: options.fetchImpl,
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
    task: async (store) => {
      const discounts = await fetchHemkopWeeklyDiscounts({
        fetchImpl: options.fetchImpl,
        storeIds: [store.storeId],
        maxRows: perStoreMaxRows,
        pageSize: options.pageSize,
        retrievedAt: options.retrievedAt
      });
      return discounts.map((discount) => ({
        ...discount,
        storeName: store.name,
        city: store.city
      }));
    }
  });
  if (options.maxRows && rows.length >= options.maxRows) return rows.slice(0, options.maxRows);
  if (rows.length === 0 && failures.length > 0) throw new Error(`Hemkop all-store weekly discount requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  return rows;
}

export function normalizeHemkopStore(
  store: HemkopStoreApiRow,
  sourceUrl: string,
  retrievedAt: string
): HemkopStore | null {
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

export function normalizeHemkopProduct(
  product: HemkopSearchProduct,
  sourceUrl: string,
  retrievedAt: string
): HemkopProduct | null {
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

export function normalizeHemkopWeeklyDiscount(
  product: AxfoodCampaignProduct,
  promotion: AxfoodCampaignPromotion,
  sourceUrl: string,
  retrievedAt: string,
  storeId: string
): HemkopWeeklyDiscount | null {
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
    storeName: '',
    city: '',
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
