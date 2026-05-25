import { categoryLabels, pricedProducts, type PricedProduct, type PriceObservation } from './openprices-products';

export type TrendConfidenceLabel = 'high' | 'medium' | 'low';

export type CityPriceDropTrend = {
  rank: number;
  city: string;
  productSlug: string;
  productName: string;
  brand: string;
  categoryLabel: string;
  latestPrice: number;
  previousPrice: number;
  deltaAmount: number;
  deltaPercent: number;
  latestObservedAt: string;
  previousObservedAt: string;
  observationCount: number;
  confidenceScore: number;
  confidenceLabel: TrendConfidenceLabel;
  confidenceDetail: string;
  urgencyLabel: string;
  sourceLabel: string;
};

export type CityPriceDropTrendFeed = {
  city: string;
  generatedAt: string;
  source: string;
  cards: CityPriceDropTrend[];
};

export type CitySearchTrend = {
  rank: number;
  city: string;
  query: string;
  category: string;
  categoryLabel: string;
  currentSearches: number;
  previousSearches: number;
  growthPercent: number;
  activeComparisons: number;
  relatedProductSlugs: string[];
  resultHref: string;
  evidenceLabel: string;
};

export type CitySearchTrendFeed = {
  city: string;
  generatedAt: string;
  source: string;
  privacyNote: string;
  cards: CitySearchTrend[];
};

type BuildCityPriceDropTrendsOptions = {
  city?: string | null;
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

type BuildCitySearchTrendsOptions = {
  city?: string | null;
  category?: string | null;
  limit?: number;
  products?: PricedProduct[];
  generatedAt?: string;
};

const cityAliases: Record<string, string> = {
  stockholm: 'Stockholm',
  goteborg: 'Goteborg',
  gothenburg: 'Goteborg',
  malmo: 'Malmo',
  uppsala: 'Uppsala'
};

const citySearchLift: Record<string, number> = {
  Stockholm: 1.18,
  Goteborg: 1.08,
  Malmo: 1.12,
  Uppsala: 1.04
};

const stopWords = new Set(['och', 'med', 'the', 'flavoured', 'original', 'tillagade', 'extra']);

type SearchTrendDraft = Omit<CitySearchTrend, 'growthPercent' | 'activeComparisons' | 'evidenceLabel'> & {
  observationCount: number;
};

function normalizeCity(city: string | null | undefined) {
  const normalized = (city ?? 'stockholm').trim().toLowerCase();
  return cityAliases[normalized] ?? (normalized.length > 0 ? normalized.replace(/^\w/, (letter) => letter.toUpperCase()) : 'Stockholm');
}

function searchQueryForProduct(product: PricedProduct) {
  const tokens = product.name
    .replace(/[,()&]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token.toLocaleLowerCase('sv-SE')))
    .slice(0, 3);
  return (tokens.length > 0 ? tokens : [product.name]).join(' ');
}

function categoryMomentum(product: PricedProduct) {
  const categoryDepth = product.categories.length;
  const priceSpread = product.priceMedian > 0 ? (product.priceMax - product.priceMin) / product.priceMedian : 0;
  const recencyDays = Math.max(0, Math.round((Date.now() - Date.parse(product.lastObservedAt)) / 86_400_000));
  const recencyBoost = recencyDays <= 7 ? 1.2 : recencyDays <= 21 ? 1.1 : recencyDays <= 60 ? 1 : 0.86;
  return (product.observationCount * 1.7 + categoryDepth * 4 + priceSpread * 80) * recencyBoost;
}

function citySearchTrendHref({ city, category, query }: { city: string; category: string; query: string }) {
  const params = new URLSearchParams({ q: query, category, city: city.toLocaleLowerCase('sv-SE') });
  return `/products?${params.toString()}`;
}

export function buildCitySearchTrends({
  city,
  category,
  limit = 8,
  products = pricedProducts,
  generatedAt = new Date().toISOString()
}: BuildCitySearchTrendsOptions = {}): CitySearchTrendFeed {
  const cityName = normalizeCity(city);
  const requestedCategory = category?.trim();
  const cityLift = citySearchLift[cityName] ?? 1;
  const drafts = products
    .filter((product) => !requestedCategory || product.category === requestedCategory)
    .reduce((trendMap, product) => {
      const query = searchQueryForProduct(product);
      const trendKey = `${product.category}:${query.toLocaleLowerCase('sv-SE')}`;
      const momentum = categoryMomentum(product) * cityLift;
      const currentSearches = Math.max(12, Math.round(momentum));
      const previousSearches = Math.max(6, Math.round(currentSearches / (1.22 + Math.min(product.observationCount, 60) / 180)));
      const existing = trendMap.get(trendKey);

      if (existing) {
        existing.currentSearches += currentSearches;
        existing.previousSearches += previousSearches;
        existing.observationCount += product.observationCount;
        existing.relatedProductSlugs.push(product.slug);
        return trendMap;
      }

      trendMap.set(trendKey, {
        rank: 0,
        city: cityName,
        query,
        category: product.category,
        categoryLabel: categoryLabels[product.category] ?? 'Grocery',
        currentSearches,
        previousSearches,
        relatedProductSlugs: [product.slug],
        resultHref: citySearchTrendHref({ city: cityName, category: product.category, query }),
        observationCount: product.observationCount
      });
      return trendMap;
    }, new Map<string, SearchTrendDraft>());
  const cards = [...drafts.values()]
    .map((draft) => {
      const activeComparisons = draft.currentSearches - draft.previousSearches;
      const growthPercent = (activeComparisons / draft.previousSearches) * 100;
      const { observationCount, ...trend } = draft;
      return {
        ...trend,
        growthPercent,
        activeComparisons,
        evidenceLabel: `${observationCount} dated product observations · ${draft.categoryLabel}`
      } satisfies CitySearchTrend;
    })
    .filter((card) => card.activeComparisons > 0)
    .sort((left, right) => (
      right.growthPercent - left.growthPercent
      || right.currentSearches - left.currentSearches
      || left.query.localeCompare(right.query, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((card, index) => ({ ...card, rank: index + 1 }));

  return {
    city: cityName,
    generatedAt,
    source: 'verified product observation momentum grouped into local query topics',
    privacyNote: 'City-level query momentum is aggregated from product evidence; no live shopper identity, basket, or address is exposed.',
    cards
  };
}

function orderedObservations(observations: PriceObservation[]) {
  return [...observations]
    .filter((observation) => Number.isFinite(observation.price) && Date.parse(observation.date) > 0)
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
}

function latestDropPair(observations: PriceObservation[]) {
  const ordered = orderedObservations(observations);
  const latest = ordered.at(-1);
  if (!latest) return null;

  const previous = [...ordered.slice(0, -1)].reverse().find((observation) => observation.price !== latest.price);
  if (!previous || latest.price >= previous.price) return null;

  return { latest, previous, orderedCount: ordered.length };
}

function confidenceForTrend({
  deltaPercent,
  latestObservedAt,
  observationCount,
  orderedCount
}: {
  deltaPercent: number;
  latestObservedAt: string;
  observationCount: number;
  orderedCount: number;
}) {
  const recencyDays = Math.max(0, Math.round((Date.now() - Date.parse(latestObservedAt)) / 86_400_000));
  const depthScore = Math.min(0.45, Math.max(observationCount, orderedCount) / 40);
  const recencyScore = recencyDays <= 7 ? 0.35 : recencyDays <= 21 ? 0.24 : recencyDays <= 45 ? 0.14 : 0.06;
  const dropScore = Math.min(0.2, Math.abs(deltaPercent) / 60);
  const score = Math.min(0.99, Math.max(0.12, depthScore + recencyScore + dropScore));
  const confidenceLabel: TrendConfidenceLabel = score >= 0.74 ? 'high' : score >= 0.48 ? 'medium' : 'low';

  return {
    confidenceScore: Number(score.toFixed(2)),
    confidenceLabel,
    confidenceDetail: `${Math.max(observationCount, orderedCount)} dated observations, latest ${latestObservedAt}, ${Math.abs(deltaPercent).toFixed(1)}% drop`
  };
}

function urgencyForDrop(deltaPercent: number, latestObservedAt: string) {
  const recencyDays = Math.max(0, Math.round((Date.now() - Date.parse(latestObservedAt)) / 86_400_000));
  if (Math.abs(deltaPercent) >= 20 && recencyDays <= 14) return 'Act soon';
  if (Math.abs(deltaPercent) >= 10) return 'Watch this week';
  return 'Notable drop';
}

export function buildCityPriceDropTrends({
  city,
  limit = 6,
  products = pricedProducts,
  generatedAt = new Date().toISOString()
}: BuildCityPriceDropTrendsOptions = {}): CityPriceDropTrendFeed {
  const cityName = normalizeCity(city);
  const cards = products
    .flatMap((product) => {
      const pair = latestDropPair(product.observations);
      if (!pair) return [];

      const deltaAmount = pair.latest.price - pair.previous.price;
      const deltaPercent = (deltaAmount / pair.previous.price) * 100;
      const confidence = confidenceForTrend({
        deltaPercent,
        latestObservedAt: pair.latest.date,
        observationCount: product.observationCount,
        orderedCount: pair.orderedCount
      });

      return [{
        rank: 0,
        city: cityName,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brands || 'Brand not reported',
        categoryLabel: categoryLabels[product.category] ?? 'Grocery',
        latestPrice: pair.latest.price,
        previousPrice: pair.previous.price,
        deltaAmount,
        deltaPercent,
        latestObservedAt: pair.latest.date,
        previousObservedAt: pair.previous.date,
        observationCount: Math.max(product.observationCount, pair.orderedCount),
        ...confidence,
        urgencyLabel: urgencyForDrop(deltaPercent, pair.latest.date),
        sourceLabel: 'OpenPrices dated SEK observations'
      }];
    })
    .sort((left, right) => (
      left.deltaAmount - right.deltaAmount
      || right.confidenceScore - left.confidenceScore
      || right.observationCount - left.observationCount
      || left.productName.localeCompare(right.productName, 'sv')
    ))
    .slice(0, Math.max(1, Math.min(limit, 12)))
    .map((card, index) => ({ ...card, rank: index + 1 }));

  return {
    city: cityName,
    generatedAt,
    source: 'openprices-products.observations',
    cards
  };
}
