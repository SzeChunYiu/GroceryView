import type { Metadata } from 'next';
import { routeMetadata } from '@/lib/seo';
import { chainPriceRows, formatPct, formatSek, labelFromSlug, topChainSpreads } from '@/lib/verified-data';

export const seoLandingCities = [
  {
    slug: 'stockholm',
    label: 'Stockholm',
    hasCitySpecificAvailability: false,
    evidence: 'Stockholm landing pages use verified chain catalogue prices plus the public Stockholm grocery context; no branch availability is inferred.'
  }
] as const;

export const programmaticSeoIndexingGuard = {
  minimumVerifiedChainRows: 2,
  minimumCityVerifiedChainRows: 3,
  duplicateCityCanonicalReason: 'City/product pages stay noindex and canonicalize to the root product landing until city-specific store availability clears coverage.'
} as const;

function displayChain(chain: string) {
  return chain.charAt(0).toUpperCase() + chain.slice(1).replace(/-/g, ' ');
}

export const seoLandingProducts = topChainSpreads.slice(0, 18).map((product) => {
  const chainRows = chainPriceRows(product)
    .filter((row) => typeof row.price === 'number')
    .sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY))
    .map((row) => ({
      chain: row.chain,
      chainLabel: displayChain(row.chain),
      price: row.price ?? null,
      priceLabel: formatSek(row.price),
      unitLabel: row.priceUnit,
      sourceUrl: row.url || `/products/${product.slug}`
    }));
  const cheapest = chainRows[0];
  const priciest = chainRows[chainRows.length - 1];
  const cheapestPrice = cheapest?.price ?? product.lowestPrice;
  const priciestPrice = priciest?.price ?? product.highestPrice;

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categorySlug: product.category,
    categoryLabel: labelFromSlug(product.category),
    packageLabel: product.subline,
    image: product.image,
    cheapestChain: cheapest?.chain ?? product.lowestChain,
    cheapestChainLabel: cheapest?.chainLabel ?? displayChain(product.lowestChain),
    cheapestPrice,
    cheapestPriceLabel: formatSek(cheapestPrice),
    priciestChainLabel: priciest?.chainLabel ?? 'Highest observed chain',
    priciestPrice,
    priciestPriceLabel: formatSek(priciestPrice),
    priceGap: Math.max(0, priciestPrice - cheapestPrice),
    priceGapLabel: formatSek(Math.max(0, priciestPrice - cheapestPrice)),
    spreadPct: product.spreadPct,
    spreadPctLabel: formatPct(product.spreadPct),
    chainRows,
    evidenceLabel: `${chainRows.length} verified Willys/Hemkop chain prices`,
    confidenceLabel: 'Verified price spread from matched chain catalogue rows; branch stock and local member pricing are not inferred.'
  };
});

export type SeoLandingProduct = (typeof seoLandingProducts)[number];
export type SeoLandingCity = (typeof seoLandingCities)[number];

export function findSeoLandingProduct(slug: string) {
  return seoLandingProducts.find((product) => product.slug === slug);
}

export function findSeoLandingCity(slug: string) {
  return seoLandingCities.find((city) => city.slug === slug);
}

function verifiedChainRowCount(product: SeoLandingProduct) {
  return product.chainRows.filter((row) => typeof row.price === 'number').length;
}

function hasIndexableProductCoverage(product: SeoLandingProduct) {
  return verifiedChainRowCount(product) >= programmaticSeoIndexingGuard.minimumVerifiedChainRows;
}

export function cityCheapestLandingSeoDecision(product: SeoLandingProduct, city: SeoLandingCity) {
  const cityPath = `/${city.slug}/billigaste/${product.slug}`;
  const fallbackCanonicalPath = `/billigaste/${product.slug}`;
  const hasEnoughCityCoverage = verifiedChainRowCount(product) >= programmaticSeoIndexingGuard.minimumCityVerifiedChainRows;
  const indexable = hasEnoughCityCoverage && city.hasCitySpecificAvailability;

  return {
    path: cityPath,
    canonicalPath: indexable ? cityPath : fallbackCanonicalPath,
    noIndex: !indexable,
    noIndexFollow: true,
    guardrail: indexable ? city.evidence : programmaticSeoIndexingGuard.duplicateCityCanonicalReason
  };
}

export function metadataForCheapestLanding(product: SeoLandingProduct): Metadata {
  const noIndex = !hasIndexableProductCoverage(product);
  return routeMetadata({
    path: `/billigaste/${product.slug}`,
    noIndex,
    noIndexFollow: noIndex,
    title: `Billigaste ${product.name} | GroceryView`,
    description: `Billigaste ${product.name}: ${product.cheapestChainLabel} is lowest at ${product.cheapestPriceLabel} from ${product.evidenceLabel}. Compare verified chain prices with no synthetic prices.`
  });
}

export function metadataForPriceComparisonLanding(product: SeoLandingProduct): Metadata {
  const noIndex = !hasIndexableProductCoverage(product);
  return routeMetadata({
    path: `/prisjamforelse/${product.slug}`,
    noIndex,
    noIndexFollow: noIndex,
    title: `${product.name} prisjämförelse | GroceryView`,
    description: `${product.name} prisjämförelse across verified Swedish grocery chain rows: cheapest ${product.cheapestPriceLabel}, spread ${product.spreadPctLabel}, confidence labelled.`
  });
}

export function metadataForCityCheapestLanding(product: SeoLandingProduct, city: SeoLandingCity): Metadata {
  const seoDecision = cityCheapestLandingSeoDecision(product, city);
  return routeMetadata({
    path: seoDecision.path,
    canonicalPath: seoDecision.canonicalPath,
    noIndex: seoDecision.noIndex,
    noIndexFollow: seoDecision.noIndexFollow,
    title: `Billigaste ${product.name} i ${city.label} | GroceryView`,
    description: `Find the cheapest verified chain price for ${product.name} in the ${city.label} GroceryView landing page. Uses chain catalogue evidence and clear local-availability caveats. ${seoDecision.guardrail}`
  });
}
