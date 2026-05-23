import { compareBasketStrategies, summarizeStoreBasketCoverage } from '@groceryview/core';
import { weeklyBasketOptimizerInput } from '@/lib/demo-data';
import { storeUniverse } from '@/lib/verified-data';

type BasketCostHeatTone = 'cool' | 'warm' | 'hot';

type BasketStoreAreaFallback = {
  area: string;
  city: string;
  district: string;
  evidence: string;
};

export type BasketCostHeatmapRow = {
  area: string;
  city: string;
  district: string;
  storeId: string;
  storeName: string;
  knownBasketTotal: number;
  relativeBasketIndex: number;
  coveragePercent: number;
  pricedProductCount: number;
  missingProductCount: number;
  missingProductIds: string[];
  heatTone: BasketCostHeatTone;
  matchedOsmSlug: string | null;
  areaEvidence: string;
};

const basketStoreAreaFallbacks: Record<string, BasketStoreAreaFallback> = {
  'willys-odenplan': {
    area: 'Odenplan, Stockholm',
    city: 'Stockholm',
    district: 'Odenplan',
    evidence: 'area fallback from the visible weeklyBasketOptimizerInput store label'
  },
  'coop-medborgarplatsen': {
    area: 'Medborgarplatsen, Stockholm',
    city: 'Stockholm',
    district: 'Medborgarplatsen',
    evidence: 'area fallback from the visible weeklyBasketOptimizerInput store label'
  },
  'hemkop-hornstull': {
    area: 'Hornstull, Stockholm',
    city: 'Stockholm',
    district: 'Hornstull',
    evidence: 'area fallback from the visible weeklyBasketOptimizerInput store label'
  }
};

function normaliseStoreText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function significantStoreTokens(value: string) {
  return normaliseStoreText(value)
    .split(' ')
    .filter((token) => token.length > 3 && !['coop', 'willys', 'hemkop'].includes(token));
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function findBasketStoreInUniverse(storeId: string, storeName: string) {
  const exactSlugMatch = storeUniverse.find((store) => store.slug === storeId || store.slug.startsWith(`${storeId}-`));
  if (exactSlugMatch) return exactSlugMatch;

  const tokens = significantStoreTokens(storeName);
  if (tokens.length === 0) return null;

  return storeUniverse.find((store) => {
    const haystack = normaliseStoreText(`${store.slug} ${store.name} ${store.brand} ${store.address} ${store.city} ${store.district}`);
    return tokens.every((token) => haystack.includes(token));
  }) ?? null;
}

function usableAreaPart(value: string | undefined) {
  if (!value) return null;
  return value === 'Sweden' ? null : value;
}

function areaForStore(storeId: string, storeName: string) {
  const match = findBasketStoreInUniverse(storeId, storeName);
  const fallback = basketStoreAreaFallbacks[storeId];
  const city = usableAreaPart(match?.city) ?? fallback?.city ?? 'Area not reported';
  const district = usableAreaPart(match?.district) ?? fallback?.district ?? city;
  const area = fallback?.area ?? (district === city ? city : `${district}, ${city}`);

  return {
    area,
    city,
    district,
    matchedOsmSlug: match?.slug ?? null,
    evidence: match
      ? `OSM storeUniverse match ${match.slug}${fallback ? ` with ${fallback.evidence}` : ''}`
      : fallback?.evidence ?? 'No OSM area match; basket area is withheld'
  };
}

function toneForRelativeBasketIndex(index: number): BasketCostHeatTone {
  if (index <= 100) return 'cool';
  if (index <= 108) return 'warm';
  return 'hot';
}

function buildBasketCostHeatmapRows(): BasketCostHeatmapRow[] {
  const comparison = compareBasketStrategies(weeklyBasketOptimizerInput);
  const coverage = summarizeStoreBasketCoverage(weeklyBasketOptimizerInput);
  const totalsByStore = new Map(comparison.singleStoreOptions.map((option) => [option.storeId, option]));
  const knownTotals = coverage.stores
    .filter((store) => store.availableProductIds.length > 0)
    .map((store) => totalsByStore.get(store.storeId)?.total ?? store.knownTotal);
  const cheapestKnownTotal = Math.min(...knownTotals);

  return coverage.stores.map((store) => {
    const area = areaForStore(store.storeId, store.storeName);
    const knownBasketTotal = totalsByStore.get(store.storeId)?.total ?? store.knownTotal;
    const relativeBasketIndex = Number.isFinite(cheapestKnownTotal) && cheapestKnownTotal > 0
      ? roundOneDecimal((knownBasketTotal / cheapestKnownTotal) * 100)
      : 100;

    return {
      area: area.area,
      city: area.city,
      district: area.district,
      storeId: store.storeId,
      storeName: store.storeName,
      knownBasketTotal,
      relativeBasketIndex,
      coveragePercent: store.coveragePercent,
      pricedProductCount: store.availableProductIds.length,
      missingProductCount: store.missingProductIds.length,
      missingProductIds: store.missingProductIds,
      heatTone: toneForRelativeBasketIndex(relativeBasketIndex),
      matchedOsmSlug: area.matchedOsmSlug,
      areaEvidence: area.evidence
    };
  }).sort((a, b) => {
    if (a.relativeBasketIndex !== b.relativeBasketIndex) return a.relativeBasketIndex - b.relativeBasketIndex;
    if (b.coveragePercent !== a.coveragePercent) return b.coveragePercent - a.coveragePercent;
    return a.area.localeCompare(b.area, 'sv');
  });
}

export const basketCostHeatmap = {
  title: 'Basket-cost heatmap by area',
  statusLabel: 'Coverage-gated basket proxy',
  basketLineCount: weeklyBasketOptimizerInput.items.length,
  favoriteStoreCount: weeklyBasketOptimizerInput.favoriteStoreIds.length,
  rows: buildBasketCostHeatmapRows(),
  guardrails: [
    'compareBasketStrategies and summarizeStoreBasketCoverage supply the visible weekly basket totals and missing-price coverage.',
    'No branch-level basket quote is claimed; branch-level basket prices are not invented for areas without priced basket rows.',
    'Rows with missing basket products stay visible as coverage gaps instead of being estimated.'
  ]
};
