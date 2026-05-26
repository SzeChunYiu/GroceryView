import {
  fetchLidlOffers,
  type FetchLidlOffersOptions,
  type LidlOffer
} from './lidl.js';

export const LIDL_PLUS_COUPONS_URL = 'https://www.lidl.se/c/lidl-plus-erbjudanden/a10094788';

export type LidlPlusStructuredPromotion =
  | {
      kind: 'coupon_price';
      price: number;
      scanRequired: true;
      sourceText: string;
    }
  | {
      kind: 'coupon_multi_buy';
      quantity: number;
      totalPrice: number;
      scanRequired: true;
      sourceText: string;
    };

export type LidlPlusCoupon = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  channel: 'lidl_plus';
  sourceType: 'member_coupon';
  priceType: 'coupon';
  scanRequired: true;
  price: number;
  regularPrice: number | null;
  priceText: string;
  unitPriceText: string;
  promotionText: string;
  regions: string[];
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  couponCatalogUrl: string;
  retrievedAt: string;
  structuredPromotion: LidlPlusStructuredPromotion;
};

export type FetchLidlPlusCouponsOptions = FetchLidlOffersOptions;

export async function fetchLidlPlusCoupons(
  options: FetchLidlPlusCouponsOptions = {}
): Promise<LidlPlusCoupon[]> {
  const offers = await fetchLidlOffers(options);
  return offers
    .filter((offer) => offer.is_member_price || offer.is_coupon_price || offer.memberOnly)
    .map(lidlPlusCouponFromOffer)
    .filter((offer): offer is LidlPlusCoupon => offer !== null);
}

export function lidlPlusCouponFromOffer(offer: LidlOffer): LidlPlusCoupon | null {
  const structuredPromotion = promotionRouter(offer);
  if (!structuredPromotion) return null;

  return {
    code: offer.code,
    name: offer.name,
    brand: offer.brand,
    packageText: offer.packageText,
    category: offer.category,
    channel: 'lidl_plus',
    sourceType: 'member_coupon',
    priceType: 'coupon',
    scanRequired: true,
    price: offer.price,
    regularPrice: offer.regularPrice,
    priceText: offer.priceText,
    unitPriceText: offer.unitPriceText,
    promotionText: offer.promotionText,
    regions: offer.regions,
    validFrom: offer.validFrom,
    validTo: offer.validTo,
    productUrl: offer.productUrl,
    imageUrl: offer.imageUrl,
    sourceUrl: offer.sourceUrl,
    couponCatalogUrl: LIDL_PLUS_COUPONS_URL,
    retrievedAt: offer.retrievedAt,
    structuredPromotion
  };
}

export function promotionRouter(offer: LidlOffer): LidlPlusStructuredPromotion | null {
  const sourceText = offer.promotionText || offer.priceText;
  const multiBuy = sourceText.toLowerCase().match(/(\d+)\s*f[öo]r:?\s*([\d,.:]+)/);
  if (multiBuy) {
    return {
      kind: 'coupon_multi_buy',
      quantity: Number(multiBuy[1]),
      totalPrice: parsePrice(multiBuy[2]),
      scanRequired: true,
      sourceText
    };
  }

  if (Number.isFinite(offer.price) && offer.price > 0) {
    return {
      kind: 'coupon_price',
      price: offer.price,
      scanRequired: true,
      sourceText
    };
  }

  return null;
}

function parsePrice(value: string | undefined): number {
  const normalized = (value ?? '').replace(':', '.').replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
