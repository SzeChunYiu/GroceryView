import { pricedProducts, type PricedProduct, type PriceObservation } from './openprices-products';

type VolatilityBand = 'stable' | 'watch' | 'volatile';

export type ProductStoreVolatilityPrediction = {
  category: string;
  latestObservedAt: string;
  latestPrice: number;
  observationCount: number;
  pairKey: string;
  priceSwingPercent: number;
  productName: string;
  productSlug: string;
  shortTermVolatilityScore: number;
  signal: VolatilityBand;
  storeId: string;
  storeName: string;
  timeSpanDays: number;
};

export type VolatilityPredictionOptions = {
  category?: string;
  limit?: number;
  minObservations?: number;
};

type DailyPricePoint = {
  date: string;
  price: number;
};

const COMMUNITY_STORE_ID = 'openprices-community';
const COMMUNITY_STORE_NAME = 'OpenPrices community observations';
const DEFAULT_LIMIT = 12;
const DEFAULT_MIN_OBSERVATIONS = 4;

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function dailyPricePoints(observations: PriceObservation[]): DailyPricePoint[] {
  const pricesByDate = observations.reduce<Record<string, number[]>>((ledger, observation) => {
    if (!observation.date || !Number.isFinite(observation.price)) return ledger;
    ledger[observation.date] = [...(ledger[observation.date] ?? []), observation.price];
    return ledger;
  }, {});

  return Object.entries(pricesByDate)
    .map(([date, prices]) => ({ date, price: median(prices) }))
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
}

function signalForScore(score: number): VolatilityBand {
  if (score >= 45) return 'volatile';
  if (score >= 20) return 'watch';
  return 'stable';
}

function volatilityPredictionFor(product: PricedProduct, minObservations: number): ProductStoreVolatilityPrediction | null {
  const points = dailyPricePoints(product.observations);
  if (points.length < minObservations) return null;

  const prices = points.map((point) => point.price);
  const latest = points[points.length - 1];
  const first = points[0];
  const latestTimestamp = Date.parse(latest.date);
  const weightedMoves = points.slice(1).map((point, index) => {
    const previous = points[index];
    if (previous.price <= 0) return 0;
    const ageDays = Math.max(0, (latestTimestamp - Date.parse(point.date)) / 86_400_000);
    const recencyWeight = ageDays <= 45 ? 1 : ageDays <= 90 ? 0.65 : 0.35;
    return Math.abs((point.price - previous.price) / previous.price) * 100 * recencyWeight;
  });
  const meanWeightedMove = weightedMoves.reduce((sum, value) => sum + value, 0) / weightedMoves.length;
  const medianPrice = median(prices);
  const priceSwingPercent = medianPrice > 0 ? ((Math.max(...prices) - Math.min(...prices)) / medianPrice) * 100 : 0;
  const shortTermVolatilityScore = clamp(Math.round(meanWeightedMove * 4 + priceSwingPercent * 1.5), 0, 100);

  return {
    category: product.category,
    latestObservedAt: latest.date,
    latestPrice: round(latest.price),
    observationCount: points.length,
    pairKey: `${product.slug}:${COMMUNITY_STORE_ID}`,
    priceSwingPercent: round(priceSwingPercent),
    productName: product.name,
    productSlug: product.slug,
    shortTermVolatilityScore,
    signal: signalForScore(shortTermVolatilityScore),
    storeId: COMMUNITY_STORE_ID,
    storeName: COMMUNITY_STORE_NAME,
    timeSpanDays: Math.max(0, Math.round((Date.parse(latest.date) - Date.parse(first.date)) / 86_400_000))
  };
}

export function runVolatilityPredictionJob(options: VolatilityPredictionOptions = {}): ProductStoreVolatilityPrediction[] {
  const limit = clamp(Math.floor(options.limit ?? DEFAULT_LIMIT), 1, 50);
  const minObservations = clamp(Math.floor(options.minObservations ?? DEFAULT_MIN_OBSERVATIONS), 2, 25);

  return pricedProducts
    .filter((product) => !options.category || product.category === options.category)
    .map((product) => volatilityPredictionFor(product, minObservations))
    .filter((prediction): prediction is ProductStoreVolatilityPrediction => prediction !== null)
    .sort((left, right) => (
      right.shortTermVolatilityScore - left.shortTermVolatilityScore
      || right.observationCount - left.observationCount
      || right.latestObservedAt.localeCompare(left.latestObservedAt)
    ))
    .slice(0, limit);
}

export const volatilityPredictionMethodology = {
  source: 'OpenPrices generated historical timestamps grouped as product-store pairs',
  pairStoreFallback: COMMUNITY_STORE_ID,
  scoring: 'Daily median prices are sorted by observed timestamp; recent absolute percent moves and observed price swing create a 0-100 shortTermVolatilityScore.',
  claimBoundary: 'This endpoint predicts volatility risk from historical timestamps only; it does not forecast a future price.'
};
