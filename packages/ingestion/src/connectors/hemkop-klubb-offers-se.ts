import {
  fetchHemkopWeeklyDiscounts,
  type FetchHemkopWeeklyDiscountsOptions,
  type HemkopWeeklyDiscount
} from './hemkop.js';

export const HEMKOP_KLUBB_OFFERS_URL = 'https://www.hemkop.se/erbjudanden/hemkop-klubb';

export type HemkopKlubbStructuredPromotion =
  | {
      kind: 'member_price';
      price: number;
      memberProgram: 'hemkop_klubb';
      sourceText: string;
    }
  | {
      kind: 'member_multi_buy';
      quantity: number;
      totalPrice: number;
      memberProgram: 'hemkop_klubb';
      sourceText: string;
    };

export type HemkopKlubbOffer = {
  code: string;
  productCode: string;
  name: string;
  brand: string;
  storeId: string;
  storeName: string;
  city: string;
  channel: 'hemkop_klubb';
  sourceType: 'member_offer';
  priceType: 'member';
  scanRequired: true;
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
  memberOfferUrl: string;
  retrievedAt: string;
  structuredPromotion: HemkopKlubbStructuredPromotion;
};

export type FetchHemkopKlubbOffersOptions = FetchHemkopWeeklyDiscountsOptions;

export async function fetchHemkopKlubbOffers(options: FetchHemkopKlubbOffersOptions = {}): Promise<HemkopKlubbOffer[]> {
  const discounts = await fetchHemkopWeeklyDiscounts(options);
  return discounts
    .filter(isHemkopKlubbDiscount)
    .map(hemkopKlubbOfferFromDiscount)
    .filter((offer): offer is HemkopKlubbOffer => offer !== null);
}

export function hemkopKlubbOfferFromDiscount(discount: HemkopWeeklyDiscount): HemkopKlubbOffer | null {
  if (!isHemkopKlubbDiscount(discount)) return null;
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
    channel: 'hemkop_klubb',
    sourceType: 'member_offer',
    priceType: 'member',
    scanRequired: true,
    price: discount.price,
    priceText: discount.priceText,
    comparePriceText: discount.comparePriceText,
    regularPriceText: discount.regularPriceText,
    savePriceText: discount.savePriceText,
    packageText: discount.packageText,
    conditionText: discount.conditionText,
    redeemLimitText: discount.redeemLimitText,
    startDate: discount.startDate,
    endDate: discount.endDate,
    validUntil: discount.validUntil,
    category: discount.category,
    imageUrl: discount.imageUrl,
    labels: discount.labels,
    sourceUrl: discount.sourceUrl,
    memberOfferUrl: HEMKOP_KLUBB_OFFERS_URL,
    retrievedAt: discount.retrievedAt,
    structuredPromotion
  };
}

export function promotionRouter(discount: HemkopWeeklyDiscount): HemkopKlubbStructuredPromotion | null {
  const sourceText = [
    discount.conditionText,
    discount.priceText,
    discount.savePriceText,
    discount.redeemLimitText,
    discount.labels.join(' ')
  ].filter(Boolean).join(' · ');
  const multiBuy = sourceText.toLowerCase().match(/(\d+)\s*f[öo]r\s*([\d,.:]+)/);
  if (multiBuy) {
    return {
      kind: 'member_multi_buy',
      quantity: Number(multiBuy[1]),
      totalPrice: parsePrice(multiBuy[2]),
      memberProgram: 'hemkop_klubb',
      sourceText
    };
  }
  if (Number.isFinite(discount.price) && discount.price > 0) {
    return {
      kind: 'member_price',
      price: discount.price,
      memberProgram: 'hemkop_klubb',
      sourceText: sourceText || discount.priceText
    };
  }
  return null;
}

function isHemkopKlubbDiscount(discount: HemkopWeeklyDiscount): boolean {
  const sourceText = [
    discount.campaignType,
    discount.promotionType,
    discount.conditionText,
    discount.priceText,
    discount.redeemLimitText,
    discount.labels.join(' ')
  ].join(' ');
  return /\b(?:hemk[oö]p\s+klubb|klubbpris|medlemspris|medlem|kundklubb)\b/i.test(sourceText);
}

function parsePrice(value: string | undefined): number {
  const normalized = (value ?? '').replace(':', '.').replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
