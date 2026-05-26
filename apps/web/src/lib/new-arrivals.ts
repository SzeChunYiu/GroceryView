import { facetedSearchRows, freshestOpenPrices, labelFromSlug } from './verified-data';

export type NewProductArrival = {
  slug: string;
  name: string;
  brand: string;
  categoryLabel: string;
  sourceLabel: string;
  chainLabel: string;
  freshnessLabel: string;
  observedAt: string;
  badges: string[];
};

const ARRIVAL_AS_OF = '2026-05-25';

function freshnessLabel(observedAt: string) {
  const observedTime = Date.parse(observedAt.includes('T') ? observedAt : `${observedAt}T00:00:00.000Z`);
  const asOfTime = Date.parse(`${ARRIVAL_AS_OF}T00:00:00.000Z`);
  if (!Number.isFinite(observedTime) || !Number.isFinite(asOfTime)) return 'Freshness unknown';
  const ageDays = Math.max(0, Math.round((asOfTime - observedTime) / (24 * 60 * 60 * 1000)));
  if (ageDays === 0) return 'Ingested today';
  if (ageDays === 1) return 'Ingested yesterday';
  return `${ageDays} days fresh`;
}

const latestChainRowsBySlug = new Map<string, NewProductArrival>();

for (const row of facetedSearchRows) {
  const existing = latestChainRowsBySlug.get(row.slug);
  const observedAt = row.observedAt;
  if (!observedAt) continue;
  if (existing && existing.observedAt >= observedAt) continue;
  const chainLabel = row.chainName ?? 'Chain not reported';
  latestChainRowsBySlug.set(row.slug, {
    slug: row.slug,
    name: row.canonicalName,
    brand: row.brand ?? 'Brand not reported',
    categoryLabel: row.categoryPath[0] ?? 'Grocery',
    sourceLabel: `${row.priceType} latest_prices row`,
    chainLabel,
    freshnessLabel: freshnessLabel(observedAt),
    observedAt,
    badges: [chainLabel, row.categoryPath[0] ?? 'Grocery', freshnessLabel(observedAt)]
  });
}

const openPricesArrivals: NewProductArrival[] = freshestOpenPrices.slice(0, 12).map((product) => {
  const observedAt = product.lastObservedAt.includes('T') ? product.lastObservedAt : `${product.lastObservedAt}T00:00:00.000Z`;
  const categoryLabel = labelFromSlug(product.category);
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brands || 'Brand not reported',
    categoryLabel,
    sourceLabel: `OpenPrices · ${product.observationCount.toLocaleString('sv-SE')} observations`,
    chainLabel: 'Community observations',
    freshnessLabel: freshnessLabel(observedAt),
    observedAt,
    badges: ['OpenPrices', categoryLabel, freshnessLabel(observedAt)]
  };
});

export const newProductArrivals: NewProductArrival[] = [
  ...latestChainRowsBySlug.values(),
  ...openPricesArrivals
]
  .sort((left, right) => right.observedAt.localeCompare(left.observedAt) || left.name.localeCompare(right.name, 'sv'))
  .slice(0, 12);
