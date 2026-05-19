export type DealScoreInput = {
  currentCityPercentile: number;
  knownPromoHistoryPercentile: number;
  equivalentUnitPricePercentile: number;
  discountDepthPercent: number;
  sourceConfidence: number;
  sponsoredPlacement?: boolean;
};

export type ScoreBand = {
  label: 'Excellent deal' | 'Good deal' | 'Fair deal' | 'Normal price' | 'Not a real deal';
  verdict: 'Buy now' | 'Buy' | 'Compare' | 'Normal' | 'Wait';
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateDealScore(input: DealScoreInput): number {
  const currentCityStrength = 100 - clamp(input.currentCityPercentile, 0, 100);
  const promoHistoryStrength = 100 - clamp(input.knownPromoHistoryPercentile, 0, 100);
  const equivalentStrength = 100 - clamp(input.equivalentUnitPricePercentile, 0, 100);
  const discountStrength = clamp(input.discountDepthPercent, 0, 100);
  const confidenceStrength = clamp(input.sourceConfidence, 0, 1) * 100;

  // Sponsored placement is intentionally ignored: ads must never affect deal score.
  void input.sponsoredPlacement;

  return Math.round(
    currentCityStrength * 0.4 +
      promoHistoryStrength * 0.25 +
      equivalentStrength * 0.2 +
      discountStrength * 0.1 +
      confidenceStrength * 0.05
  );
}

export function scoreBand(score: number): ScoreBand {
  const normalized = clamp(score, 0, 100);
  if (normalized >= 90) return { label: 'Excellent deal', verdict: 'Buy now' };
  if (normalized >= 75) return { label: 'Good deal', verdict: 'Buy' };
  if (normalized >= 60) return { label: 'Fair deal', verdict: 'Compare' };
  if (normalized >= 40) return { label: 'Normal price', verdict: 'Normal' };
  return { label: 'Not a real deal', verdict: 'Wait' };
}

export type StorePrice = {
  storeId: string;
  storeName: string;
  price: number;
  distanceKm?: number;
};

export type BasketInputItem = {
  productId: string;
  quantity: number;
  prices: StorePrice[];
};

export type BasketComparisonInput = {
  favoriteStoreIds: string[];
  items: BasketInputItem[];
};

export type BasketAssignment = {
  productId: string;
  storeId: string;
  storeName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type BasketStrategy = {
  total: number;
  assignments: BasketAssignment[];
};

export type SingleStoreOption = {
  storeId: string;
  storeName: string;
  total: number;
  itemCount: number;
};

export type BasketComparisonResult = {
  cheapestByProduct: BasketStrategy;
  singleStoreOptions: SingleStoreOption[];
  missingProductIds: string[];
};

export function compareBasketStrategies(input: BasketComparisonInput): BasketComparisonResult {
  const favoriteSet = new Set(input.favoriteStoreIds);
  const missingProductIds: string[] = [];
  const assignments: BasketAssignment[] = [];
  const storeTotals = new Map<string, SingleStoreOption>();

  for (const item of input.items) {
    const eligiblePrices = item.prices.filter((price) => favoriteSet.has(price.storeId));
    if (eligiblePrices.length === 0) {
      missingProductIds.push(item.productId);
      continue;
    }

    for (const price of eligiblePrices) {
      const current = storeTotals.get(price.storeId) ?? {
        storeId: price.storeId,
        storeName: price.storeName,
        total: 0,
        itemCount: 0
      };
      current.total = roundMoney(current.total + price.price * item.quantity);
      current.itemCount += 1;
      storeTotals.set(price.storeId, current);
    }

    const cheapest = eligiblePrices.reduce((best, candidate) =>
      candidate.price < best.price ? candidate : best
    );
    assignments.push({
      productId: item.productId,
      storeId: cheapest.storeId,
      storeName: cheapest.storeName,
      quantity: item.quantity,
      unitPrice: cheapest.price,
      lineTotal: roundMoney(cheapest.price * item.quantity)
    });
  }

  return {
    cheapestByProduct: {
      total: roundMoney(assignments.reduce((sum, item) => sum + item.lineTotal, 0)),
      assignments
    },
    singleStoreOptions: [...storeTotals.values()].sort((a, b) => a.total - b.total),
    missingProductIds
  };
}

export type IndexComponent = {
  productId: string;
  baseUnitPrice: number;
  currentUnitPrice: number;
  weight: number;
};

export type FixedBasketIndexInput = {
  id: string;
  label: string;
  baseDate: string;
  currentDate: string;
  components: IndexComponent[];
};

export type FixedBasketIndex = {
  id: string;
  label: string;
  baseDate: string;
  currentDate: string;
  value: number;
  movementPercent: number;
  confidence: 'low' | 'medium' | 'high';
  components: IndexComponent[];
};

export function calculateFixedBasketIndex(input: FixedBasketIndexInput): FixedBasketIndex {
  if (input.components.length === 0) {
    throw new Error('At least one component is required to calculate an index.');
  }
  const base = input.components.reduce((sum, component) => sum + component.baseUnitPrice * component.weight, 0);
  const current = input.components.reduce((sum, component) => sum + component.currentUnitPrice * component.weight, 0);
  if (base <= 0) throw new Error('Base basket value must be positive.');
  const value = roundMoney((current / base) * 100);

  return {
    id: input.id,
    label: input.label,
    baseDate: input.baseDate,
    currentDate: input.currentDate,
    value,
    movementPercent: roundMoney(value - 100),
    confidence: input.components.length >= 5 ? 'high' : input.components.length >= 2 ? 'medium' : 'low',
    components: input.components
  };
}
