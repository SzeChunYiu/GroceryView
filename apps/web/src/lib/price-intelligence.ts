export type ObservedPricePoint = {
  price: number;
};

export type VolatilityBadgeMethodology = {
  score: number;
  observationCount: number;
  rangeLabel: string;
  summary: string;
  forecastBoundary: string;
};

export type PriceTrendPredictionConfidenceInput = {
  trendSlopePercent: number;
  volatilityPercent: number;
  observationCount: number;
  latestObservedAt?: string;
  referenceDate?: Date;
};

export type PriceTrendPredictionConfidence = {
  expectedDirectionLabel: string;
  confidenceRangeLabel: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidencePercent: number;
  evidenceCount: number;
  freshnessLabel: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ageDaysFor(latestObservedAt: string | undefined, referenceDate: Date) {
  if (!latestObservedAt) return null;
  const observedTime = Date.parse(`${latestObservedAt}T00:00:00.000Z`);
  if (!Number.isFinite(observedTime)) return null;
  const ageMs = referenceDate.getTime() - observedTime;
  if (!Number.isFinite(ageMs)) return null;
  return Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
}

export function priceTrendPredictionConfidence(input: PriceTrendPredictionConfidenceInput): PriceTrendPredictionConfidence {
  const trendSlopePercent = Number.isFinite(input.trendSlopePercent) ? input.trendSlopePercent : 0;
  const volatilityPercent = Number.isFinite(input.volatilityPercent) ? Math.max(0, input.volatilityPercent) : 0;
  const evidenceCount = Math.max(0, Math.floor(input.observationCount));
  const ageDays = ageDaysFor(input.latestObservedAt, input.referenceDate ?? new Date());
  const direction = trendSlopePercent <= -2 ? 'expected direction: easing' : trendSlopePercent >= 2 ? 'expected direction: rising' : 'expected direction: stable';
  const evidenceScore = Math.min(54, evidenceCount * 6);
  const freshnessScore = ageDays === null ? 4 : ageDays <= 14 ? 18 : ageDays <= 45 ? 10 : 2;
  const trendSignalScore = Math.min(18, Math.abs(trendSlopePercent) * 1.5);
  const volatilityPenalty = Math.min(26, volatilityPercent * 1.2);
  const confidencePercent = Math.round(clamp(22 + evidenceScore + freshnessScore + trendSignalScore - volatilityPenalty, 5, 95));
  const confidenceLevel = confidencePercent >= 72 ? 'high' : confidencePercent >= 48 ? 'medium' : 'low';
  const rangeLow = Math.max(5, confidencePercent - 12);
  const rangeHigh = Math.min(95, confidencePercent + 12);
  const freshnessLabel = ageDays === null
    ? 'freshness: latest observation unknown'
    : `freshness: last observed ${input.latestObservedAt} (${ageDays} day${ageDays === 1 ? '' : 's'} old)`;

  return {
    expectedDirectionLabel: direction,
    confidenceRangeLabel: `${confidenceLevel} confidence range: ${rangeLow}-${rangeHigh}%`,
    confidenceLevel,
    confidencePercent,
    evidenceCount,
    freshnessLabel
  };
}

export function volatilityBadgeMethodology(points: ReadonlyArray<ObservedPricePoint>): VolatilityBadgeMethodology {
  const prices = points.map((point) => point.price).filter((price) => Number.isFinite(price));
  const observationCount = prices.length;

  if (observationCount < 2) {
    return {
      score: 0,
      observationCount,
      rangeLabel: 'Needs at least two observed prices',
      summary: 'The 0-100 volatility score stays at 0 until the badge has enough historical observations to compare a high and low price.',
      forecastBoundary: 'No future price forecast is made from this badge.'
    };
  }

  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const average = prices.reduce((sum, price) => sum + price, 0) / observationCount;
  const score = Math.min(100, Math.round(((high - low) / average) * 100));

  return {
    score,
    observationCount,
    rangeLabel: `${low.toFixed(2)}-${high.toFixed(2)} SEK observed range`,
    summary: 'The 0-100 volatility score is the observed high-low spread divided by the average observed price, capped at 100.',
    forecastBoundary: 'No future price forecast is made from this badge; it only explains historical observed prices.'
  };
}
