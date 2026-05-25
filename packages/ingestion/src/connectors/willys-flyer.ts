import {
  fetchWillysWeeklyDiscounts,
  type FetchWillysWeeklyDiscountsOptions,
  type WillysWeeklyDiscount
} from './willys.js';

export const WILLYS_FLYER_URL = 'https://www.willys.se/erbjudanden';

export type WillysFlyerStructuredPromotion =
  | {
      kind: 'x_for_y';
      buyQuantity: number;
      payQuantity: number;
      sourceText: string;
    }
  | {
      kind: 'multi_buy_price';
      quantity: number;
      totalPrice: number;
      sourceText: string;
    }
  | {
      kind: 'fixed_price';
      price: number;
      sourceText: string;
    };

export type WillysFlyerOffer = {
  code: string;
  productCode: string;
  name: string;
  brand: string;
  storeId: string;
  storeName: string;
  city: string;
  channel: 'weekly_flyer';
  sourceType: 'weekly_flyer';
  priceType: 'flyer';
  price: number;
  priceText: string;
  comparePriceText: string;
  regularPriceText: string;
  savePriceText: string;
  packageText: string;
  conditionText: string;
  startDate: string;
  endDate: string;
  validUntil: string;
  category: string;
  imageUrl: string;
  labels: string[];
  sourceUrl: string;
  flyerUrl: string;
  retrievedAt: string;
  structuredPromotion: WillysFlyerStructuredPromotion;
};

export type FetchWillysFlyerOffersOptions = FetchWillysWeeklyDiscountsOptions;

export async function fetchWillysFlyerOffers(
  options: FetchWillysFlyerOffersOptions = {}
): Promise<WillysFlyerOffer[]> {
  const discounts = await fetchWillysWeeklyDiscounts(options);
  return discounts
    .filter((discount) => !discount.isMemberPrice && !discount.redeemLimitText.toLowerCase().includes('willys plus'))
    .map(willysFlyerOfferFromDiscount)
    .filter((offer): offer is WillysFlyerOffer => offer !== null);
}

export function willysFlyerOfferFromDiscount(discount: WillysWeeklyDiscount): WillysFlyerOffer | null {
  const structuredPromotion = promotionRouter(discount);
  if (!structuredPromotion) return null;

  return {
    code: discount.code,
    productCode: discount.productCode,
    name: discount.name,
    brand: discount.brand,
    storeId: discount.storeId,
    storeName: discount.storeName,
    city: discount.city,
    channel: 'weekly_flyer',
    sourceType: 'weekly_flyer',
    priceType: 'flyer',
    price: discount.price,
    priceText: discount.priceText,
    comparePriceText: discount.comparePriceText,
    regularPriceText: discount.regularPriceText,
    savePriceText: discount.savePriceText,
    packageText: discount.packageText,
    conditionText: discount.conditionText,
    startDate: discount.startDate,
    endDate: discount.endDate,
    validUntil: discount.validUntil,
    category: discount.category,
    imageUrl: discount.imageUrl,
    labels: discount.labels,
    sourceUrl: discount.sourceUrl,
    flyerUrl: WILLYS_FLYER_URL,
    retrievedAt: discount.retrievedAt,
    structuredPromotion
  };
}

export function promotionRouter(discount: WillysWeeklyDiscount): WillysFlyerStructuredPromotion | null {
  const sourceText = [
    discount.conditionText,
    discount.priceText,
    discount.savePriceText
  ].filter(Boolean).join(' · ');
  const normalized = sourceText.toLowerCase();
  const xForY = normalized.match(/tag\s+(\d+)\s+betala\s+f[öo]r\s+(\d+)/);
  if (xForY) {
    return {
      kind: 'x_for_y',
      buyQuantity: Number(xForY[1]),
      payQuantity: Number(xForY[2]),
      sourceText
    };
  }

  if (discount.multiBuy && discount.multiBuy.qualifyingCount > 1) {
    return {
      kind: 'multi_buy_price',
      quantity: discount.multiBuy.qualifyingCount,
      totalPrice: parsePrice(discount.priceText) || discount.price,
      sourceText
    };
  }

  const multiBuy = normalized.match(/(\d+)\s*f[öo]r\s*([\d,.:]+)/);
  if (multiBuy) {
    return {
      kind: 'multi_buy_price',
      quantity: Number(multiBuy[1]),
      totalPrice: parsePrice(multiBuy[2]),
      sourceText
    };
  }

  if (Number.isFinite(discount.price) && discount.price > 0) {
    return {
      kind: 'fixed_price',
      price: discount.price,
      sourceText: sourceText || discount.priceText
    };
  }

  return null;
}

function parsePrice(value: string | undefined): number {
  const normalized = (value ?? '').replace(':', '.').replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
