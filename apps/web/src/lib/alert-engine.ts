export type AlertThresholdCadence = 'immediate' | 'daily_digest' | 'weekly_digest' | 'paused';
export type AlertThresholdSensitivity = 'low' | 'standard' | 'high';
export type AlertVolatilityBand = 'unknown' | 'stable' | 'moderate' | 'volatile';

export type RollingAverageThresholdInput = {
  baselineThreshold: number;
  cadence: AlertThresholdCadence;
  rollingAverageWindowDays?: number;
  rollingAverageVolatility?: number | null;
  rollingAverageVolatilityPercent?: number | null;
  sensitivity: AlertThresholdSensitivity;
  volatilityScore?: number | null;
};

export type RollingAverageThresholdTuning = {
  minimumConfidence: number;
  rollingAverageWindowDays: number;
  thresholdAdjustment: number;
  thresholdRationale: string;
  volatilityBand: AlertVolatilityBand;
  volatilityScore: number | null;
};

const DEFAULT_ROLLING_AVERAGE_WINDOW_DAYS = 30;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function percentLikeToScore(value: number | null) {
  if (value === null) return null;
  return clamp(value <= 1 ? value * 100 : value, 0, 100);
}

export function alertVolatilityBand(volatilityScore: number | null | undefined): AlertVolatilityBand {
  const score = finiteNumber(volatilityScore);
  if (score === null) return 'unknown';
  if (score >= 18) return 'volatile';
  if (score >= 8) return 'moderate';
  return 'stable';
}

function resolveVolatilityScore(input: RollingAverageThresholdInput) {
  const explicitScore = finiteNumber(input.volatilityScore);
  if (explicitScore !== null) return clamp(explicitScore, 0, 100);

  const rollingAveragePercent = percentLikeToScore(finiteNumber(input.rollingAverageVolatilityPercent));
  if (rollingAveragePercent !== null) return rollingAveragePercent;

  return percentLikeToScore(finiteNumber(input.rollingAverageVolatility));
}

function volatilityAdjustment(band: AlertVolatilityBand, sensitivity: AlertThresholdSensitivity) {
  if (band === 'stable') return sensitivity === 'high' ? -0.04 : sensitivity === 'standard' ? -0.02 : 0;
  if (band === 'moderate') return sensitivity === 'low' ? 0.04 : sensitivity === 'standard' ? 0.02 : 0;
  if (band === 'volatile') return sensitivity === 'low' ? 0.1 : sensitivity === 'standard' ? 0.07 : 0.04;
  return 0;
}

export function tuneRollingAverageAlertThreshold(input: RollingAverageThresholdInput): RollingAverageThresholdTuning {
  const baselineThreshold = clamp(input.baselineThreshold, 0.5, 1);
  const volatilityScore = resolveVolatilityScore(input);
  const volatilityBand = alertVolatilityBand(volatilityScore);
  const rawAdjustment = input.cadence === 'paused' ? 0 : volatilityAdjustment(volatilityBand, input.sensitivity);
  const minimumConfidence = input.cadence === 'paused'
    ? 1
    : clamp(Number((baselineThreshold + rawAdjustment).toFixed(2)), 0.5, 0.99);
  const thresholdAdjustment = Number((minimumConfidence - baselineThreshold).toFixed(2));
  const rollingAverageWindowDays = Math.max(1, Math.round(input.rollingAverageWindowDays ?? DEFAULT_ROLLING_AVERAGE_WINDOW_DAYS));

  return {
    minimumConfidence,
    rollingAverageWindowDays,
    thresholdAdjustment,
    thresholdRationale: volatilityBand === 'unknown'
      ? 'No historical volatility score was supplied, so the baseline sensitivity threshold is used.'
      : `A ${rollingAverageWindowDays}-day rolling volatility band classified the category as ${volatilityBand}, adjusting the baseline threshold by ${thresholdAdjustment.toFixed(2)}.`,
    volatilityBand,
    volatilityScore: volatilityScore === null ? null : Math.round(volatilityScore)
  };
}
