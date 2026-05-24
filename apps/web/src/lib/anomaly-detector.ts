export type PriceAnomalyInput = {
  productId: string;
  productName: string;
  currentPrice: number;
  previousPrice?: number | null;
  recentPrices?: number[];
};

export type PriceAnomaly = PriceAnomalyInput & {
  requiresHumanVerification: true;
  reasons: string[];
  changePercent?: number;
  zScore?: number;
};

export type PriceAnomalyOptions = {
  maxSwingPercent?: number;
  maxZScore?: number;
  minBaselinePrices?: number;
};

const DEFAULT_MAX_SWING_PERCENT = 75;
const DEFAULT_MAX_Z_SCORE = 3;
const DEFAULT_MIN_BASELINE_PRICES = 3;

export function detectPriceAnomalies(
  products: PriceAnomalyInput[],
  options: PriceAnomalyOptions = {},
): PriceAnomaly[] {
  const maxSwingPercent = options.maxSwingPercent ?? DEFAULT_MAX_SWING_PERCENT;
  const maxZScore = options.maxZScore ?? DEFAULT_MAX_Z_SCORE;
  const minBaselinePrices = options.minBaselinePrices ?? DEFAULT_MIN_BASELINE_PRICES;

  return products.flatMap((product) => {
    const reasons: string[] = [];
    const baseline = buildBaseline(product.previousPrice, product.recentPrices);
    const latest = product.currentPrice;

    if (!Number.isFinite(latest) || latest <= 0) {
      reasons.push('Current price is missing or invalid.');
    }

    const previous = product.previousPrice;
    let changePercent: number | undefined;
    if (typeof previous === 'number' && Number.isFinite(previous) && previous > 0) {
      changePercent = ((latest - previous) / previous) * 100;
      if (Math.abs(changePercent) >= maxSwingPercent) {
        reasons.push(`Price changed by ${formatPercent(changePercent)} since the previous ingest.`);
      }
    }

    let zScore: number | undefined;
    if (baseline.length >= minBaselinePrices && Number.isFinite(latest)) {
      const stats = summarize(baseline);
      if (stats.standardDeviation > 0) {
        zScore = (latest - stats.mean) / stats.standardDeviation;
        if (Math.abs(zScore) >= maxZScore) {
          reasons.push(`Price is ${zScore.toFixed(1)} standard deviations from the recent baseline.`);
        }
      }
    }

    if (reasons.length === 0) {
      return [];
    }

    return [{ ...product, requiresHumanVerification: true, reasons, changePercent, zScore }];
  });
}

function buildBaseline(previousPrice?: number | null, recentPrices: number[] = []): number[] {
  return [previousPrice, ...recentPrices].filter(
    (price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0,
  );
}

function summarize(values: number[]): { mean: number; standardDeviation: number } {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return { mean, standardDeviation: Math.sqrt(variance) };
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(0)}%`;
}
