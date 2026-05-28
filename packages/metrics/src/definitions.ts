import { calculateDealScore, scoreBand } from '@groceryview/core';

/** Canonical metric ids — see docs/data/metric-dictionary.md */
export const METRIC_IDS = [
  'current_best_price',
  'unit_price',
  'price_index',
  'chain_price_index',
  'category_price_index',
  'weekly_change_pct',
  'three_month_change_pct',
  'one_year_change_pct',
  'deal_score',
  'deal_label',
  'price_spread_pct',
  'freshness_rate',
  'coverage_rate',
  'confidence_score',
  'observation_count',
  'source_success_rate',
  'search_zero_result_rate',
  'search_to_product_click_rate',
  'watchlist_alert_trigger_rate'
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

export type DealScoreInput = Parameters<typeof calculateDealScore>[0];

export function canonicalDealScore(input: DealScoreInput): number {
  return calculateDealScore(input);
}

export function canonicalDealBand(score: number): ReturnType<typeof scoreBand> {
  return scoreBand(score);
}

export function weeklyChangePct(previous: number, latest: number): number | undefined {
  if (!Number.isFinite(previous) || previous === 0 || !Number.isFinite(latest)) return undefined;
  return ((latest - previous) / previous) * 100;
}

export function windowChangePct(points: number[], windowSize: number): number | undefined {
  if (points.length < windowSize + 1) return undefined;
  const start = points[points.length - windowSize - 1]!;
  const end = points[points.length - 1]!;
  return weeklyChangePct(start, end);
}
