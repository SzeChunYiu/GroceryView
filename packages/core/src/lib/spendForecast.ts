export type PurchaseHistoryEntry = {
  purchasedAt: string;
  total: number;
};

export type GrocerySpendForecast = {
  forecastMonth: string;
  predictedSpend: number;
  lowerBound: number;
  upperBound: number;
  monthsUsed: number;
  confidence: 'low' | 'medium' | 'high';
  basis: Array<{ month: string; spend: number }>;
};

export function forecastNextMonthlyGrocerySpend(
  purchaseHistory: readonly PurchaseHistoryEntry[],
  forecastMonth: string
): GrocerySpendForecast {
  const monthly = groupMonthlySpend(purchaseHistory)
    .filter((row) => row.month < forecastMonth)
    .slice(-6);
  const spends = monthly.map((row) => row.spend);
  const average = spends.length ? spends.reduce((sum, spend) => sum + spend, 0) / spends.length : 0;
  const trend = spends.length >= 2 ? (spends.at(-1)! - spends[0]!) / (spends.length - 1) : 0;
  const predictedSpend = roundMoney(Math.max(0, average + trend));
  const spread = monthlyStandardDeviation(spends);
  const confidence = spends.length >= 6 ? 'high' : spends.length >= 3 ? 'medium' : 'low';

  return {
    forecastMonth,
    predictedSpend,
    lowerBound: roundMoney(Math.max(0, predictedSpend - spread)),
    upperBound: roundMoney(predictedSpend + spread),
    monthsUsed: monthly.length,
    confidence,
    basis: monthly
  };
}

function groupMonthlySpend(purchaseHistory: readonly PurchaseHistoryEntry[]) {
  const totals = new Map<string, number>();
  for (const entry of purchaseHistory) {
    if (!Number.isFinite(entry.total) || entry.total < 0) continue;
    const month = entry.purchasedAt.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    totals.set(month, (totals.get(month) ?? 0) + entry.total);
  }
  return [...totals.entries()]
    .map(([month, spend]) => ({ month, spend: roundMoney(spend) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function monthlyStandardDeviation(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
