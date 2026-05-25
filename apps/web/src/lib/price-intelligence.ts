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

export type PriceForecastObservation = {
  observedAt: string;
  price: number;
};

export type ShortTermPriceForecastPoint = {
  time: string;
  value: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
};

export type ShortTermPriceForecast = {
  available: boolean;
  horizonDays: number;
  trendLabel: string;
  summary: string;
  caveat: string;
  points: ShortTermPriceForecastPoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isoDateAfter(observedTime: number, days: number) {
  return new Date(observedTime + days * 24 * 60 * 60 * 1000).toISOString();
}

function standardDeviation(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return 0;
  const mean = finite.reduce((sum, value) => sum + value, 0) / finite.length;
  const variance = finite.reduce((sum, value) => sum + (value - mean) ** 2, 0) / finite.length;
  return Math.sqrt(variance);
}

export function buildShortTermPriceForecast({
  observations,
  horizonDays = 14,
  stepDays = 7
}: {
  observations: ReadonlyArray<PriceForecastObservation>;
  horizonDays?: number;
  stepDays?: number;
}): ShortTermPriceForecast {
  const ordered = observations
    .map((observation) => ({
      observedAt: observation.observedAt,
      observedTime: Date.parse(observation.observedAt),
      price: observation.price
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && Number.isFinite(observation.price) && observation.price > 0)
    .sort((a, b) => a.observedTime - b.observedTime);

  if (ordered.length < 3) {
    return {
      available: false,
      horizonDays,
      trendLabel: 'forecast withheld',
      summary: 'Needs at least three dated price observations.',
      caveat: 'The short-term forecast band is withheld until the product has enough observed price-event trend points.',
      points: []
    };
  }

  const recent = ordered.slice(-6);
  const latest = recent.at(-1)!;
  const deltas = recent.slice(1).map((point, index) => {
    const previous = recent[index]!;
    const elapsedDays = Math.max(1, (point.observedTime - previous.observedTime) / (24 * 60 * 60 * 1000));
    return {
      dailyDelta: (point.price - previous.price) / elapsedDays,
      absoluteDelta: point.price - previous.price
    };
  });
  const rawDailySlope = deltas.reduce((sum, delta) => sum + delta.dailyDelta, 0) / Math.max(1, deltas.length);
  const maxDailySlope = latest.price * 0.04;
  const dailySlope = clamp(rawDailySlope, -maxDailySlope, maxDailySlope);
  const priceVolatility = standardDeviation(recent.map((point) => point.price));
  const changeVolatility = standardDeviation(deltas.map((delta) => delta.absoluteDelta));
  const bandBase = Math.max(latest.price * 0.03, priceVolatility * 0.5, changeVolatility);
  const direction = Math.abs(dailySlope) < latest.price * 0.001 ? 'flat' : dailySlope > 0 ? 'rising' : 'falling';
  const weeklyTrendPercent = latest.price > 0 ? (dailySlope * 7 / latest.price) * 100 : 0;
  const confidence = clamp(0.35 + ordered.length / 40 - (bandBase / latest.price) * 0.45, 0.2, 0.82);
  const forecastPoints: ShortTermPriceForecastPoint[] = [];

  for (let days = stepDays; days <= horizonDays; days += stepDays) {
    const expected = Math.max(0.01, latest.price + dailySlope * days);
    const bandWidth = bandBase * Math.sqrt(days / stepDays);
    forecastPoints.push({
      time: isoDateAfter(latest.observedTime, days),
      value: Math.round((expected + Number.EPSILON) * 100) / 100,
      lowerBound: Math.round((Math.max(0.01, expected - bandWidth) + Number.EPSILON) * 100) / 100,
      upperBound: Math.round((expected + bandWidth + Number.EPSILON) * 100) / 100,
      confidence: Math.round((confidence + Number.EPSILON) * 100) / 100
    });
  }

  return {
    available: forecastPoints.length > 0,
    horizonDays,
    trendLabel: `${direction} ${weeklyTrendPercent.toFixed(1)}%/week observed trend`,
    summary: `Projects the latest observed price-event trend ${horizonDays} days ahead with an uncertainty band from recent volatility.`,
    caveat: 'Forecast uses only recent dated price-event trends from this product; it is not a retailer promotion, stock, or seasonality claim.',
    points: forecastPoints
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
