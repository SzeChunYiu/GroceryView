export type GreedflationRetailPriceObservation = {
  chainId: string;
  observedAt: string | Date;
  price: number;
  productId: string;
};

export type GreedflationSupplierCostObservation = {
  cost: number;
  observedAt: string | Date;
  proxyId: string;
  proxyLabel: string;
  productId: string;
};

export type GreedflationDetectorInput = {
  retailPrices: readonly GreedflationRetailPriceObservation[];
  supplierCosts: readonly GreedflationSupplierCostObservation[];
  minRetailIncreasePercent?: number;
  thresholdSpreadPercent?: number;
};

export type GreedflationSignal = {
  chainId: string;
  productId: string;
  proxyId: string;
  proxyLabel: string;
  retailStartPrice: number;
  retailEndPrice: number;
  supplierStartCost: number;
  supplierEndCost: number;
  retailGrowthPercent: number;
  supplierGrowthPercent: number;
  unexplainedSpreadPercent: number;
  evidenceWindow: string;
  methodology: string;
  transparentFlag: true;
};

const DEFAULT_THRESHOLD_SPREAD_PERCENT = 5;
const DEFAULT_MIN_RETAIL_INCREASE_PERCENT = 3;

export const greedflationMethodology = [
  'Compare the first and latest observed retail shelf price for each chain/product pair.',
  'Compare the first and latest supplier-cost proxy for the same product over the same evidence window.',
  'Flag only when retail growth is positive and exceeds supplier proxy growth by the configured spread threshold.',
  'Treat every output as an audit lead, not proof of illegal conduct; taxes, logistics, shrink, contracts, and mix changes can explain part of the spread.'
] as const;

function toDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function growthPercent(start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0) return null;
  return ((end - start) / start) * 100;
}

function rounded(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function productWindow<T extends { observedAt: string | Date }>(rows: readonly T[]) {
  const ordered = rows
    .map((row) => ({ row, observedAt: toDate(row.observedAt) }))
    .filter((entry): entry is { row: T; observedAt: Date } => entry.observedAt !== null)
    .sort((left, right) => left.observedAt.getTime() - right.observedAt.getTime());

  const first = ordered[0];
  const latest = ordered.at(-1);
  return first && latest ? { first, latest } : null;
}

export function detectGreedflationSignals({
  retailPrices,
  supplierCosts,
  minRetailIncreasePercent = DEFAULT_MIN_RETAIL_INCREASE_PERCENT,
  thresholdSpreadPercent = DEFAULT_THRESHOLD_SPREAD_PERCENT
}: GreedflationDetectorInput): GreedflationSignal[] {
  const supplierByProduct = new Map<string, GreedflationSupplierCostObservation[]>();
  for (const cost of supplierCosts) {
    if (!cost.productId || !Number.isFinite(cost.cost) || cost.cost <= 0) continue;
    supplierByProduct.set(cost.productId, [...(supplierByProduct.get(cost.productId) ?? []), cost]);
  }

  const retailByChainProduct = new Map<string, GreedflationRetailPriceObservation[]>();
  for (const price of retailPrices) {
    if (!price.productId || !price.chainId || !Number.isFinite(price.price) || price.price <= 0) continue;
    const key = `${price.chainId}::${price.productId}`;
    retailByChainProduct.set(key, [...(retailByChainProduct.get(key) ?? []), price]);
  }

  return [...retailByChainProduct.entries()]
    .flatMap(([key, rows]) => {
      const retailWindow = productWindow(rows);
      const [chainId, productId] = key.split('::');
      const supplierWindow = productWindow(supplierByProduct.get(productId) ?? []);
      if (!retailWindow || !supplierWindow || !chainId || !productId) return [];

      const retailGrowth = growthPercent(retailWindow.first.row.price, retailWindow.latest.row.price);
      const supplierGrowth = growthPercent(supplierWindow.first.row.cost, supplierWindow.latest.row.cost);
      if (retailGrowth === null || supplierGrowth === null) return [];

      const spread = retailGrowth - supplierGrowth;
      if (retailGrowth < minRetailIncreasePercent || spread < thresholdSpreadPercent) return [];

      return [{
        chainId,
        productId,
        proxyId: supplierWindow.latest.row.proxyId,
        proxyLabel: supplierWindow.latest.row.proxyLabel,
        retailStartPrice: retailWindow.first.row.price,
        retailEndPrice: retailWindow.latest.row.price,
        supplierStartCost: supplierWindow.first.row.cost,
        supplierEndCost: supplierWindow.latest.row.cost,
        retailGrowthPercent: rounded(retailGrowth),
        supplierGrowthPercent: rounded(supplierGrowth),
        unexplainedSpreadPercent: rounded(spread),
        evidenceWindow: `${retailWindow.first.observedAt.toISOString().slice(0, 10)} → ${retailWindow.latest.observedAt.toISOString().slice(0, 10)}`,
        methodology: greedflationMethodology.join(' '),
        transparentFlag: true as const
      }];
    })
    .sort((left, right) => right.unexplainedSpreadPercent - left.unexplainedSpreadPercent || left.chainId.localeCompare(right.chainId));
}
