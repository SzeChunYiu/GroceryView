export type ModerationRiskBand = 'low' | 'medium' | 'high';

export const MODERATION_RISK_THRESHOLDS: Record<ModerationRiskBand, number> = {
  high: 0.75,
  medium: 0.45,
  low: 0
} as const;

export const MODERATION_RISK_GUIDANCE = [
  {
    band: 'high',
    label: 'High risk',
    threshold: MODERATION_RISK_THRESHOLDS.high,
    routing: 'Queue for immediate human review before publishing.'
  },
  {
    band: 'medium',
    label: 'Medium risk',
    threshold: MODERATION_RISK_THRESHOLDS.medium,
    routing: 'Keep visible only after reviewer spot-checks the report evidence.'
  },
  {
    band: 'low',
    label: 'Low risk',
    threshold: MODERATION_RISK_THRESHOLDS.low,
    routing: 'Allow normal processing while retaining abuse telemetry.'
  }
] as const;

export function moderationRiskBand(score: number): ModerationRiskBand {
  if (score >= MODERATION_RISK_THRESHOLDS.high) return 'high';
  if (score >= MODERATION_RISK_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function formatModerationThreshold(value: number) {
  return `${Math.round(value * 100)}%`;
}
