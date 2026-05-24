export type GreedflationInputRow = {
  chainId: string;
  productId: string;
  retailStart: number;
  retailEnd: number;
  supplierCostProxyStart: number;
  supplierCostProxyEnd: number;
};

export type GreedflationFlag = {
  chainId: string;
  productId: string;
  retailChangePercent: number;
  supplierCostProxyChangePercent: number;
  excessMarginTrendPercent: number;
  flagged: boolean;
};

function percentChange(start: number, end: number): number {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0) return 0;
  return Math.round(((end - start) / start) * 10_000) / 100;
}

export function detectGreedflation(input: { rows: readonly GreedflationInputRow[]; thresholdPercent?: number }): GreedflationFlag[] {
  const threshold = input.thresholdPercent ?? 5;
  return input.rows.map((row) => {
    const retailChangePercent = percentChange(row.retailStart, row.retailEnd);
    const supplierCostProxyChangePercent = percentChange(row.supplierCostProxyStart, row.supplierCostProxyEnd);
    const excessMarginTrendPercent = Math.round((retailChangePercent - supplierCostProxyChangePercent) * 100) / 100;
    return {
      chainId: row.chainId,
      productId: row.productId,
      retailChangePercent,
      supplierCostProxyChangePercent,
      excessMarginTrendPercent,
      flagged: excessMarginTrendPercent >= threshold
    };
  }).sort((left, right) => right.excessMarginTrendPercent - left.excessMarginTrendPercent || left.chainId.localeCompare(right.chainId));
}
