import {
  fetchCityGrossProductsForAllStores,
  type CityGrossProduct,
  type FetchCityGrossProductsForAllStoresOptions
} from './citygross.js';

export const CITY_GROSS_KLUBBEN_OFFERS_URL = 'https://www.citygross.se/klubben';

export type CityGrossKlubbenStructuredPromotion =
  | {
      kind: 'member_price';
      price: number;
      memberProgram: 'city_gross_klubben';
      sourceText: string;
    }
  | {
      kind: 'member_multi_buy';
      quantity: number;
      totalPrice: number;
      memberProgram: 'city_gross_klubben';
      sourceText: string;
    };

export type CityGrossKlubbenOffer = {
  code: string;
  gtin: string;
  name: string;
  brand: string;
  superCategory: string;
  category: string;
  packageText: string;
  storeId: string;
  channel: 'citygross_klubben';
  sourceType: 'member_offer';
  priceType: 'member';
  scanRequired: true;
  price: number;
  regularPrice: number | null;
  unitPrice: number | null;
  unitPriceUnit: string;
  promotionFrom: string;
  promotionTo: string;
  promotionMinQuantity: number | null;
  promotionPrice: number | null;
  promotionUnitPrice: number | null;
  promotionUnitPriceUnit: string;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  memberOfferUrl: string;
  retrievedAt: string;
  structuredPromotion: CityGrossKlubbenStructuredPromotion;
};

export type FetchCityGrossKlubbenOffersOptions = FetchCityGrossProductsForAllStoresOptions;

export async function fetchCityGrossKlubbenOffers(
  options: FetchCityGrossKlubbenOffersOptions = {}
): Promise<CityGrossKlubbenOffer[]> {
  const products = await fetchCityGrossProductsForAllStores(options);
  return products
    .filter((product) => product.isMembersOnlyPrice)
    .map(cityGrossKlubbenOfferFromProduct)
    .filter((offer): offer is CityGrossKlubbenOffer => offer !== null);
}

export function cityGrossKlubbenOfferFromProduct(product: CityGrossProduct): CityGrossKlubbenOffer | null {
  const structuredPromotion = promotionRouter(product);
  if (!structuredPromotion) return null;

  return {
    code: product.code,
    gtin: product.gtin,
    name: product.name,
    brand: product.brand,
    superCategory: product.superCategory,
    category: product.category,
    packageText: product.packageText,
    storeId: product.storeId,
    channel: 'citygross_klubben',
    sourceType: 'member_offer',
    priceType: 'member',
    scanRequired: true,
    price: product.price,
    regularPrice: product.regularPrice,
    unitPrice: product.unitPrice,
    unitPriceUnit: product.unitPriceUnit,
    promotionFrom: product.promotionFrom,
    promotionTo: product.promotionTo,
    promotionMinQuantity: product.promotionMinQuantity,
    promotionPrice: product.promotionPrice,
    promotionUnitPrice: product.promotionUnitPrice,
    promotionUnitPriceUnit: product.promotionUnitPriceUnit,
    priceText: product.priceText,
    productUrl: product.productUrl,
    imageUrl: product.imageUrl,
    sourceUrl: product.sourceUrl,
    memberOfferUrl: CITY_GROSS_KLUBBEN_OFFERS_URL,
    retrievedAt: product.retrievedAt,
    structuredPromotion
  };
}

export function promotionRouter(product: CityGrossProduct): CityGrossKlubbenStructuredPromotion | null {
  const price = product.promotionPrice ?? product.price;
  const sourceText = [
    product.promotionMinQuantity ? `${product.promotionMinQuantity} for ${formatPrice(price)}` : '',
    product.promotionFrom && product.promotionTo ? `${product.promotionFrom}-${product.promotionTo}` : '',
    product.regularPrice !== null ? `regular ${formatPrice(product.regularPrice)}` : ''
  ].filter(Boolean).join(' · ') || product.priceText;

  if (product.promotionMinQuantity && product.promotionMinQuantity > 1) {
    return {
      kind: 'member_multi_buy',
      quantity: product.promotionMinQuantity,
      totalPrice: price,
      memberProgram: 'city_gross_klubben',
      sourceText
    };
  }

  if (Number.isFinite(price) && price > 0) {
    return {
      kind: 'member_price',
      price,
      memberProgram: 'city_gross_klubben',
      sourceText
    };
  }

  return null;
}

function formatPrice(value: number): string {
  return `${value.toFixed(2)} SEK`;
}
