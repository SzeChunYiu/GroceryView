import {
  fetchIcaDefaultStoreProducts,
  type FetchIcaDefaultStoreProductsOptions,
  type IcaProduct
} from './ica.js';

export const ICA_STAMMIS_OFFERS_URL = 'https://www.ica.se/stammis/';

export type IcaStammisStructuredPromotion = {
  kind: 'member';
  price: number | null;
  memberProgram: 'ica_stammis';
  dayOfWeekRestriction: string[];
  sourceText: string;
};

export type IcaStammisOffer = {
  code: string;
  productId: string;
  retailerProductId: string;
  name: string;
  brand: string;
  categories: string[];
  packageSize: string;
  storeAccountId: string;
  storeName: string;
  regionId: string;
  channel: 'ica_stammis';
  sourceType: 'member_offer';
  priceType: 'member';
  scanRequired: true;
  price: number | null;
  priceCurrency: string;
  promoPrice: number | null;
  promoPriceCurrency: string;
  unitPrice: number | null;
  unitPriceUnit: string;
  promoUnitPrice: number | null;
  promoUnitPriceUnit: string;
  promotionDescription: string;
  imageUrl: string;
  productUrl: string;
  sourceUrl: string;
  memberOfferUrl: string;
  retrievedAt: string;
  structuredPromotion: IcaStammisStructuredPromotion;
};

export type FetchIcaStammisOffersOptions = FetchIcaDefaultStoreProductsOptions;

export async function fetchIcaStammisOffers(
  options: FetchIcaStammisOffersOptions = {}
): Promise<IcaStammisOffer[]> {
  const products = await fetchIcaDefaultStoreProducts(options);
  return products
    .filter((product) => isStammisPromotion(product.promotionDescription))
    .map(icaStammisOfferFromProduct)
    .filter((offer): offer is IcaStammisOffer => offer !== null);
}

export function icaStammisOfferFromProduct(product: IcaProduct): IcaStammisOffer | null {
  const structuredPromotion = promotionRouter(product);
  if (!structuredPromotion) return null;

  return {
    code: product.code,
    productId: product.productId,
    retailerProductId: product.retailerProductId,
    name: product.name,
    brand: product.brand,
    categories: product.categories,
    packageSize: product.packageSize,
    storeAccountId: product.storeAccountId,
    storeName: product.storeName,
    regionId: product.regionId,
    channel: 'ica_stammis',
    sourceType: 'member_offer',
    priceType: 'member',
    scanRequired: true,
    price: product.price,
    priceCurrency: product.priceCurrency,
    promoPrice: product.promoPrice,
    promoPriceCurrency: product.promoPriceCurrency,
    unitPrice: product.unitPrice,
    unitPriceUnit: product.unitPriceUnit,
    promoUnitPrice: product.promoUnitPrice,
    promoUnitPriceUnit: product.promoUnitPriceUnit,
    promotionDescription: product.promotionDescription,
    imageUrl: product.imageUrl,
    productUrl: product.productUrl,
    sourceUrl: product.sourceUrl,
    memberOfferUrl: ICA_STAMMIS_OFFERS_URL,
    retrievedAt: product.retrievedAt,
    structuredPromotion
  };
}

export function promotionRouter(product: IcaProduct): IcaStammisStructuredPromotion | null {
  if (!isStammisPromotion(product.promotionDescription)) return null;
  return {
    kind: 'member',
    price: product.promoPrice ?? product.price,
    memberProgram: 'ica_stammis',
    dayOfWeekRestriction: dayOfWeekRestriction(product.promotionDescription),
    sourceText: product.promotionDescription
  };
}

function isStammisPromotion(value: string): boolean {
  return /\bstammis\b/i.test(value);
}

function dayOfWeekRestriction(value: string): string[] {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const days = [
    ['monday', /\bmandag\b/],
    ['tuesday', /\btisdag\b/],
    ['wednesday', /\bonsdag\b/],
    ['thursday', /\btorsdag\b/],
    ['friday', /\bfredag\b/],
    ['saturday', /\blordag\b/],
    ['sunday', /\bsondag\b/]
  ] as const;

  return days.filter(([, pattern]) => pattern.test(normalized)).map(([day]) => day);
}
