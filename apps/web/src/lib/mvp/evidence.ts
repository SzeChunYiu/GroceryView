import { getPriceFreshness, type FreshnessLevel } from '@/lib/freshness';
import type { ConfidenceLabel, FreshnessLabel, VerifiedEvidence } from './types';

function mapFreshness(level: FreshnessLevel): FreshnessLabel {
  if (level === 'fresh' || level === 'aging' || level === 'stale') return level;
  return 'unknown';
}

export function confidenceLabelFromScore(score: number, observationCount: number): ConfidenceLabel {
  if (observationCount >= 20 && score >= 0.75) return 'high';
  if (observationCount >= 5 && score >= 0.45) return 'medium';
  if (observationCount > 0) return 'low';
  return 'unknown';
}

export function buildVerifiedEvidence(input: {
  sourceLabel: string;
  lastObservedAt?: string;
  observationCount?: number;
  confidence?: number;
}): VerifiedEvidence {
  const observationCount = Math.max(0, input.observationCount ?? 0);
  const confidence = Math.min(1, Math.max(0, input.confidence ?? (observationCount >= 10 ? 0.72 : observationCount >= 3 ? 0.52 : observationCount > 0 ? 0.35 : 0)));
  const freshness = getPriceFreshness(input.lastObservedAt ?? null);
  return {
    sourceLabel: input.sourceLabel,
    lastObservedAt: input.lastObservedAt ?? '',
    freshnessLabel: mapFreshness(freshness.level),
    confidence,
    confidenceLabel: confidenceLabelFromScore(confidence, observationCount),
    observationCount
  };
}
