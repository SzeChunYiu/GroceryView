export const WILLYS_PLUS_OFFERS_SE_URL = 'https://www.willys.se/plus/erbjudanden';

export type WillysPlusStructuredPromotion = {
  router: 'promotionRouter';
  type: 'member_price' | 'multi_buy' | 'unknown';
  memberOnly: true;
  price: number | null;
  label: string;
  conditionText: string;
  validFrom: string;
  validTo: string;
};

export type WillysPlusOfferRow = {
  code: string;
  productCode: string;
  name: string;
  brand: string;
  price: number | null;
  priceText: string;
  comparePriceText: string;
  packageText: string;
  imageUrl: string;
  promotion: WillysPlusStructuredPromotion;
  sourceUrl: string;
  retrievedAt: string;
};

export type WillysPlusOfferPayload = {
  offers?: unknown;
  results?: unknown;
  products?: unknown;
};

type WillysPlusOfferCandidate = Record<string, unknown>;

export type FetchWillysPlusOffersSeOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export async function fetchWillysPlusOffersSe(options: FetchWillysPlusOffersSeOptions = {}): Promise<WillysPlusOfferRow[]> {
  const sourceUrl = options.sourceUrl ?? WILLYS_PLUS_OFFERS_SE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Willys Plus offers request failed: ${response.status}`);
  return parseWillysPlusOffersSe(await response.json() as WillysPlusOfferPayload, sourceUrl, options.retrievedAt ?? new Date().toISOString());
}

export function parseWillysPlusOffersSe(payload: WillysPlusOfferPayload, sourceUrl: string, retrievedAt: string): WillysPlusOfferRow[] {
  const candidates = firstArray(payload.offers) ?? firstArray(payload.results) ?? firstArray(payload.products) ?? [];
  return candidates
    .map((candidate) => normalizeWillysPlusOffer(candidate, sourceUrl, retrievedAt))
    .filter((row): row is WillysPlusOfferRow => row !== null);
}

export function normalizeWillysPlusOffer(candidate: unknown, sourceUrl: string, retrievedAt: string): WillysPlusOfferRow | null {
  if (!isRecord(candidate)) return null;
  const code = text(candidate.code) || text(candidate.promotionCode) || text(candidate.id);
  const productCode = text(candidate.productCode) || text(candidate.mainProductCode) || code;
  const name = text(candidate.name) || text(candidate.productName);
  const promotion = willysPlusPromotionRouter(candidate);
  if (!code || !productCode || !name || promotion.price === null) return null;

  return {
    code,
    productCode,
    name,
    brand: text(candidate.brand) || text(candidate.manufacturer),
    price: promotion.price,
    priceText: text(candidate.priceText) || promotion.label,
    comparePriceText: text(candidate.comparePriceText) || text(candidate.comparePrice),
    packageText: text(candidate.packageText) || text(candidate.weightVolume) || text(candidate.displayVolume),
    imageUrl: text((candidate.image as { url?: unknown } | undefined)?.url) || text(candidate.imageUrl),
    promotion,
    sourceUrl,
    retrievedAt
  };
}

export function willysPlusPromotionRouter(candidate: WillysPlusOfferCandidate): WillysPlusStructuredPromotion {
  const label = text(candidate.promotionLabel) || text(candidate.cartLabel) || text(candidate.rewardLabel) || text(candidate.priceText);
  const conditionText = text(candidate.conditionLabel) || text(candidate.conditionText) || text(candidate.redeemLimitLabel);
  const price = numberOrNull(candidate.price) ?? numberFromText(label);
  return {
    router: 'promotionRouter',
    type: /\d+\s*(för|for)\s*\d+/i.test(label) || /mixmatch/i.test(text(candidate.promotionType)) ? 'multi_buy' : price === null ? 'unknown' : 'member_price',
    memberOnly: true,
    price,
    label,
    conditionText,
    validFrom: text(candidate.startDate) || text(candidate.validFrom),
    validTo: text(candidate.endDate) || text(candidate.validTo)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstArray(value: unknown): WillysPlusOfferCandidate[] | null {
  return Array.isArray(value) ? value.filter(isRecord) : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function numberFromText(value: string): number | null {
  const normalized = value.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!normalized) return null;
  const price = Number(normalized[0]);
  return Number.isFinite(price) ? price : null;
}
