export type PromotionObservation = {
  observedAt: string;
  productId: string;
  onPromotion: boolean;
};

export type BestTimeToBuyPrediction = {
  productId: string;
  label: 'Likely on sale next week' | 'Wait for a later promo' | 'Buy when needed';
  confidence: number;
  nextDiscountWindowStart: string | null;
  nextDiscountWindowEnd: string | null;
  evidence: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDay(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.parse(`${value}T00:00:00.000Z`);
}

function isoDay(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

export function predictBestTimeToBuy(productId: string, observations: PromotionObservation[], asOf = new Date()): BestTimeToBuyPrediction {
  const promoDays = observations
    .filter((observation) => observation.productId === productId && observation.onPromotion)
    .map((observation) => parseDay(observation.observedAt))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (promoDays.length < 2) {
    return {
      productId,
      label: 'Buy when needed',
      confidence: 0,
      nextDiscountWindowStart: null,
      nextDiscountWindowEnd: null,
      evidence: 'Not enough historical promotion observations to estimate cadence.'
    };
  }

  const gaps = promoDays.slice(1).map((day, index) => Math.max(1, Math.round((day - promoDays[index]!) / DAY_MS)));
  const cadenceDays = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
  const latestPromo = promoDays[promoDays.length - 1]!;
  const predictedStart = latestPromo + cadenceDays * DAY_MS;
  const predictedEnd = predictedStart + 6 * DAY_MS;
  const daysUntilStart = Math.round((predictedStart - asOf.getTime()) / DAY_MS);
  const averageGapError = gaps.reduce((sum, gap) => sum + Math.abs(gap - cadenceDays), 0) / gaps.length;
  const confidence = Math.max(0.1, Math.min(0.95, 1 - averageGapError / Math.max(cadenceDays, 1))) * Math.min(1, promoDays.length / 6);

  return {
    productId,
    label: daysUntilStart >= 0 && daysUntilStart <= 7 ? 'Likely on sale next week' : daysUntilStart > 7 ? 'Wait for a later promo' : 'Buy when needed',
    confidence,
    nextDiscountWindowStart: isoDay(predictedStart),
    nextDiscountWindowEnd: isoDay(predictedEnd),
    evidence: `${promoDays.length} historical promo observations with ${cadenceDays}-day average cadence.`
  };
}
