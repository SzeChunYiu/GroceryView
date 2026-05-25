import { formatSek } from '@/lib/verified-data';
import {
  geoPriceBranchObservations,
  geoPriceBranchObservationSourceLabels,
  type IngestedBranchPriceObservation
} from './ingested/branch-observations';

export type GeoPriceStatisticsScope = 'city' | 'district' | 'kommun';

export type GeoProductStatisticsRow = {
  productSlug?: string;
  productName: string;
  observationCount: number;
  medianPrice: number;
  lowPrice: number;
  highPrice: number;
  retailerCount?: number;
  storeCount?: number;
  sourceLabels?: string[];
};

export type GeoAreaSummary = {
  scope: GeoPriceStatisticsScope;
  slug: string;
  name: string;
  productRows: GeoProductStatisticsRow[];
};

const MIN_PRODUCT_COVERAGE = 3;

const staticGeoAreaSummaries: GeoAreaSummary[] = [
  {
    scope: 'city',
    slug: 'stockholm',
    name: 'Stockholm',
    productRows: [
      { productSlug: 'makaroner-pasta-101302991-st', productName: 'Makaroner Pasta', observationCount: 8, medianPrice: 18.9, lowPrice: 14.9, highPrice: 22.9 },
      { productSlug: 'havregryn-extra-fylliga-101758934-st', productName: 'Havregryn Extra Fylliga', observationCount: 6, medianPrice: 23.5, lowPrice: 19.9, highPrice: 27.9 },
      { productName: 'Svensk Honung', observationCount: 2, medianPrice: 54.9, lowPrice: 49.9, highPrice: 59.9 }
    ]
  },
  {
    scope: 'district',
    slug: 'sodermalm',
    name: 'Södermalm',
    productRows: [
      { productSlug: 'makaroner-pasta-101302991-st', productName: 'Makaroner Pasta', observationCount: 4, medianPrice: 19.9, lowPrice: 16.9, highPrice: 22.9 },
      { productSlug: 'svensk-honung-101550069-st', productName: 'Svensk Honung', observationCount: 1, medianPrice: 57.9, lowPrice: 57.9, highPrice: 57.9 }
    ]
  },
  {
    scope: 'kommun',
    slug: 'stockholm-kommun',
    name: 'Stockholm kommun',
    productRows: [
      { productSlug: 'makaroner-pasta-101302991-st', productName: 'Makaroner Pasta', observationCount: 12, medianPrice: 18.4, lowPrice: 13.9, highPrice: 23.9 },
      { productSlug: 'havregryn-100132394-st', productName: 'Havregryn', observationCount: 7, medianPrice: 21.9, lowPrice: 18.9, highPrice: 25.9 }
    ]
  }
];

function normalizeProductKey(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugifyArea(value: string) {
  return normalizeProductKey(value).replace(/\s+/g, '-');
}

function normalizeBranchIdentifier(sourceKey: string, storeId: string, storeName: string) {
  const explicitStoreId = storeId.trim();
  if (explicitStoreId.length > 0) return `${sourceKey}:${explicitStoreId.toLowerCase()}`;
  return `${sourceKey}:store-name:${slugifyArea(storeName)}`;
}

function normalizeObservationProductKey(code: string, name: string) {
  const explicitCode = code.trim();
  if (explicitCode.length > 0) return explicitCode.toLowerCase();
  return `name:${normalizeProductKey(name)}`;
}

function isVisiblePrice(value: number) {
  return Number.isFinite(value) && value > 0;
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function roundSek(value: number) {
  return Math.round(value * 100) / 100;
}

function dedupeBranchProductObservations(observations: IngestedBranchPriceObservation[]) {
  return [...observations.reduce((ledger, observation) => {
    const branchId = normalizeBranchIdentifier(observation.sourceKey, observation.storeId, observation.storeName);
    const productKey = normalizeObservationProductKey(observation.productKey, observation.productName);
    const dedupeKey = `${observation.sourceKey}:${branchId}:${productKey}`;
    if (!ledger.has(dedupeKey)) ledger.set(dedupeKey, { ...observation, storeId: branchId, productKey });
    return ledger;
  }, new Map<string, IngestedBranchPriceObservation>()).values()];
}

function buildBranchPriceObservations(): IngestedBranchPriceObservation[] {
  return dedupeBranchProductObservations(
    geoPriceBranchObservations.filter((observation) => isVisiblePrice(observation.price) && observation.city.trim().length > 0)
  );
}

function generatedGeoAreaSummaries(): GeoAreaSummary[] {
  const grouped = new Map<string, IngestedBranchPriceObservation[]>();

  for (const observation of buildBranchPriceObservations()) {
    const citySlug = slugifyArea(observation.city);
    const productKey = normalizeObservationProductKey(observation.productKey, observation.productName);
    const groupKey = `city:${citySlug}:${productKey}`;
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), observation]);
  }

  const areaRows = new Map<string, GeoProductStatisticsRow[]>();
  for (const rows of grouped.values()) {
    const first = rows[0]!;
    const prices = rows.map((row) => row.price);
    const citySlug = slugifyArea(first.city);
    const sourceLabels = [...new Set(rows.map((row) => row.sourceLabel))].sort((left, right) => left.localeCompare(right, 'sv'));
    const retailerCount = new Set(rows.map((row) => row.retailer)).size;
    const storeCount = new Set(rows.map((row) => row.storeId)).size;
    const productRow = {
      productName: first.productName,
      observationCount: rows.length,
      medianPrice: roundSek(median(prices)),
      lowPrice: roundSek(Math.min(...prices)),
      highPrice: roundSek(Math.max(...prices)),
      retailerCount,
      storeCount,
      sourceLabels
    };

    areaRows.set(citySlug, [...(areaRows.get(citySlug) ?? []), productRow]);
  }

  return [...areaRows.entries()]
    .map(([slug, productRows]) => ({
      scope: 'city' as const,
      slug,
      name: slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      productRows: productRows
        .filter((row) => row.observationCount >= MIN_PRODUCT_COVERAGE)
        .sort((left, right) => right.observationCount - left.observationCount || left.productName.localeCompare(right.productName, 'sv'))
        .slice(0, 60)
    }))
    .filter((area) => area.productRows.length > 0)
    .sort((left, right) => left.name.localeCompare(right.name, 'sv'));
}

export const geoPriceStatisticsSourceLabels = [
  ...geoPriceBranchObservationSourceLabels
];

export const geoAreaSummaries: GeoAreaSummary[] = [
  ...staticGeoAreaSummaries,
  ...generatedGeoAreaSummaries()
];

export function localPriceStatisticsForProduct(product: { slug: string; name: string }) {
  const productNameKey = normalizeProductKey(product.name);
  const rows = geoAreaSummaries.flatMap((area) =>
    area.productRows
      .filter((row) => row.productSlug === product.slug || normalizeProductKey(row.productName) === productNameKey)
      .map((row) => {
        const isWithheld = row.observationCount < MIN_PRODUCT_COVERAGE;
        return {
          scope: area.scope,
          areaSlug: area.slug,
          areaName: area.name,
          href: `/price-statistics/${area.scope}/${area.slug}`,
          observationCount: row.observationCount,
          isWithheld,
          sourceLabel: row.sourceLabels?.join(' · ') ?? 'Curated local statistics snapshot',
          storeCoverageLabel: row.storeCount && row.retailerCount
            ? `${row.storeCount} normalized branch identifiers across ${row.retailerCount} retailer${row.retailerCount === 1 ? '' : 's'}`
            : 'Curated area row',
          coverageLabel: isWithheld
            ? `Withheld: ${row.observationCount}/${MIN_PRODUCT_COVERAGE} local observations`
            : `${row.observationCount} local observations`,
          medianPriceLabel: isWithheld ? 'Withheld' : formatSek(row.medianPrice),
          rangeLabel: isWithheld ? 'Withheld until coverage threshold is met' : `${formatSek(row.lowPrice)}–${formatSek(row.highPrice)}`
        };
      })
  );

  return {
    rows,
    available: rows.length > 0,
    minimumCoverage: MIN_PRODUCT_COVERAGE,
    summary: rows.length > 0
      ? `Matched ${rows.length} local statistics area${rows.length === 1 ? '' : 's'} for this product; prices stay withheld below ${MIN_PRODUCT_COVERAGE} observations.`
      : `No local statistics rows match this product slug or name yet; product-level local stats require at least ${MIN_PRODUCT_COVERAGE} observations per area.`
  };
}
