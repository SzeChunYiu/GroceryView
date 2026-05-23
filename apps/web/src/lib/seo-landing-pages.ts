import type { Metadata } from 'next';
import { routeMetadata } from '@/lib/seo';
import { chainPriceRows, formatPct, formatSek, labelFromSlug, topChainSpreads } from '@/lib/verified-data';

export const seoLandingCities = [
  {
    slug: 'stockholm',
    label: 'Stockholm',
    evidence: 'Stockholm landing pages use verified chain catalogue prices plus the public Stockholm grocery context; no branch availability is inferred.'
  }
] as const;

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

export function metadataForCheapestLanding(product: SeoLandingProduct): Metadata {
  return routeMetadata({
    path: `/billigaste/${product.slug}`,
    title: `Billigaste ${product.name} | GroceryView`,
    description: `Billigaste ${product.name}: ${product.cheapestChainLabel} is lowest at ${product.cheapestPriceLabel} from ${product.evidenceLabel}. Compare verified chain prices with no synthetic prices.`
  });
}

export function metadataForPriceComparisonLanding(product: SeoLandingProduct): Metadata {
  return routeMetadata({
    path: `/prisjamforelse/${product.slug}`,
    title: `${product.name} prisjämförelse | GroceryView`,
    description: `${product.name} prisjämförelse across verified Swedish grocery chain rows: cheapest ${product.cheapestPriceLabel}, spread ${product.spreadPctLabel}, confidence labelled.`
  });
}

export function metadataForCityCheapestLanding(product: SeoLandingProduct, city: SeoLandingCity): Metadata {
  return routeMetadata({
    path: `/${city.slug}/billigaste/${product.slug}`,
    title: `Billigaste ${product.name} i ${city.label} | GroceryView`,
    description: `Find the cheapest verified chain price for ${product.name} in the ${city.label} GroceryView landing page. Uses chain catalogue evidence and clear local-availability caveats.`
  });
}
