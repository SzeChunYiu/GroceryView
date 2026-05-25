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

export type BasketBuyTimingAction = 'buy_now' | 'watch' | 'substitute';

export type BasketBuyTimingInput = {
  id: string;
  productName: string;
  categoryLabel: string;
  currentPrice: number;
  currentPriceLabel: string;
  currentStoreName: string;
  typicalPrice?: number | null;
  previousPrice?: number | null;
  sourceConfidence?: number;
  substitute?: {
    productName: string;
    price: number;
    priceLabel: string;
    storeName: string;
  } | null;
};

export type BasketBuyTimingRecommendation = {
  id: string;
  productName: string;
  categoryLabel: string;
  action: BasketBuyTimingAction;
  actionLabel: string;
  currentPriceLabel: string;
  currentStoreName: string;
  confidenceLabel: string;
  rationale: string;
  substitute?: BasketBuyTimingInput['substitute'];
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

function priceDeltaPercent(currentPrice: number, referencePrice: number | null | undefined) {
  if (typeof referencePrice !== 'number' || !Number.isFinite(referencePrice) || referencePrice <= 0) return null;
  return ((currentPrice - referencePrice) / referencePrice) * 100;
}

function confidenceLabel(sourceConfidence = 0) {
  if (sourceConfidence >= 0.8) return 'high source confidence';
  if (sourceConfidence >= 0.5) return 'medium source confidence';
  return 'limited source confidence';
}

export function assessBasketBuyTiming(input: BasketBuyTimingInput): BasketBuyTimingRecommendation {
  const previousDelta = priceDeltaPercent(input.currentPrice, input.previousPrice);
  const typicalDelta = priceDeltaPercent(input.currentPrice, input.typicalPrice);
  const substituteDelta = input.substitute ? priceDeltaPercent(input.substitute.price, input.currentPrice) : null;

  if (substituteDelta !== null && substituteDelta <= -8) {
    return {
      id: input.id,
      productName: input.productName,
      categoryLabel: input.categoryLabel,
      action: 'substitute',
      actionLabel: 'Substitute',
      currentPriceLabel: input.currentPriceLabel,
      currentStoreName: input.currentStoreName,
      confidenceLabel: confidenceLabel(input.sourceConfidence),
      rationale: `${input.substitute?.productName} is ${Math.abs(substituteDelta).toFixed(0)}% cheaper than the current selected row. Review before replacing the basket line.`,
      substitute: input.substitute
    };
  }

  if (
    (previousDelta !== null && previousDelta <= -5)
    || (typicalDelta !== null && typicalDelta <= -5)
  ) {
    return {
      id: input.id,
      productName: input.productName,
      categoryLabel: input.categoryLabel,
      action: 'buy_now',
      actionLabel: 'Buy now',
      currentPriceLabel: input.currentPriceLabel,
      currentStoreName: input.currentStoreName,
      confidenceLabel: confidenceLabel(input.sourceConfidence),
      rationale: `Current basket price is at least 5% below the observed comparison point; no future price forecast is made.`
    };
  }

  return {
    id: input.id,
    productName: input.productName,
    categoryLabel: input.categoryLabel,
    action: 'watch',
    actionLabel: 'Watch',
    currentPriceLabel: input.currentPriceLabel,
    currentStoreName: input.currentStoreName,
    confidenceLabel: confidenceLabel(input.sourceConfidence),
    rationale: 'Current basket price is not clearly below observed comparison points, so keep it on the watch list before the trip.'
  };
}

export function summarizeBasketBuyTiming(recommendations: ReadonlyArray<BasketBuyTimingRecommendation>) {
  return {
    buyNow: recommendations.filter((item) => item.action === 'buy_now').length,
    watch: recommendations.filter((item) => item.action === 'watch').length,
    substitute: recommendations.filter((item) => item.action === 'substitute').length,
    itemCount: recommendations.length
  };
}
