import {
  fetchWillysWeeklyDiscounts,
  type FetchWillysWeeklyDiscountsOptions,
  type WillysWeeklyDiscount
} from './willys.js';

export const WILLYS_PLUS_OFFERS_URL = 'https://www.willys.se/erbjudanden?loyalty=willys-plus';

export type WillysPlusStructuredPromotion =
  | {
      kind: 'member';
      price: number;
      memberProgram: 'willys_plus';
      sourceText: string;
    }
  | {
      kind: 'member_multi_buy';
      quantity: number;
      totalPrice: number;
      memberProgram: 'willys_plus';
      sourceText: string;
    };

export type WillysPlusOffer = {
  code: string;
  productCode: string;
  name: string;
  brand: string;
  storeId: string;
  storeName: string;
  city: string;
  channel: 'willys_plus';
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
  structuredPromotion: WillysPlusStructuredPromotion;
};

export type FetchWillysPlusOffersOptions = FetchWillysWeeklyDiscountsOptions;

export async function fetchWillysPlusOffers(
  options: FetchWillysPlusOffersOptions = {}
): Promise<WillysPlusOffer[]> {
  const discounts = await fetchWillysWeeklyDiscounts(options);
  return discounts
    .filter((discount) => discount.isMemberPrice || discount.redeemLimitText.toLowerCase().includes('willys plus'))
    .map(willysPlusOfferFromDiscount)
    .filter((offer): offer is WillysPlusOffer => offer !== null);
}

export function willysPlusOfferFromDiscount(discount: WillysWeeklyDiscount): WillysPlusOffer | null {
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
    channel: 'willys_plus',
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
    memberOfferUrl: WILLYS_PLUS_OFFERS_URL,
    retrievedAt: discount.retrievedAt,
    structuredPromotion
  };
}

export function promotionRouter(discount: WillysWeeklyDiscount): WillysPlusStructuredPromotion | null {
  const sourceText = [
    discount.conditionText,
    discount.priceText,
    discount.savePriceText,
    discount.redeemLimitText
  ].filter(Boolean).join(' · ');

  if (discount.multiBuy && discount.multiBuy.qualifyingCount > 1) {
    return {
      kind: 'member_multi_buy',
      quantity: discount.multiBuy.qualifyingCount,
      totalPrice: parsePrice(discount.priceText) || discount.price,
      memberProgram: 'willys_plus',
      sourceText
    };
  }

  const multiBuy = sourceText.toLowerCase().match(/(\d+)\s*f[öo]r\s*([\d,.:]+)/);
  if (multiBuy) {
    return {
      kind: 'member_multi_buy',
      quantity: Number(multiBuy[1]),
      totalPrice: parsePrice(multiBuy[2]),
      memberProgram: 'willys_plus',
      sourceText
    };
  }

  if (Number.isFinite(discount.price) && discount.price > 0) {
    return {
      kind: 'member',
      price: discount.price,
      memberProgram: 'willys_plus',
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
