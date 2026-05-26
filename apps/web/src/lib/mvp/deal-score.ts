import type { DealLabel, FreshnessLabel } from './types';

export function classifyDeal(input: {
  historicDiscountPct?: number;
  nearbyDiscountPct?: number;
  confidence?: number;
  freshnessLabel?: FreshnessLabel;
}): DealLabel {
  const historic = input.historicDiscountPct ?? 0;
  const nearby = input.nearbyDiscountPct ?? 0;
  const confidence = input.confidence ?? 0;
  const freshEnough = input.freshnessLabel === 'fresh' || input.freshnessLabel === 'aging';

  if (historic >= 15 && nearby >= 0 && confidence >= 0.6 && freshEnough) return 'real_deal';
  if (historic >= 5 && confidence >= 0.4 && freshEnough) return 'fair_discount';
  if (confidence <= 0) return 'unknown';
  return 'not_really_a_deal';
}
