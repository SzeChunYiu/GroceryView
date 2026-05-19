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

export type NotificationType =
  | 'target_price'
  | 'favorite_store_deal'
  | 'budget_alert'
  | 'weekly_report'
  | 'receipt_summary'
  | 'stock_up_opportunity';

export type NotificationChannel = 'push' | 'email';

export type NotificationPreferences = {
  channels: NotificationChannel[];
  enabledTypes: NotificationType[];
  quietHours?: {
    startHour: number;
    endHour: number;
    timezone: string;
  };
};

export type NotificationEvent = {
  type: NotificationType;
  title: string;
  body: string;
  priority: 'normal' | 'high';
};

export type PlannedNotification = NotificationEvent & {
  channel: NotificationChannel;
  sendAt: string;
};

function isQuietHour(date: Date, quietHours: NonNullable<NotificationPreferences['quietHours']>): boolean {
  void quietHours.timezone;
  const hour = date.getUTCHours();
  if (quietHours.startHour <= quietHours.endHour) return hour >= quietHours.startHour && hour < quietHours.endHour;
  return hour >= quietHours.startHour || hour < quietHours.endHour;
}

function nextQuietEnd(date: Date, quietHours: NonNullable<NotificationPreferences['quietHours']>): string {
  const sendAt = new Date(date);
  if (date.getUTCHours() >= quietHours.startHour) sendAt.setUTCDate(sendAt.getUTCDate() + 1);
  sendAt.setUTCHours(quietHours.endHour, 0, 0, 0);
  return sendAt.toISOString();
}

export function planNotifications(input: {
  now: string;
  preferences: NotificationPreferences;
  events: NotificationEvent[];
}): PlannedNotification[] {
  const now = new Date(input.now);
  const enabled = new Set(input.preferences.enabledTypes);
  const planned: PlannedNotification[] = [];

  for (const event of input.events) {
    if (!enabled.has(event.type)) continue;
    const inQuietHours = input.preferences.quietHours ? isQuietHour(now, input.preferences.quietHours) : false;
    const sendAt = inQuietHours && event.priority !== 'high' && input.preferences.quietHours ? nextQuietEnd(now, input.preferences.quietHours) : now.toISOString();
    for (const channel of input.preferences.channels) {
      planned.push({ ...event, channel, sendAt });
    }
  }

  return planned;
}

export type ProductMatchInput = {
  id: string;
  barcode?: string;
  brand: string;
  category: string;
  packageSize: number;
  packageUnit: string;
  brandTier: BrandTier;
  unitPrice?: number;
};

export type MatchMode = 'exact' | 'equivalent' | 'smart_swap' | 'not_recommended';
export type MatchConfidence = 'high' | 'medium' | 'medium-low' | 'low';
export type QualityRisk = 'low' | 'medium' | 'high';

export type ProductMatchResult = {
  mode: MatchMode;
  confidence: MatchConfidence;
  qualityRisk: QualityRisk;
  reason: string;
};

const highConfidenceCategories = new Set(['pasta', 'rice', 'sugar', 'flour', 'milk']);
const mediumConfidenceCategories = new Set(['coffee', 'butter', 'yogurt', 'toilet_paper']);
const lowConfidenceCategories = new Set(['meat', 'fish', 'fruit', 'vegetables']);
const doNotAutoSubstituteCategories = new Set(['baby_formula', 'medical_diet', 'pet_food_sensitive']);

function samePackage(a: ProductMatchInput, b: ProductMatchInput): boolean {
  return a.packageUnit.toLowerCase() === b.packageUnit.toLowerCase() && Math.abs(a.packageSize - b.packageSize) <= Math.max(1, a.packageSize * 0.05);
}

function confidenceForCategory(category: string): MatchConfidence {
  if (highConfidenceCategories.has(category)) return 'high';
  if (mediumConfidenceCategories.has(category)) return 'medium';
  if (lowConfidenceCategories.has(category)) return 'low';
  return 'medium-low';
}

function riskForConfidence(confidence: MatchConfidence): QualityRisk {
  if (confidence === 'high') return 'low';
  if (confidence === 'medium') return 'medium';
  return 'high';
}

export function classifyProductMatch(input: { source: ProductMatchInput; candidate: ProductMatchInput }): ProductMatchResult {
  const { source, candidate } = input;
  if (source.barcode && candidate.barcode && source.barcode === candidate.barcode && samePackage(source, candidate)) {
    return { mode: 'exact', confidence: 'high', qualityRisk: 'low', reason: 'Barcode and package size match.' };
  }

  if (source.category !== candidate.category) {
    return { mode: 'not_recommended', confidence: 'low', qualityRisk: 'high', reason: 'Different categories are not comparable.' };
  }

  if (doNotAutoSubstituteCategories.has(source.category)) {
    return { mode: 'not_recommended', confidence: 'low', qualityRisk: 'high', reason: 'Category should not be auto-substituted.' };
  }

  if (samePackage(source, candidate)) {
    const confidence = confidenceForCategory(source.category);
    return { mode: 'equivalent', confidence, qualityRisk: riskForConfidence(confidence), reason: 'Same category and comparable package size.' };
  }

  return { mode: 'not_recommended', confidence: 'low', qualityRisk: 'high', reason: 'Package sizes are not comparable.' };
}

export type SmartSwapInput = {
  source: ProductMatchInput & { unitPrice: number };
  candidates: Array<ProductMatchInput & { unitPrice: number }>;
  acceptPrivateLabel: 'yes' | 'no' | 'maybe';
  minimumSavingsPercent: number;
};

export type SmartSwapRecommendation = {
  productId: string;
  savingsPercent: number;
  confidence: MatchConfidence;
  qualityRisk: QualityRisk;
  reason: string;
};

function isPrivateLabel(tier: BrandTier): boolean {
  return tier === 'standard_private_label' || tier === 'budget_private_label' || tier === 'organic_private_label' || tier === 'discount_chain_label';
}

export function recommendSmartSwaps(input: SmartSwapInput): SmartSwapRecommendation[] {
  if (input.acceptPrivateLabel === 'no') return [];
  const recommendations: SmartSwapRecommendation[] = [];

  for (const candidate of input.candidates) {
    if (isPrivateLabel(candidate.brandTier) && input.acceptPrivateLabel === 'maybe' && candidate.brandTier === 'budget_private_label') continue;
    const match = classifyProductMatch({ source: input.source, candidate });
    if (match.mode === 'not_recommended') continue;
    const savingsPercent = Math.round(((input.source.unitPrice - candidate.unitPrice) / input.source.unitPrice) * 10000) / 100;
    if (savingsPercent < input.minimumSavingsPercent) continue;
    recommendations.push({
      productId: candidate.id,
      savingsPercent,
      confidence: match.confidence,
      qualityRisk: match.qualityRisk,
      reason: match.reason
    });
  }

  return recommendations.sort((a, b) => b.savingsPercent - a.savingsPercent);
}

export type ReceiptRowInput = {
  rawName: string;
  quantity: number;
  itemTotal: number;
};

export type ReceiptScanInput = {
  storeId: string;
  purchasedAt: string;
  totalAmount: number;
  ocrConfidence: number;
  rows: ReceiptRowInput[];
};

export type ReceiptAlias = {
  rawName: string;
  productId: string;
  canonicalName: string;
  matchConfidence: number;
};

export type ReceiptReviewInput = {
  receipt: ReceiptScanInput;
  aliases: ReceiptAlias[];
  localMedians: Record<string, number>;
  weeklyBudget: number;
  weekSpendBeforeReceipt: number;
};

export type ReceiptReviewItem = {
  rawName: string;
  productId: string | null;
  canonicalName: string | null;
  itemTotal: number;
  matchConfidence: number;
  deltaVsMedian: number;
};

export type ReceiptReview = {
  storeId: string;
  purchasedAt: string;
  confidenceLabel: 'high' | 'medium-high' | 'medium' | 'low';
  matchedItems: ReceiptReviewItem[];
  goodBuys: ReceiptReviewItem[];
  overspend: ReceiptReviewItem[];
  comparedWithLocalMedianDelta: number;
  budget: {
    weeklyBudget: number;
    beforeReceiptSpend: number;
    afterReceiptSpend: number;
    remaining: number;
    status: 'under' | 'over';
  };
};

function confidenceLabel(confidence: number): ReceiptReview['confidenceLabel'] {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.75) return 'medium-high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

export function reviewReceiptScan(input: ReceiptReviewInput): ReceiptReview {
  const aliasesByRaw = new Map(input.aliases.map((alias) => [alias.rawName.toLowerCase(), alias]));
  const matchedItems = input.receipt.rows.map((row) => {
    const alias = aliasesByRaw.get(row.rawName.toLowerCase());
    const median = alias ? input.localMedians[alias.productId] : undefined;
    return {
      rawName: row.rawName,
      productId: alias?.productId ?? null,
      canonicalName: alias?.canonicalName ?? null,
      itemTotal: row.itemTotal,
      matchConfidence: alias?.matchConfidence ?? 0,
      deltaVsMedian: median === undefined ? 0 : Math.round((row.itemTotal - median) * 100) / 100
    };
  });
  const comparedWithLocalMedianDelta = Math.round(matchedItems.reduce((sum, item) => sum + item.deltaVsMedian, 0) * 100) / 100;
  const afterReceiptSpend = Math.round((input.weekSpendBeforeReceipt + input.receipt.totalAmount) * 100) / 100;
  const remaining = Math.round((input.weeklyBudget - afterReceiptSpend) * 100) / 100;

  return {
    storeId: input.receipt.storeId,
    purchasedAt: input.receipt.purchasedAt,
    confidenceLabel: confidenceLabel(input.receipt.ocrConfidence),
    matchedItems,
    goodBuys: matchedItems.filter((item) => item.productId !== null && item.deltaVsMedian < 0),
    overspend: matchedItems.filter((item) => item.productId !== null && item.deltaVsMedian > 0),
    comparedWithLocalMedianDelta,
    budget: {
      weeklyBudget: input.weeklyBudget,
      beforeReceiptSpend: input.weekSpendBeforeReceipt,
      afterReceiptSpend,
      remaining,
      status: remaining >= 0 ? 'under' : 'over'
    }
  };
}
