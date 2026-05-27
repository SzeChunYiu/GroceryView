import type { ConfidenceLabel, DealLabel, FreshnessLabel } from './types';

export function formatSek(value: number): string {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(parsed);
}

export function formatConfidence(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return 'Unknown confidence';
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(value * 100)}% confidence`;
}

const dealLabelCopy: Record<DealLabel, string> = {
  real_deal: 'Real Deal',
  fair_discount: 'Fair Discount',
  not_really_a_deal: 'Not Really a Deal',
  unknown: 'Unverified'
};

export function formatDealLabel(label?: DealLabel): string {
  return label ? dealLabelCopy[label] : dealLabelCopy.unknown;
}

const freshnessCopy: Record<FreshnessLabel, string> = {
  fresh: 'Fresh',
  aging: 'Aging',
  stale: 'Stale',
  unknown: 'Unknown freshness'
};

export function formatFreshness(label?: FreshnessLabel): string {
  return label ? freshnessCopy[label] : freshnessCopy.unknown;
}

const confidenceLabelCopy: Record<ConfidenceLabel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  unknown: 'Unknown confidence'
};

export function formatConfidenceLabel(label?: ConfidenceLabel): string {
  return label ? confidenceLabelCopy[label] : confidenceLabelCopy.unknown;
}
