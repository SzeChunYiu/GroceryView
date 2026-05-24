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
