import { chainPriceRows, findProduct, formatSek, labelFromSlug, productUniverse } from '@/lib/verified-data';

export const seoLandingProducts = productUniverse.slice(0, 24).map((product) => {
  const isChainProduct = 'lowestPrice' in product;
  const prices = isChainProduct ? chainPriceRows(product) : [];
  const lowest = isChainProduct ? product.lowestPrice : product.priceMedian;
  const highest = isChainProduct ? product.highestPrice : product.priceMax;
  const sourceLabel = isChainProduct
    ? `${prices.length} verified chain quotes`
    : `${product.observationCount} OpenPrices observations`;

  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    categoryLabel: labelFromSlug(product.category),
    brand: isChainProduct ? product.brand : product.brands || 'Brand not reported',
    packageLabel: isChainProduct ? product.subline : product.quantity || 'Package not reported',
    lowestPriceLabel: formatSek(lowest),
    highestPriceLabel: formatSek(highest),
    sourceLabel,
    chainCount: isChainProduct ? product.inChains.length : 0,
    priceDriver: isChainProduct ? 'chain catalogue rows' : 'OpenPrices observations'
  };
});

export const seoLandingCities = [
  { slug: 'stockholm', name: 'Stockholm', evidence: 'city context is public copy only; prices remain national or chain-level verified rows' },
  { slug: 'goteborg', name: 'Göteborg', evidence: 'city context is public copy only; no branch-specific city price is inferred' },
  { slug: 'malmo', name: 'Malmö', evidence: 'city context is public copy only; store availability needs branch evidence' }
];

export function seoLandingProductFor(slug: string) {
  return seoLandingProducts.find((product) => product.slug === slug) ?? null;
}

export function landingFactsFor(product: (typeof seoLandingProducts)[number]) {
  return {
    categoryLabel: product.categoryLabel,
    primaryPriceLabel: product.lowestPriceLabel,
    evidenceLabel: product.sourceLabel
  };
}

export function seoLandingCityFor(slug: string) {
  return seoLandingCities.find((city) => city.slug === slug) ?? null;
}

export function verifiedProductForSeo(slug: string) {
  return findProduct(slug);
}
