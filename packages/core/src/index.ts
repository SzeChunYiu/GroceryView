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

export type BrandTier = 'national' | 'premium' | 'standard_private_label' | 'budget_private_label' | 'organic_private_label' | 'discount_chain_label';

export type SearchableProduct = {
  id: string;
  ticker: string;
  name: string;
  category: string;
  brandTier: BrandTier;
  availableChains: string[];
};

export function searchProducts(products: SearchableProduct[], query: string): SearchableProduct[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) return products;

  return products.filter((product) => {
    const haystack = [product.ticker, product.name, product.category, product.brandTier, ...product.availableChains]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export type WatchlistItem = {
  productId: string;
  targetPrice?: number;
  alertDealScoreAt?: number;
  favoriteStoresOnly: boolean;
};

export type WatchlistProductSnapshot = {
  productId: string;
  productName: string;
  bestPrice: number;
  bestStoreId: string;
  dealScore: number;
  isNew52WeekLow: boolean;
};

export type WatchlistAlert = {
  productId: string;
  productName: string;
  type: 'target_price' | 'deal_score' | 'new_52_week_low';
  message: string;
};

const formatSek = (value: number): string => `${value.toFixed(2)} SEK`;
const storeNameFromId = (storeId: string): string =>
  storeId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function buildWatchlistAlerts(input: {
  watchlist: WatchlistItem[];
  products: WatchlistProductSnapshot[];
  favoriteStoreIds: string[];
}): WatchlistAlert[] {
  const productById = new Map(input.products.map((product) => [product.productId, product]));
  const favoriteStoreSet = new Set(input.favoriteStoreIds);
  const alerts: WatchlistAlert[] = [];

  for (const item of input.watchlist) {
    const product = productById.get(item.productId);
    if (!product) continue;
    if (item.favoriteStoresOnly && !favoriteStoreSet.has(product.bestStoreId)) continue;

    if (item.targetPrice !== undefined && product.bestPrice <= item.targetPrice) {
      alerts.push({
        productId: product.productId,
        productName: product.productName,
        type: 'target_price',
        message: `${product.productName} is ${formatSek(product.bestPrice)} at ${storeNameFromId(product.bestStoreId)}, below your ${formatSek(item.targetPrice)} target.`
      });
    }

    if (item.alertDealScoreAt !== undefined && product.dealScore >= item.alertDealScoreAt) {
      alerts.push({
        productId: product.productId,
        productName: product.productName,
        type: 'deal_score',
        message: `${product.productName} has Deal Score ${product.dealScore}, meeting your ${item.alertDealScoreAt}+ alert.`
      });
    }

    if (product.isNew52WeekLow) {
      alerts.push({
        productId: product.productId,
        productName: product.productName,
        type: 'new_52_week_low',
        message: `${product.productName} is at a new 52-week low.`
      });
    }
  }

  return alerts;
}

export type BudgetInput = {
  weeklyBudget: number;
  monthlyBudget: number;
  estimatedBasketTotal: number;
  receiptTotalsThisWeek: number[];
  receiptTotalsThisMonth: number[];
};

export type BudgetSummary = {
  weeklyBudget: number;
  monthlyBudget: number;
  estimatedBasketTotal: number;
  weeklyActualSpend: number;
  monthlyActualSpend: number;
  weeklyRemainingAfterEstimate: number;
  weeklyRemainingActual: number;
  monthlyRemainingActual: number;
  weeklyStatus: 'under' | 'over';
  monthlyStatus: 'under' | 'over';
};

export function summarizeBudget(input: BudgetInput): BudgetSummary {
  const weeklyActualSpend = roundMoney(input.receiptTotalsThisWeek.reduce((sum, value) => sum + value, 0));
  const monthlyActualSpend = roundMoney(input.receiptTotalsThisMonth.reduce((sum, value) => sum + value, 0));
  const weeklyRemainingAfterEstimate = roundMoney(input.weeklyBudget - input.estimatedBasketTotal);
  const weeklyRemainingActual = roundMoney(input.weeklyBudget - weeklyActualSpend);
  const monthlyRemainingActual = roundMoney(input.monthlyBudget - monthlyActualSpend);

  return {
    weeklyBudget: input.weeklyBudget,
    monthlyBudget: input.monthlyBudget,
    estimatedBasketTotal: input.estimatedBasketTotal,
    weeklyActualSpend,
    monthlyActualSpend,
    weeklyRemainingAfterEstimate,
    weeklyRemainingActual,
    monthlyRemainingActual,
    weeklyStatus: weeklyRemainingActual >= 0 ? 'under' : 'over',
    monthlyStatus: monthlyRemainingActual >= 0 ? 'under' : 'over'
  };
}
