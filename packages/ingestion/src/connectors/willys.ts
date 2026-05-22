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
export const DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_ID = '2110';
export const DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_IDS = ['2110', '2187', '2102', '2149', '2355', '2268'] as const;

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
  'havregryn'
] as const;

export type FetchWillysProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export type FetchWillysWeeklyDiscountsOptions = {
  fetchImpl?: typeof fetch;
  storeId?: string;
  storeIds?: readonly string[];
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export type FetchWillysStoresOptions = {
  fetchImpl?: typeof fetch;
  online?: boolean;
  maxRows?: number;
  retrievedAt?: string;
  storeApiUrl?: string;
};

export function buildWillysSearchUrl(query: string): string {
  const url = new URL(WILLYS_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
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
  const fetchImpl = options.fetchImpl ?? fetch;
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
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_WILLYS_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? 150;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: WillysProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildWillysSearchUrl(query);
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
      if (!row || seenCodes.has(row.code)) {
        continue;
      }
      seenCodes.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export async function fetchWillysWeeklyDiscounts(
  options: FetchWillysWeeklyDiscountsOptions = {}
): Promise<WillysWeeklyDiscount[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
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
