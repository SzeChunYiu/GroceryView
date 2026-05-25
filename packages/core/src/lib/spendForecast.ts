export type GroceryPurchaseHistoryRow = {
  purchasedAt: string;
  totalSpend: number;
  storeId?: string;
  receiptId?: string;
};

export type GrocerySpendForecastInput = {
  purchase_history: GroceryPurchaseHistoryRow[];
  asOf?: string;
  forecastMonth?: string;
};

export type GrocerySpendForecastConfidence = 'high' | 'medium' | 'low';

export type GrocerySpendForecastMonth = {
  month: string;
  spend: number;
  receiptCount: number;
};

export type GrocerySpendForecast = {
  forecastMonth: string;
  predictedSpend: number;
  baselineMonthlySpend: number;
  trendPercent: number;
  confidence: GrocerySpendForecastConfidence;
  observedMonths: number;
  observedSpend: number;
  monthSummaries: GrocerySpendForecastMonth[];
  warnings: string[];
};

const MONTH_MS = 31 * 24 * 60 * 60 * 1000;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addMonths(month: string, count: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, monthNumber - 1 + count, 1));
  return monthKey(next);
}

function confidenceFor(observedMonths: number, receiptCount: number): GrocerySpendForecastConfidence {
  if (observedMonths >= 4 && receiptCount >= 8) return 'high';
  if (observedMonths >= 2 && receiptCount >= 3) return 'medium';
  return 'low';
}

function linearTrend(months: GrocerySpendForecastMonth[]): number {
  if (months.length < 2) return 0;
  const xs = months.map((_, index) => index);
  const ys = months.map((month) => month.spend);
  const xMean = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const yMean = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const denominator = xs.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  if (denominator === 0) return 0;
  const numerator = xs.reduce((sum, value, index) => sum + (value - xMean) * (ys[index] - yMean), 0);
  return numerator / denominator;
}

export function forecastGrocerySpend(input: GrocerySpendForecastInput): GrocerySpendForecast {
  const asOf = input.asOf ? new Date(input.asOf) : new Date();
  if (Number.isNaN(asOf.getTime())) throw new Error('asOf must be an ISO date.');

  const warnings: string[] = [];
  const monthTotals = new Map<string, { spend: number; receiptCount: number }>();
  for (const row of input.purchase_history) {
    const purchasedAt = new Date(row.purchasedAt);
    if (Number.isNaN(purchasedAt.getTime())) {
      warnings.push(`Skipped purchase with invalid purchasedAt: ${row.purchasedAt}`);
      continue;
    }
    if (purchasedAt.getTime() > asOf.getTime()) continue;
    if (!Number.isFinite(row.totalSpend) || row.totalSpend < 0) {
      warnings.push(`Skipped purchase with invalid totalSpend: ${row.receiptId ?? row.purchasedAt}`);
      continue;
    }
    const key = monthKey(purchasedAt);
    const current = monthTotals.get(key) ?? { spend: 0, receiptCount: 0 };
    monthTotals.set(key, {
      spend: current.spend + row.totalSpend,
      receiptCount: current.receiptCount + 1
    });
  }

  const monthSummaries = Array.from(monthTotals.entries())
    .map(([month, summary]) => ({
      month,
      spend: roundMoney(summary.spend),
      receiptCount: summary.receiptCount
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const observedMonths = monthSummaries.length;
  const observedSpend = roundMoney(monthSummaries.reduce((sum, month) => sum + month.spend, 0));
  const observedReceiptCount = monthSummaries.reduce((sum, month) => sum + month.receiptCount, 0);
  const forecastMonth = input.forecastMonth ?? addMonths(monthKey(asOf), 1);

  if (observedMonths === 0) {
    return {
      forecastMonth,
      predictedSpend: 0,
      baselineMonthlySpend: 0,
      trendPercent: 0,
      confidence: 'low',
      observedMonths: 0,
      observedSpend: 0,
      monthSummaries: [],
      warnings: ['No purchase_history rows were available before asOf.']
    };
  }

  const recentMonths = monthSummaries.slice(-3);
  const baselineMonthlySpend = recentMonths.reduce((sum, month) => sum + month.spend, 0) / recentMonths.length;
  const slope = linearTrend(monthSummaries.slice(-6));
  const trendedSpend = monthSummaries[monthSummaries.length - 1].spend + slope;
  const predictedSpend = Math.max(0, baselineMonthlySpend * 0.65 + trendedSpend * 0.35);
  const trendPercent = baselineMonthlySpend > 0 ? ((predictedSpend - baselineMonthlySpend) / baselineMonthlySpend) * 100 : 0;
  const oldestObserved = new Date(`${monthSummaries[0].month}-01T00:00:00.000Z`);
  if (asOf.getTime() - oldestObserved.getTime() < MONTH_MS * 2) {
    warnings.push('Forecast is based on less than two calendar months of purchase_history.');
  }

  return {
    forecastMonth,
    predictedSpend: roundMoney(predictedSpend),
    baselineMonthlySpend: roundMoney(baselineMonthlySpend),
    trendPercent: roundPercent(trendPercent),
    confidence: confidenceFor(observedMonths, observedReceiptCount),
    observedMonths,
    observedSpend,
    monthSummaries,
    warnings
  };
}
