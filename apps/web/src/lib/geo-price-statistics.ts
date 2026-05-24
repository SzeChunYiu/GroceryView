import { dbSiteLidlSource, dbSiteLidlStoreOffers } from './generated/db-site-ingested-overrides';
import { lidlSource as staticLidlSource, lidlStoreOffers as staticLidlStoreOffers, type LidlIngestedStoreOffer } from './ingested/lidl';
import { categoryLabels } from './openprices-products';
import { osmStores } from './osm-stores';
import { storePricePercentileRanks } from './verified-data';

export type GeoPriceScope = 'region' | 'city' | 'district';

type ProductObservation = {
  categoryLabel: string | null;
  categorySlug: string | null;
  city: string;
  confidence: 'high' | 'medium';
  district: string;
  price: number;
  productName: string;
  productSlug: string;
  region: string;
  source: string;
  storeName: string;
  storeSlug: string;
};

type AreaAccumulator = {
  key: string;
  label: string;
  observations: ProductObservation[];
  scope: GeoPriceScope;
  storeSlugs: Set<string>;
};

export type GeoAreaSummary = {
  basket: {
    confidenceLabel: string;
    coverageLabel: string;
    observedCategoryCount: number;
    observedProductCount: number;
    status: 'published' | 'withheld';
    totalPrice: number | null;
  };
  categoryRows: {
    categoryLabel: string;
    categorySlug: string;
    confidenceLabel: string;
    coverageLabel: string;
    medianPrice: number | null;
    observationCount: number;
    status: 'published' | 'withheld';
  }[];
  confidenceLabel: string;
  coverageLabel: string;
  href: string;
  key: string;
  label: string;
  product: {
    medianObservedPrice: number | null;
    observationCount: number;
    status: 'published' | 'withheld';
  };
  productRows: {
    confidenceLabel: string;
    coverageLabel: string;
    medianPrice: number | null;
    observationCount: number;
    productName: string;
    productSlug: string;
    status: 'published' | 'withheld';
    storeCount: number;
  }[];
  scope: GeoPriceScope;
  sourceLabel: string;
  storeCount: number;
};

const areaScopeLabels: Record<GeoPriceScope, string> = {
  region: 'Regional',
  city: 'City',
  district: 'District'
};

const minimums = {
  areaProductObservationCount: 20,
  basketCategoryCount: 4,
  basketProductCount: 20,
  categoryObservationCount: 6,
  productObservationCount: 3
};

export const geoPriceStatisticsThresholds = minimums;

const lidlStoreOffers = dbSiteLidlStoreOffers.length > 0 ? dbSiteLidlStoreOffers : staticLidlStoreOffers;
const lidlSource = dbSiteLidlStoreOffers.length > 0 ? dbSiteLidlSource : staticLidlSource;
const osmStoreBySlug = new Map(osmStores.map((store) => [store.slug, store]));
const areaByLidlStoreId = new Map(
  storePricePercentileRanks.map((rank) => {
    const store = osmStoreBySlug.get(rank.osmSlug);
    const city = store?.city || rank.kommun || 'City not reported';
    const district = store?.district || city;
    return [rank.externalStoreId, {
      city,
      district,
      region: 'Sweden',
      storeSlug: rank.osmSlug
    }];
  })
);

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function confidenceScore(confidence: ProductObservation['confidence']) {
  if (confidence === 'high') return 1;
  return 0.7;
}

function confidenceLabelFor(observations: readonly ProductObservation[]) {
  if (observations.length === 0) return 'no observed branch rows';
  const average = observations.reduce((sum, observation) => sum + confidenceScore(observation.confidence), 0) / observations.length;
  if (observations.length >= 8 && average >= 0.85) return 'high confidence';
  if (observations.length >= 4 && average >= 0.7) return 'medium confidence';
  return 'limited confidence';
}

function areaKey(scope: GeoPriceScope, observation: ProductObservation) {
  if (scope === 'region') return observation.region;
  if (scope === 'city') return observation.city;
  return observation.district;
}

function areaHref(scope: GeoPriceScope, key: string) {
  return `/price-statistics/${scope}/${slugify(key)}`;
}

function categoryLabelFor(slug: string) {
  return categoryLabels[slug] ?? slug.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function observationForOffer(offer: LidlIngestedStoreOffer): ProductObservation | null {
  const area = areaByLidlStoreId.get(offer.storeId);
  if (!area || !Number.isFinite(offer.price) || offer.price <= 0 || !offer.name) return null;
  return {
    categoryLabel: categoryLabelFor(offer.category),
    categorySlug: offer.category,
    city: area.city,
    confidence: offer.regularPrice && offer.regularPrice > 0 ? 'high' : 'medium',
    district: area.district || area.city,
    price: offer.price,
    productName: offer.name,
    productSlug: slugify(`${offer.name}-${offer.code}`),
    region: area.region,
    source: offer.sourceUrl || lidlSource.source,
    storeName: offer.storeName,
    storeSlug: area.storeSlug
  };
}

export function formatPriceStat(value: number | null) {
  return value === null
    ? 'Withheld'
    : new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 2, style: 'currency', currency: 'SEK' }).format(value);
}

export function scopeLabel(scope: GeoPriceScope) {
  return areaScopeLabels[scope];
}

export const branchPriceObservations: ProductObservation[] = lidlStoreOffers
  .map(observationForOffer)
  .filter((observation): observation is ProductObservation => observation !== null);

function buildSummary(scope: GeoPriceScope, key: string, observations: ProductObservation[], storeSlugs: Set<string>): GeoAreaSummary {
  const productStatus = observations.length >= minimums.areaProductObservationCount ? 'published' : 'withheld';
  const categorized = observations.filter((observation) => observation.categorySlug && observation.categoryLabel);
  const categoriesInArea = new Set(categorized.map((observation) => observation.categorySlug));
  const productRows = [...new Map(observations.map((observation) => [observation.productSlug, observation.productName])).entries()]
    .map(([productSlug, productName]) => {
      const productObservations = observations.filter((observation) => observation.productSlug === productSlug);
      const productStoreCount = new Set(productObservations.map((observation) => observation.storeSlug)).size;
      const status: 'published' | 'withheld' = productStoreCount >= minimums.productObservationCount ? 'published' : 'withheld';
      return {
        confidenceLabel: confidenceLabelFor(productObservations),
        coverageLabel: `${productObservations.length} observed branch rows from ${productStoreCount} branches`,
        medianPrice: status === 'published' ? median(productObservations.map((observation) => observation.price)) : null,
        observationCount: productObservations.length,
        productName,
        productSlug,
        status,
        storeCount: productStoreCount
      };
    })
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'published' ? -1 : 1;
      return right.storeCount - left.storeCount || right.observationCount - left.observationCount || left.productName.localeCompare(right.productName, 'sv');
    });
  const publishedCategoryPrices = [...categoriesInArea].flatMap((categorySlug) => {
    const categoryObservations = categorized.filter((observation) => observation.categorySlug === categorySlug);
    return categoryObservations.length >= minimums.categoryObservationCount
      ? [median(categoryObservations.map((observation) => observation.price))]
      : [];
  });
  const basketStatus = observations.length >= minimums.basketProductCount && publishedCategoryPrices.length >= minimums.basketCategoryCount ? 'published' : 'withheld';
  const confidenceLabel = confidenceLabelFor(observations);

  const categoryRows = [...new Map(categorized.map((observation) => [observation.categorySlug, observation.categoryLabel])).entries()]
    .map(([categorySlug, categoryLabel]) => {
      const categoryObservations = categorized.filter((observation) => observation.categorySlug === categorySlug);
      const status: 'published' | 'withheld' = categoryObservations.length >= minimums.categoryObservationCount ? 'published' : 'withheld';
      return {
        categoryLabel: categoryLabel ?? 'Category not reported',
        categorySlug: categorySlug ?? 'category-not-reported',
        confidenceLabel: confidenceLabelFor(categoryObservations),
        coverageLabel: `${categoryObservations.length} observed branch rows`,
        medianPrice: status === 'published' ? median(categoryObservations.map((observation) => observation.price)) : null,
        observationCount: categoryObservations.length,
        status
      };
    })
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'published' ? -1 : 1;
      return right.observationCount - left.observationCount || left.categoryLabel.localeCompare(right.categoryLabel, 'sv');
    });

  return {
    basket: {
      confidenceLabel,
      coverageLabel: `${observations.length} products across ${categoriesInArea.size} top-deal categories`,
      observedCategoryCount: categoriesInArea.size,
      observedProductCount: observations.length,
      status: basketStatus,
      totalPrice: basketStatus === 'published' ? publishedCategoryPrices.reduce((sum, price) => sum + price, 0) : null
    },
    categoryRows,
    confidenceLabel,
    coverageLabel: `${observations.length} observed product rows from ${storeSlugs.size} branches`,
    href: areaHref(scope, key),
    key: slugify(key),
    label: key,
    product: {
      medianObservedPrice: productStatus === 'published' ? median(observations.map((observation) => observation.price)) : null,
      observationCount: observations.length,
      status: productStatus
    },
    productRows,
    scope,
    sourceLabel: `${lidlSource.source}; ${lidlSource.rowCount} fetched branch-offer rows retrieved ${lidlSource.retrievedAt}`,
    storeCount: storeSlugs.size
  };
}

export function buildGeoPriceStatistics() {
  const accumulators = new Map<string, AreaAccumulator>();
  for (const observation of branchPriceObservations) {
    for (const scope of ['region', 'city', 'district'] as const) {
      const key = areaKey(scope, observation);
      const accumulatorKey = `${scope}:${key}`;
      const accumulator = accumulators.get(accumulatorKey) ?? {
        key,
        label: key,
        observations: [],
        scope,
        storeSlugs: new Set<string>()
      };
      accumulator.observations.push(observation);
      accumulator.storeSlugs.add(observation.storeSlug);
      accumulators.set(accumulatorKey, accumulator);
    }
  }

  return [...accumulators.values()]
    .map((area) => buildSummary(area.scope, area.key, area.observations, area.storeSlugs))
    .sort((left, right) => {
      const scopeOrder = ['region', 'city', 'district'].indexOf(left.scope) - ['region', 'city', 'district'].indexOf(right.scope);
      return scopeOrder || right.product.observationCount - left.product.observationCount || left.label.localeCompare(right.label, 'sv');
    });
}

export const geoPriceStatistics = buildGeoPriceStatistics();

export function geoPriceStatisticsByScope(scope: GeoPriceScope) {
  return geoPriceStatistics.filter((area) => area.scope === scope);
}

export function findGeoPriceStatistic(scope: string, slug: string) {
  if (!['region', 'city', 'district'].includes(scope)) return null;
  return geoPriceStatistics.find((area) => area.scope === scope && area.key === slug) ?? null;
}

export function geoPriceStaticParams() {
  return geoPriceStatistics.map((area) => ({ scope: area.scope, slug: area.key }));
}
