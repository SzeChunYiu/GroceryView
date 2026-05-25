export type BestTimeToBuyPriceType = 'shelf' | 'online' | 'member' | 'promotion' | 'receipt' | 'community' | 'estimated';

export type BestTimeToBuyObservation = {
  observedAt: string;
  price: number;
  priceType?: BestTimeToBuyPriceType;
  isPromotion?: boolean;
  promotionText?: string | null;
  promotionStartsOn?: string | null;
  promotionEndsOn?: string | null;
};

export type BestTimeToBuyPredictionStatus = 'likely_next_week' | 'watch_next_window' | 'currently_discounted' | 'keep_watching' | 'insufficient_history';

export type BestTimeToBuyConfidence = 'high' | 'medium' | 'low';

export type BestTimeToBuyPrediction = {
  status: BestTimeToBuyPredictionStatus;
  headline: string;
  windowLabel: string;
  confidence: BestTimeToBuyConfidence;
  confidenceScore: number;
  evidenceLabel: string;
  detail: string;
  nextWindowStart?: string;
  nextWindowEnd?: string;
  lastPromotionDate?: string;
  medianCadenceDays?: number;
  observedPromotionCount: number;
};

type PromotionSignal = {
  observedAt: string;
  observedTime: number;
  price: number;
};

const dayMs = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function parseObservedTime(value: string): number {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
  return Date.parse(normalized);
}

function isoDateFromTime(value: number): string {
  return new Date(value).toISOString().slice(0, 10);
}

function median(values: number[]): number | null {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function quantile(values: number[], q: number): number | null {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0]!;
  const position = (sorted.length - 1) * clamp(q, 0, 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const lowerValue = sorted[lower]!;
  const upperValue = sorted[upper]!;
  return lowerValue + (upperValue - lowerValue) * (position - lower);
}

function explicitPromotionSignal(observation: BestTimeToBuyObservation): boolean {
  return observation.isPromotion === true
    || observation.priceType === 'promotion'
    || observation.priceType === 'member'
    || Boolean(observation.promotionText?.trim())
    || Boolean(observation.promotionStartsOn?.trim())
    || Boolean(observation.promotionEndsOn?.trim());
}

function promotionSignals(observations: BestTimeToBuyObservation[]): PromotionSignal[] {
  const valid = observations
    .map((observation) => ({
      ...observation,
      observedTime: parseObservedTime(observation.observedAt)
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && Number.isFinite(observation.price) && observation.price > 0)
    .sort((a, b) => a.observedTime - b.observedTime);
  const prices = valid.map((observation) => observation.price);
  const lowQuantile = quantile(prices, 0.25);
  const medianPrice = median(prices);
  if (lowQuantile === null || medianPrice === null) return [];
  const inferredPromotionCeiling = Math.min(lowQuantile, medianPrice * 0.92);
  const signals = valid
    .filter((observation) => explicitPromotionSignal(observation) || observation.price <= inferredPromotionCeiling)
    .map((observation) => ({
      observedAt: dateOnly(observation.observedAt),
      observedTime: observation.observedTime,
      price: observation.price
    }));

  const deduped = new Map<string, PromotionSignal>();
  for (const signal of signals) {
    const existing = deduped.get(signal.observedAt);
    if (!existing || signal.price < existing.price) deduped.set(signal.observedAt, signal);
  }
  return [...deduped.values()].sort((a, b) => a.observedTime - b.observedTime);
}

function cadenceRegularity(gaps: number[]): number {
  if (gaps.length === 0) return 0;
  const cadence = median(gaps) ?? gaps[0]!;
  const averageDeviation = gaps.reduce((sum, gap) => sum + Math.abs(gap - cadence), 0) / gaps.length;
  return clamp(1 - averageDeviation / Math.max(cadence, 1), 0, 1);
}

function confidenceLevel(score: number): BestTimeToBuyConfidence {
  if (score >= 0.72) return 'high';
  if (score >= 0.48) return 'medium';
  return 'low';
}

function noPrediction(reason: string, observationCount: number): BestTimeToBuyPrediction {
  return {
    status: 'insufficient_history',
    headline: 'Best-time badge needs more promo history',
    windowLabel: 'No sale window predicted',
    confidence: 'low',
    confidenceScore: 0,
    evidenceLabel: `${observationCount} dated observation${observationCount === 1 ? '' : 's'}`,
    detail: reason,
    observedPromotionCount: 0
  };
}

export function predictBestTimeToBuy(input: {
  observations: BestTimeToBuyObservation[];
  asOf?: string;
  productName?: string;
  lookaheadDays?: number;
}): BestTimeToBuyPrediction {
  const validObservations = input.observations.filter((observation) => Number.isFinite(parseObservedTime(observation.observedAt)) && Number.isFinite(observation.price) && observation.price > 0);
  if (validObservations.length < 4) {
    return noPrediction('At least four dated prices are required before GroceryView predicts a product-level discount cadence.', validObservations.length);
  }

  const signals = promotionSignals(validObservations);
  if (signals.length < 2) {
    return noPrediction('No repeated promotion or low-price signals were found, so no next-sale window is inferred.', validObservations.length);
  }

  const latestObservationTime = Math.max(...validObservations.map((observation) => parseObservedTime(observation.observedAt)));
  const asOfTime = input.asOf ? parseObservedTime(input.asOf) : latestObservationTime;
  if (!Number.isFinite(asOfTime)) return noPrediction('The supplied asOf date is invalid, so the timing badge is withheld.', validObservations.length);

  const gaps = signals.slice(1).map((signal, index) => Math.max(1, Math.round((signal.observedTime - signals[index]!.observedTime) / dayMs)));
  const medianCadenceDays = Math.round(median(gaps) ?? 14);
  const lastSignal = signals.at(-1)!;
  const regularity = cadenceRegularity(gaps);
  const sampleScore = clamp((signals.length - 1) / 5, 0, 1);
  const recencyDays = Math.max(0, Math.round((asOfTime - lastSignal.observedTime) / dayMs));
  const recencyScore = clamp(1 - Math.max(0, recencyDays - medianCadenceDays * 1.5) / Math.max(medianCadenceDays * 3, 1), 0, 1);
  const confidenceScore = Math.round(clamp(0.2 + sampleScore * 0.35 + regularity * 0.3 + recencyScore * 0.15, 0, 1) * 100) / 100;
  const confidence = confidenceLevel(confidenceScore);
  const lookaheadDays = input.lookaheadDays ?? 7;
  const nextWindowStartTime = lastSignal.observedTime + medianCadenceDays * dayMs;
  const nextWindowEndTime = nextWindowStartTime + Math.max(6, Math.round(medianCadenceDays * 0.3)) * dayMs;
  const daysUntilNext = Math.round((nextWindowStartTime - asOfTime) / dayMs);
  const saleName = input.productName ? `${input.productName} ` : '';

  if (asOfTime >= lastSignal.observedTime && asOfTime <= lastSignal.observedTime + 6 * dayMs) {
    return {
      status: 'currently_discounted',
      headline: `${saleName}looks discounted now`,
      windowLabel: 'Observed sale-like price this week',
      confidence,
      confidenceScore,
      evidenceLabel: `${signals.length} promotion/low-price signals · ${medianCadenceDays}-day median cadence`,
      detail: `Latest low-price signal was ${lastSignal.observedAt}; cadence regularity ${Math.round(regularity * 100)}%.`,
      lastPromotionDate: lastSignal.observedAt,
      medianCadenceDays,
      observedPromotionCount: signals.length
    };
  }

  const base = {
    confidence,
    confidenceScore,
    evidenceLabel: `${signals.length} promotion/low-price signals · ${medianCadenceDays}-day median cadence`,
    detail: `Prediction uses only dated product prices and explicit promotion/member rows when present; low-price signals are prices at least 8% below the product median or inside its lowest quartile. Cadence regularity ${Math.round(regularity * 100)}%.`,
    nextWindowStart: isoDateFromTime(nextWindowStartTime),
    nextWindowEnd: isoDateFromTime(nextWindowEndTime),
    lastPromotionDate: lastSignal.observedAt,
    medianCadenceDays,
    observedPromotionCount: signals.length
  };

  if (daysUntilNext >= 0 && daysUntilNext <= lookaheadDays) {
    return {
      ...base,
      status: 'likely_next_week',
      headline: 'Likely on sale next week',
      windowLabel: `${isoDateFromTime(nextWindowStartTime)}–${isoDateFromTime(nextWindowEndTime)}`
    };
  }

  if (daysUntilNext > lookaheadDays && daysUntilNext <= 21) {
    return {
      ...base,
      status: 'watch_next_window',
      headline: 'Watch for a sale soon',
      windowLabel: `${daysUntilNext} days until likely discount window`
    };
  }

  return {
    ...base,
    status: 'keep_watching',
    headline: daysUntilNext < 0 ? 'Sale cadence overdue' : 'No sale expected next week',
    windowLabel: daysUntilNext < 0 ? 'Discount window may have passed' : `${daysUntilNext} days until likely window`
  };
}
