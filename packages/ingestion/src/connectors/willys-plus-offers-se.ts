export type WillysPlusOffer = {
  code: string;
  productCode: string;
  name: string;
  brand: string;
  storeId: string;
  campaignType: string;
  promotionType: string;
  price: number;
  priceText: string;
  regularPriceText: string;
  packageText: string;
  category: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  promotion: WillysPlusPromotionRoute;
};

export type WillysPlusPromotionRoute = {
  priceType: 'member';
  memberOnly: true;
  promoPrice: number;
  regularPrice: number | null;
  promotionText: string;
  validFrom: string;
  validUntil: string;
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
  weightVolume?: unknown;
  conditionLabel?: unknown;
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
  };
};

export const WILLYS_PLUS_OFFERS_SE_BASE_URL = 'https://www.willys.se/search/campaigns/offline';
export const DEFAULT_WILLYS_PLUS_STORE_ID = '2110';
export const DEFAULT_WILLYS_PLUS_PAGE_SIZE = 100;
export const WILLYS_PLUS_PROMOTION_TYPE = 'PERSONAL_GENERAL';

export type FetchWillysPlusOffersOptions = {
  fetchImpl?: typeof fetch;
  storeId?: string;
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export function buildWillysPlusOffersUrl(
  storeId = DEFAULT_WILLYS_PLUS_STORE_ID,
  size = DEFAULT_WILLYS_PLUS_PAGE_SIZE,
  page = 0
): string {
  const url = new URL(WILLYS_PLUS_OFFERS_SE_BASE_URL);
  url.searchParams.set('q', storeId);
  url.searchParams.set('type', WILLYS_PLUS_PROMOTION_TYPE);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  return url.toString();
}

export async function fetchWillysPlusOffers(options: FetchWillysPlusOffersOptions = {}): Promise<WillysPlusOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const storeId = options.storeId ?? DEFAULT_WILLYS_PLUS_STORE_ID;
  const maxRows = options.maxRows ?? 300;
  const pageSize = options.pageSize ?? Math.min(maxRows, DEFAULT_WILLYS_PLUS_PAGE_SIZE);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: WillysPlusOffer[] = [];
  const seen = new Set<string>();
  let page = 0;
  let pageCount: number | null = null;

  while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
    const sourceUrl = buildWillysPlusOffersUrl(storeId, pageSize, page);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Willys Plus offer request failed for ${storeId}: ${response.status}`);

    const payload = await response.json() as AxfoodCampaignResponse;
    const results = payload.results ?? [];
    const responsePageCount = numberOrNull(payload.pagination?.numberOfPages);
    pageCount = responsePageCount && responsePageCount > 0 ? responsePageCount : page + 1;

    for (const product of results) {
      for (const promotion of product.potentialPromotions ?? []) {
        const row = normalizeWillysPlusOffer(product, promotion, { sourceUrl, retrievedAt, storeId });
        if (!row || seen.has(row.code)) continue;
        seen.add(row.code);
        rows.push(row);
        if (rows.length >= maxRows) return rows;
      }
    }

    if (results.length === 0) break;
    page += 1;
  }

  return rows;
}

export function normalizeWillysPlusOffer(
  product: AxfoodCampaignProduct,
  promotion: AxfoodCampaignPromotion,
  context: { sourceUrl: string; retrievedAt: string; storeId: string }
): WillysPlusOffer | null {
  const promotionRoute = routeWillysPlusPromotion(product, promotion);
  const code = text(promotion.code);
  const productCode = text(promotion.mainProductCode);
  const name = text(promotion.name) || text(product.name);
  if (!promotionRoute || !code || !productCode || !name) return null;

  return {
    code,
    productCode,
    name,
    brand: firstString(promotion.brands) || text(product.manufacturer),
    storeId: context.storeId,
    campaignType: text(promotion.campaignType),
    promotionType: text(promotion.promotionType),
    price: promotionRoute.promoPrice,
    priceText: text(promotion.cartLabel) || text(promotion.rewardLabel),
    regularPriceText: text(product.priceNoUnit),
    packageText: text(promotion.weightVolume) || text(product.displayVolume),
    category: text(product.googleAnalyticsCategory),
    imageUrl: text(product.image?.url) || text(product.thumbnail?.url),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    promotion: promotionRoute
  };
}

export function routeWillysPlusPromotion(product: AxfoodCampaignProduct, promotion: AxfoodCampaignPromotion): WillysPlusPromotionRoute | null {
  const promoPrice = numberOrNull(promotion.price);
  if (promoPrice === null) return null;
  return {
    priceType: 'member',
    memberOnly: true,
    promoPrice,
    regularPrice: numberOrNull(product.priceNoUnit),
    promotionText: [promotion.cartLabel, promotion.rewardLabel, promotion.conditionLabel].map(text).filter(Boolean).join(' · ') || 'Willys Plus member offer',
    validFrom: text(promotion.startDate),
    validUntil: text(promotion.endDate) || epochMillisToIso(promotion.validUntil)
  };
}

function epochMillisToIso(value: unknown): string {
  const millis = numberOrNull(value);
  return millis === null ? '' : new Date(millis).toISOString();
}

function firstString(value: unknown): string {
  return Array.isArray(value) ? text(value[0]) : text(value);
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const numeric = Number.parseFloat(text(value).replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
