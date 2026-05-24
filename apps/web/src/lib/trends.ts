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

type BuildCityPriceDropTrendsOptions = {
  city?: string | null;
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

function normalizeCity(city: string | null | undefined) {
  const normalized = (city ?? 'stockholm').trim().toLowerCase();
  return cityAliases[normalized] ?? (normalized.length > 0 ? normalized.replace(/^\w/, (letter) => letter.toUpperCase()) : 'Stockholm');
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
