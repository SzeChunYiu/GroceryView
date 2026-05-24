export const HISTORICAL_LIST_BASELINE = {
  itemCount: 12,
  spendSek: 420
} as const;

export type BudgetImpactEstimate = {
  averageItemSpend: number;
  estimatedSpend: number;
  spendDrift: number;
  driftPercent: number;
  status: 'under' | 'on-track' | 'over';
  summary: string;
};

function roundedSek(value: number) {
  return Math.round(value);
}

function formatSignedSek(value: number) {
  const rounded = roundedSek(value);
  if (rounded === 0) return '±0 kr';
  return `${rounded > 0 ? '+' : '-'}${Math.abs(rounded)} kr`;
}

export function estimateListBudgetImpact(totalItems: number): BudgetImpactEstimate {
  const safeTotalItems = Math.max(0, Math.floor(totalItems));
  const averageItemSpend = HISTORICAL_LIST_BASELINE.spendSek / HISTORICAL_LIST_BASELINE.itemCount;
  const estimatedSpend = roundedSek(safeTotalItems * averageItemSpend);
  const spendDrift = estimatedSpend - HISTORICAL_LIST_BASELINE.spendSek;
  const driftPercent = HISTORICAL_LIST_BASELINE.spendSek > 0
    ? Math.round((spendDrift / HISTORICAL_LIST_BASELINE.spendSek) * 100)
    : 0;
  const status = spendDrift > 0 ? 'over' : spendDrift < 0 ? 'under' : 'on-track';
  const summary = `${formatSignedSek(spendDrift)} vs historical ${HISTORICAL_LIST_BASELINE.itemCount}-item baseline`;

  return {
    averageItemSpend,
    estimatedSpend,
    spendDrift,
    driftPercent,
    status,
    summary
  };
}
