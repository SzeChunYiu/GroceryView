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
export const DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_ID = '4003';
export const DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_IDS = [
  '4003',
  '4127',
  '4190',
  '4798',
  '4660',
  '4775',
  '4196',
  '4111',
  '4162',
  '4273',
  '4349',
  '4359',
  '4734',
  '4773',
  '4239',
  '4667',
  '4221',
  '4203',
  '4521',
  '4930',
  '4524',
  '4146',
  '4222',
  '4219',
  '4792',
  '4245',
  '4189',
  '4511',
  '4263',
  '4293',
  '4214',
  '4526',
  '4131',
  '4266',
  '4207',
  '4535',
  '4681',
  '4142',
  '4545',
  '4277',
  '4225',
  '4738',
  '4550',
  '4224',
  '4123',
  '4212',
  '4114',
  '4247'
] as const;

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
  'havregryn'
] as const;

export type FetchHemkopProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export type FetchHemkopWeeklyDiscountsOptions = {
  fetchImpl?: typeof fetch;
  storeId?: string;
  storeIds?: readonly string[];
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export type FetchHemkopAllStoreWeeklyDiscountsOptions = Omit<FetchHemkopWeeklyDiscountsOptions, 'storeId' | 'storeIds'> & {
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

export function buildHemkopSearchUrl(query: string, size?: number, page = 0): string {
  const url = new URL(HEMKOP_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  if (size !== undefined) {
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));
  }
  return url.toString();
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
  const queries = options.queries ?? DEFAULT_HEMKOP_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const pageSize = options.pageSize ?? 100;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: HemkopProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    let page = 0;
    let pageCount: number | null = null;

    while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
      const sourceUrl = buildHemkopSearchUrl(query, pageSize, page);
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
        if (!row || seenCodes.has(row.code)) {
          continue;
        }
        seenCodes.add(row.code);
        rows.push(row);
        if (rows.length >= maxRows) {
          return rows;
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
    online: true,
    maxRows: options.maxStores,
    retrievedAt: options.retrievedAt,
    storeApiUrl: options.storeApiUrl
  });
  return await fetchHemkopWeeklyDiscounts({
    fetchImpl: options.fetchImpl,
    storeIds: stores.map((store) => store.storeId),
    maxRows: options.maxRows ?? stores.length * 300,
    pageSize: options.pageSize,
    retrievedAt: options.retrievedAt
  });
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
