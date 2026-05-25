import { formatSek } from '@/lib/verified-data';

export type GeoPriceStatisticsScope = 'city' | 'district' | 'kommun';

export type GeoProductStatisticsRow = {
  productSlug?: string;
  productName: string;
  observationCount: number;
  medianPrice: number;
  lowPrice: number;
  highPrice: number;
};

export type GeoAreaSummary = {
  scope: GeoPriceStatisticsScope;
  slug: string;
  name: string;
  productRows: GeoProductStatisticsRow[];
};

const MIN_PRODUCT_COVERAGE = 3;

export const geoAreaSummaries: GeoAreaSummary[] = [
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
