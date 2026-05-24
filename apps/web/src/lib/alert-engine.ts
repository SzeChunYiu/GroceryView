export type PriceHistoryPoint = {
  price: number;
  observedAt?: string;
};

export type RollingThresholdTuning = {
  rollingAverage: number;
  volatility: number;
  thresholdPercent: number;
  tunedTargetPrice: number;
  sampleSize: number;
  windowDays: number;
};

export type AlertThresholdPreference = {
  productId: string;
  userEmail?: string;
  baseThresholdPercent?: number;
  windowDays?: number;
  minimumSamples?: number;
};

const DEFAULT_BASE_THRESHOLD_PERCENT = 8;
const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_MINIMUM_SAMPLES = 3;
const MIN_THRESHOLD_PERCENT = 3;
const MAX_THRESHOLD_PERCENT = 25;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function validPricePoint(point: PriceHistoryPoint): point is PriceHistoryPoint {
  return Number.isFinite(point.price) && point.price >= 0;
}

function pointsInWindow(points: PriceHistoryPoint[], windowDays: number, now = Date.now()) {
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
  return points.filter((point) => {
    if (!validPricePoint(point)) return false;
    if (!point.observedAt) return true;
    const observedAt = Date.parse(point.observedAt);
    return Number.isFinite(observedAt) && observedAt >= cutoff;
  });
}

export function calculateRollingThresholdTuning(
  history: PriceHistoryPoint[],
  preference: Omit<AlertThresholdPreference, 'productId' | 'userEmail'> = {}
): RollingThresholdTuning {
  const windowDays = Math.max(1, Math.trunc(preference.windowDays ?? DEFAULT_WINDOW_DAYS));
  const minimumSamples = Math.max(1, Math.trunc(preference.minimumSamples ?? DEFAULT_MINIMUM_SAMPLES));
  const sample = pointsInWindow(history, windowDays);
  const prices = (sample.length >= minimumSamples ? sample : history.filter(validPricePoint)).map((point) => point.price);

  if (prices.length === 0) {
    const thresholdPercent = clamp(preference.baseThresholdPercent ?? DEFAULT_BASE_THRESHOLD_PERCENT, MIN_THRESHOLD_PERCENT, MAX_THRESHOLD_PERCENT);
    return { rollingAverage: 0, volatility: 0, thresholdPercent, tunedTargetPrice: 0, sampleSize: 0, windowDays };
  }

  const rollingAverage = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + ((price - rollingAverage) ** 2), 0) / prices.length;
  const standardDeviation = Math.sqrt(variance);
  const volatility = rollingAverage > 0 ? standardDeviation / rollingAverage : 0;
  const baseThresholdPercent = clamp(preference.baseThresholdPercent ?? DEFAULT_BASE_THRESHOLD_PERCENT, MIN_THRESHOLD_PERCENT, MAX_THRESHOLD_PERCENT);
  const thresholdPercent = clamp(baseThresholdPercent + volatility * 100, MIN_THRESHOLD_PERCENT, MAX_THRESHOLD_PERCENT);
  const tunedTargetPrice = Number((rollingAverage * (1 - thresholdPercent / 100)).toFixed(2));

  return {
    rollingAverage: Number(rollingAverage.toFixed(2)),
    volatility: Number(volatility.toFixed(4)),
    thresholdPercent: Number(thresholdPercent.toFixed(2)),
    tunedTargetPrice,
    sampleSize: prices.length,
    windowDays
  };
}
