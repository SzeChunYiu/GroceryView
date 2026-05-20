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

export type PriceHistorySourceType = 'shelf' | 'online' | 'flyer' | 'member' | 'receipt' | 'shelf_photo' | 'manual' | 'estimated';

export type PriceHistoryPoint = {
  observedAt: string;
  price: number;
  sourceType: PriceHistorySourceType;
  confidence: number;
};

export type PriceHistorySummaryInput = {
  points: PriceHistoryPoint[];
  rangeDays: 30 | 90 | 365;
  sourceType: PriceHistorySourceType;
  asOf: string;
};

export type PriceHistorySummary = {
  rangeDays: 30 | 90 | 365;
  sourceType: PriceHistorySourceType;
  pointCount: number;
  low: number;
  high: number;
  average: number;
  currentPrice: number;
  currentPercentile: number;
  averageConfidence: number;
  limitedHistory: boolean;
  windowStart: string;
  windowEnd: string;
};

export function summarizePriceHistory(input: PriceHistorySummaryInput): PriceHistorySummary {
  const asOf = Date.parse(input.asOf);
  if (Number.isNaN(asOf)) throw new Error('asOf must be an ISO date.');
  const windowStartMs = asOf - input.rangeDays * 24 * 60 * 60 * 1000;
  const filtered = input.points
    .map((point) => ({ ...point, observedAtMs: Date.parse(point.observedAt) }))
    .filter((point) => point.sourceType === input.sourceType)
    .filter((point) => !Number.isNaN(point.observedAtMs))
    .filter((point) => point.observedAtMs >= windowStartMs && point.observedAtMs <= asOf)
    .sort((a, b) => a.observedAtMs - b.observedAtMs);

  if (filtered.length === 0) throw new Error('At least one price history point is required for the selected source type and range.');

  const prices = filtered.map((point) => point.price);
  if (prices.some((price) => price < 0)) throw new Error('Price history points must be non-negative.');
  const current = filtered[filtered.length - 1];
  const sortedPrices = [...prices].sort((a, b) => a - b);
  let currentRank = 0;
  for (let index = 0; index < sortedPrices.length; index += 1) {
    if (sortedPrices[index] <= current.price) currentRank = index;
  }
  const currentPercentile = sortedPrices.length === 1 ? 0 : Math.round((currentRank / (sortedPrices.length - 1)) * 100);
  const oldest = filtered[0].observedAtMs;

  return {
    rangeDays: input.rangeDays,
    sourceType: input.sourceType,
    pointCount: filtered.length,
    low: roundMoney(Math.min(...prices)),
    high: roundMoney(Math.max(...prices)),
    average: roundMoney(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    currentPrice: roundMoney(current.price),
    currentPercentile,
    averageConfidence: roundMoney(filtered.reduce((sum, point) => sum + clamp(point.confidence, 0, 1), 0) / filtered.length),
    limitedHistory: filtered.length < 2 || oldest > windowStartMs,
    windowStart: new Date(windowStartMs).toISOString(),
    windowEnd: new Date(asOf).toISOString()
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

export type ProductMatchReviewCandidate = {
  id: string;
  sourceProductId: string;
  candidateProductId: string;
  confidence: MatchConfidence;
  qualityRisk: QualityRisk;
  reason: string;
};

export type CommunityReportType = 'wrong_price' | 'missing_product' | 'wrong_product_match' | 'store_closed' | 'other';

export type CommunityReportReviewCandidate = {
  id: string;
  productId: string;
  reporterId: string;
  reportType: CommunityReportType;
  confidenceScore: number;
  createdAt: string;
};

export type CommunityReporterActivity = {
  reporterId: string;
  reportsLast24Hours: number;
  pendingReports: number;
  acceptedReportsLast30Days: number;
  rejectedReportsLast30Days: number;
};

export type CommunityReportAbuseControl = {
  reporterId: string;
  action: 'allow' | 'throttle' | 'require_manual_review' | 'suspend_reporting';
  reason: string;
};

export type HumanReviewQueueItem = {
  id: string;
  subjectType: 'product_match' | 'community_report';
  subjectId: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
};

export type HumanReviewDecision = 'approve' | 'reject' | 'needs_more_info';

export type HumanReviewWriteback = {
  action: 'approve_product_match' | 'reject_product_match' | 'accept_community_report' | 'dismiss_community_report' | 'keep_in_review';
  subjectId: string;
  reviewedByHuman: boolean;
};

export type HumanReviewDecisionResult = {
  reviewId: string;
  subjectType: HumanReviewQueueItem['subjectType'];
  subjectId: string;
  status: 'approved' | 'rejected' | 'needs_more_info';
  reviewerId: string;
  decidedAt: string;
  notes?: string;
  writeback: HumanReviewWriteback;
};

export type HumanReviewerProfile = {
  id: string;
  active: boolean;
  openAssignmentCount: number;
  maxOpenAssignments: number;
  specialties?: HumanReviewQueueItem['subjectType'][];
};

export type HumanReviewAssignmentStatus = 'assigned' | 'in_progress' | 'completed';

export type HumanReviewAssignment = {
  id: string;
  reviewId: string;
  subjectType: HumanReviewQueueItem['subjectType'];
  subjectId: string;
  priority: HumanReviewQueueItem['priority'];
  reason: string;
  assigneeId: string;
  assignedAt: string;
  dueAt: string;
  status: HumanReviewAssignmentStatus;
};

export type HumanReviewUnassignedReason = 'already_assigned' | 'no_active_reviewer_capacity';

export type HumanReviewAssignmentPlan = {
  assignments: HumanReviewAssignment[];
  unassigned: Array<{ reviewId: string; reason: HumanReviewUnassignedReason }>;
};

export type HumanReviewSlaSummary = {
  status: 'healthy' | 'attention' | 'breached';
  openAssignments: number;
  overdueAssignments: number;
  dueSoonAssignments: number;
  openByPriority: Record<HumanReviewQueueItem['priority'], number>;
  breachedReviewIds: string[];
  dueSoonReviewIds: string[];
};

export type HumanReviewOperator = {
  id: string;
  role: 'viewer' | 'moderator' | 'lead';
  active: boolean;
};

export type HumanReviewAction = 'view_queue' | 'assign_review' | 'decide_review' | 'manage_abuse_controls';

export type HumanReviewAuthorization = {
  allowed: boolean;
  reason: string;
};

export function planHumanReviewQueue(input: {
  productMatches: ProductMatchReviewCandidate[];
  communityReports: CommunityReportReviewCandidate[];
}): HumanReviewQueueItem[] {
  const queue: HumanReviewQueueItem[] = [];

  for (const match of input.productMatches) {
    if (match.confidence === 'high' && match.qualityRisk === 'low') continue;
    queue.push({
      id: `review-${match.id}`,
      subjectType: 'product_match',
      subjectId: match.id,
      priority: match.qualityRisk === 'high' || match.confidence === 'low' ? 'high' : 'medium',
      reason: `Product match ${match.sourceProductId} → ${match.candidateProductId} has ${match.confidence} confidence and ${match.qualityRisk} quality risk: ${match.reason}`
    });
  }

  for (const report of input.communityReports) {
    if (report.confidenceScore >= 0.8) continue;
    queue.push({
      id: `review-${report.id}`,
      subjectType: 'community_report',
      subjectId: report.id,
      priority: report.confidenceScore < 0.3 ? 'high' : 'medium',
      reason: `Community report ${report.reportType} for ${report.productId} has low confidence score ${report.confidenceScore}.`
    });
  }

  const priorityRank: Record<HumanReviewQueueItem['priority'], number> = { high: 0, medium: 1, low: 2 };
  return queue.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.id.localeCompare(b.id));
}

export function planCommunityReportAbuseControls(input: {
  reporters: CommunityReporterActivity[];
  maxReportsPer24Hours?: number;
  maxPendingReports?: number;
}): CommunityReportAbuseControl[] {
  const maxReportsPer24Hours = input.maxReportsPer24Hours ?? 20;
  const maxPendingReports = input.maxPendingReports ?? 5;

  return input.reporters.map((reporter) => {
    const resolvedReports = reporter.acceptedReportsLast30Days + reporter.rejectedReportsLast30Days;
    const acceptanceRatio = resolvedReports === 0 ? 1 : reporter.acceptedReportsLast30Days / resolvedReports;

    if (reporter.rejectedReportsLast30Days >= 10 && acceptanceRatio < 0.2) {
      return {
        reporterId: reporter.reporterId,
        action: 'suspend_reporting',
        reason: 'Reporter has high rejected-report volume and a low acceptance ratio.'
      };
    }

    if (reporter.reportsLast24Hours > maxReportsPer24Hours) {
      return {
        reporterId: reporter.reporterId,
        action: 'throttle',
        reason: `Reporter exceeded ${maxReportsPer24Hours} community reports in the last 24 hours.`
      };
    }

    if (reporter.pendingReports > maxPendingReports) {
      return {
        reporterId: reporter.reporterId,
        action: 'require_manual_review',
        reason: `Reporter has more than ${maxPendingReports} unresolved community reports.`
      };
    }

    if (reporter.rejectedReportsLast30Days >= 3) {
      return {
        reporterId: reporter.reporterId,
        action: 'require_manual_review',
        reason: 'Reporter has repeated rejected community reports.'
      };
    }

    return {
      reporterId: reporter.reporterId,
      action: 'allow',
      reason: 'Reporter history is within trust limits.'
    };
  });
}

export function authorizeHumanReviewAction(input: {
  reviewer: HumanReviewOperator;
  action: HumanReviewAction;
  assignment?: HumanReviewAssignment;
}): HumanReviewAuthorization {
  if (!input.reviewer.active) return { allowed: false, reason: 'Reviewer is inactive.' };

  if (input.reviewer.role === 'lead') {
    return { allowed: true, reason: 'Lead reviewers can perform human-review operations.' };
  }

  if (input.reviewer.role === 'viewer') {
    return input.action === 'view_queue'
      ? { allowed: true, reason: 'Viewer can inspect the review queue.' }
      : { allowed: false, reason: 'Viewers cannot mutate human-review work.' };
  }

  if (input.action === 'view_queue') return { allowed: true, reason: 'Moderator can inspect the review queue.' };

  if (input.action === 'decide_review') {
    if (!input.assignment || input.assignment.assigneeId !== input.reviewer.id) {
      return { allowed: false, reason: 'Moderators can only decide reviews assigned to them.' };
    }
    if (input.assignment.status === 'completed') {
      return { allowed: false, reason: 'Completed reviews cannot be decided again.' };
    }
    return { allowed: true, reason: 'Moderator is assigned to this open review.' };
  }

  return { allowed: false, reason: 'Moderators cannot manage assignment or abuse-control settings.' };
}

const humanReviewPriorityRank: Record<HumanReviewQueueItem['priority'], number> = { high: 0, medium: 1, low: 2 };
const humanReviewSlaHours: Record<HumanReviewQueueItem['priority'], number> = { high: 4, medium: 24, low: 72 };

function reviewerCanHandle(reviewer: HumanReviewerProfile, item: HumanReviewQueueItem, openCounts: Map<string, number>): boolean {
  if (!reviewer.active) return false;
  if ((openCounts.get(reviewer.id) ?? reviewer.openAssignmentCount) >= reviewer.maxOpenAssignments) return false;
  return reviewer.specialties === undefined || reviewer.specialties.length === 0 || reviewer.specialties.includes(item.subjectType);
}

export function planHumanReviewAssignments(input: {
  queue: HumanReviewQueueItem[];
  reviewers: HumanReviewerProfile[];
  assignedAt: string;
  existingAssignments?: HumanReviewAssignment[];
}): HumanReviewAssignmentPlan {
  if (Number.isNaN(Date.parse(input.assignedAt))) throw new Error('assignedAt must be an ISO date.');

  const assignedAt = new Date(input.assignedAt);
  const openCounts = new Map(input.reviewers.map((reviewer) => [reviewer.id, reviewer.openAssignmentCount]));
  const alreadyAssigned = new Set(
    (input.existingAssignments ?? [])
      .filter((assignment) => assignment.status === 'assigned' || assignment.status === 'in_progress')
      .map((assignment) => assignment.reviewId)
  );
  const assignments: HumanReviewAssignment[] = [];
  const unassigned: HumanReviewAssignmentPlan['unassigned'] = [];
  const queue = [...input.queue].sort(
    (a, b) => humanReviewPriorityRank[a.priority] - humanReviewPriorityRank[b.priority] || a.id.localeCompare(b.id)
  );

  for (const item of queue) {
    if (alreadyAssigned.has(item.id)) {
      unassigned.push({ reviewId: item.id, reason: 'already_assigned' });
      continue;
    }

    const reviewer = input.reviewers
      .filter((candidate) => reviewerCanHandle(candidate, item, openCounts))
      .sort((a, b) => (openCounts.get(a.id) ?? a.openAssignmentCount) - (openCounts.get(b.id) ?? b.openAssignmentCount) || a.id.localeCompare(b.id))[0];

    if (!reviewer) {
      unassigned.push({ reviewId: item.id, reason: 'no_active_reviewer_capacity' });
      continue;
    }

    openCounts.set(reviewer.id, (openCounts.get(reviewer.id) ?? reviewer.openAssignmentCount) + 1);
    assignments.push({
      id: `assignment-${item.id}-${reviewer.id}`,
      reviewId: item.id,
      subjectType: item.subjectType,
      subjectId: item.subjectId,
      priority: item.priority,
      reason: item.reason,
      assigneeId: reviewer.id,
      assignedAt: assignedAt.toISOString(),
      dueAt: new Date(assignedAt.getTime() + humanReviewSlaHours[item.priority] * 60 * 60 * 1000).toISOString(),
      status: 'assigned'
    });
  }

  return { assignments, unassigned };
}

export function summarizeHumanReviewSla(input: {
  assignments: HumanReviewAssignment[];
  now: string;
  dueSoonHours?: number;
}): HumanReviewSlaSummary {
  if (Number.isNaN(Date.parse(input.now))) throw new Error('now must be an ISO date.');

  const nowMs = Date.parse(input.now);
  const dueSoonMs = (input.dueSoonHours ?? 2) * 60 * 60 * 1000;
  const openByPriority: HumanReviewSlaSummary['openByPriority'] = { high: 0, medium: 0, low: 0 };
  const breachedReviewIds: string[] = [];
  const dueSoonReviewIds: string[] = [];

  for (const assignment of input.assignments) {
    if (assignment.status === 'completed') continue;
    openByPriority[assignment.priority] += 1;

    const dueAtMs = Date.parse(assignment.dueAt);
    if (Number.isNaN(dueAtMs)) throw new Error(`dueAt must be an ISO date for ${assignment.reviewId}.`);
    if (dueAtMs < nowMs) {
      breachedReviewIds.push(assignment.reviewId);
      continue;
    }
    if (dueAtMs - nowMs <= dueSoonMs) dueSoonReviewIds.push(assignment.reviewId);
  }

  const openAssignments = openByPriority.high + openByPriority.medium + openByPriority.low;
  const overdueAssignments = breachedReviewIds.length;
  const dueSoonAssignments = dueSoonReviewIds.length;

  return {
    status: overdueAssignments > 0 ? 'breached' : dueSoonAssignments > 0 ? 'attention' : 'healthy',
    openAssignments,
    overdueAssignments,
    dueSoonAssignments,
    openByPriority,
    breachedReviewIds,
    dueSoonReviewIds
  };
}

function writebackFor(item: HumanReviewQueueItem, decision: HumanReviewDecision): HumanReviewWriteback {
  if (decision === 'needs_more_info') {
    return { action: 'keep_in_review', subjectId: item.subjectId, reviewedByHuman: false };
  }

  if (item.subjectType === 'product_match') {
    return {
      action: decision === 'approve' ? 'approve_product_match' : 'reject_product_match',
      subjectId: item.subjectId,
      reviewedByHuman: true
    };
  }

  return {
    action: decision === 'approve' ? 'accept_community_report' : 'dismiss_community_report',
    subjectId: item.subjectId,
    reviewedByHuman: true
  };
}

export function applyHumanReviewDecision(input: {
  item: HumanReviewQueueItem;
  decision: HumanReviewDecision;
  reviewerId: string;
  decidedAt: string;
  notes?: string;
}): HumanReviewDecisionResult {
  if (!input.reviewerId.trim()) throw new Error('reviewerId is required.');
  if (Number.isNaN(Date.parse(input.decidedAt))) throw new Error('decidedAt must be an ISO date.');

  return {
    reviewId: input.item.id,
    subjectType: input.item.subjectType,
    subjectId: input.item.subjectId,
    status: input.decision === 'approve' ? 'approved' : input.decision === 'reject' ? 'rejected' : 'needs_more_info',
    reviewerId: input.reviewerId,
    decidedAt: input.decidedAt,
    ...(input.notes ? { notes: input.notes } : {}),
    writeback: writebackFor(input.item, input.decision)
  };
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

export type HouseholdMember = {
  userId: string;
  displayName: string;
};

export type HouseholdBasketItem = {
  productId: string;
  quantity: number;
  addedBy: string;
};

export type HouseholdWatchlistItem = {
  productId: string;
  addedBy: string;
  targetPrice?: number;
};

export type HouseholdSnapshot = {
  id: string;
  name: string;
  weeklyBudget: number;
  members: HouseholdMember[];
  basketItems: HouseholdBasketItem[];
  watchlistItems: HouseholdWatchlistItem[];
  sharedFavoriteStoreIds: string[];
};

export function createHouseholdState(input: {
  id: string;
  name: string;
  weeklyBudget: number;
  members: HouseholdMember[];
}) {
  const basketItems: HouseholdBasketItem[] = [];
  const watchlistItems: HouseholdWatchlistItem[] = [];
  let sharedFavoriteStoreIds: string[] = [];
  const memberIds = new Set(input.members.map((member) => member.userId));

  const requireMember = (userId: string): void => {
    if (!memberIds.has(userId)) throw new Error(`Household member not found: ${userId}`);
  };

  return {
    addBasketItem(item: HouseholdBasketItem) {
      requireMember(item.addedBy);
      basketItems.push({ ...item });
    },
    addWatchlistItem(item: HouseholdWatchlistItem) {
      requireMember(item.addedBy);
      watchlistItems.push({ ...item });
    },
    setSharedFavoriteStores(storeIds: string[]) {
      sharedFavoriteStoreIds = [...new Set(storeIds)].sort();
    },
    snapshot(): HouseholdSnapshot {
      return {
        id: input.id,
        name: input.name,
        weeklyBudget: input.weeklyBudget,
        members: input.members.map((member) => ({ ...member })),
        basketItems: basketItems.map((item) => ({ ...item })),
        watchlistItems: watchlistItems.map((item) => ({ ...item })),
        sharedFavoriteStoreIds: [...sharedFavoriteStoreIds]
      };
    }
  };
}

export type HouseholdSummary = {
  householdId: string;
  estimatedTotal: number;
  remainingBudget: number;
  memberContributions: Array<{ userId: string; displayName: string; itemCount: number }>;
  sharedFavoriteStoreIds: string[];
};

export function summarizeHousehold(snapshot: HouseholdSnapshot, priceByProductId: Record<string, number>): HouseholdSummary {
  const estimatedTotal = Math.round(
    snapshot.basketItems.reduce((sum, item) => sum + (priceByProductId[item.productId] ?? 0) * item.quantity, 0) * 100
  ) / 100;
  return {
    householdId: snapshot.id,
    estimatedTotal,
    remainingBudget: Math.round((snapshot.weeklyBudget - estimatedTotal) * 100) / 100,
    memberContributions: snapshot.members.map((member) => ({
      userId: member.userId,
      displayName: member.displayName,
      itemCount: snapshot.basketItems.filter((item) => item.addedBy === member.userId).length
    })),
    sharedFavoriteStoreIds: [...snapshot.sharedFavoriteStoreIds]
  };
}

export type AdSurface =
  | 'market_feed'
  | 'product_page_bottom'
  | 'weekly_report_inline'
  | 'article_display'
  | 'receipt_summary_bottom'
  | 'barcode_scan_top'
  | 'budget_warning'
  | 'deal_score_explanation'
  | 'checkout_decision';

export type AdCandidate = {
  id: string;
  surface: AdSurface;
  sponsor: string;
};

export type AdPlacement = AdCandidate & {
  label: 'Sponsored';
  allowed: boolean;
  reason: string;
};

const allowedAdSurfaces = new Set<AdSurface>(['market_feed', 'product_page_bottom', 'weekly_report_inline', 'article_display', 'receipt_summary_bottom']);

export function applyAdPolicy(input: { premiumUser: boolean; candidates: AdCandidate[] }): AdPlacement[] {
  if (input.premiumUser) return [];
  return input.candidates.map((candidate) => {
    const allowed = allowedAdSurfaces.has(candidate.surface);
    return {
      ...candidate,
      label: 'Sponsored',
      allowed,
      reason: allowed ? 'Allowed non-critical sponsored placement.' : 'Ads are blocked from critical decision surfaces.'
    };
  });
}

export type OrganicDealRankInput = {
  productId: string;
  dealScore: number;
  sponsored: boolean;
};

export function rankOrganicDeals(deals: OrganicDealRankInput[]): OrganicDealRankInput[] {
  return [...deals].sort((a, b) => {
    if (a.sponsored !== b.sponsored) return a.sponsored ? 1 : -1;
    return b.dealScore - a.dealScore;
  });
}

export type NutritionProduct = {
  productId: string;
  name: string;
  price: number;
  nutritionPerPackage: {
    proteinGrams: number;
    calories: number;
    fiberGrams: number;
    sugarGrams: number;
    saltGrams: number;
  };
};

export type NutritionMetric = 'protein' | 'calories' | 'fiber';

export type NutritionRank = NutritionProduct & {
  metric: NutritionMetric;
  valuePer10Sek: number;
  sugarPerPackage: number;
  saltWarning: boolean;
};

export function rankNutritionPerKrona(products: NutritionProduct[], metric: NutritionMetric): NutritionRank[] {
  const metricKey = metric === 'protein' ? 'proteinGrams' : metric === 'calories' ? 'calories' : 'fiberGrams';
  return products
    .map((product) => ({
      ...product,
      metric,
      valuePer10Sek: Math.round((product.nutritionPerPackage[metricKey] / product.price) * 1000) / 100,
      sugarPerPackage: product.nutritionPerPackage.sugarGrams,
      saltWarning: product.nutritionPerPackage.saltGrams > 2
    }))
    .sort((a, b) => b.valuePer10Sek - a.valuePer10Sek);
}

export type MealDeal = {
  productId: string;
  name: string;
  category: 'protein' | 'pantry' | 'vegetables' | 'dairy' | 'fruit' | 'other';
  price: number;
  dealScore: number;
};

export type MealSuggestion = {
  title: string;
  ingredientProductIds: string[];
  estimatedCost: number;
  estimatedCostPerServing: number;
  reason: string;
};

export function suggestDealBasedMeals(input: { deals: MealDeal[]; maxMealCost: number; servings: number }): MealSuggestion[] {
  const bestByCategory = new Map<MealDeal['category'], MealDeal>();
  for (const deal of [...input.deals].sort((a, b) => b.dealScore - a.dealScore)) {
    if (!bestByCategory.has(deal.category)) bestByCategory.set(deal.category, deal);
  }
  const protein = bestByCategory.get('protein');
  const pantry = bestByCategory.get('pantry');
  const vegetable = bestByCategory.get('vegetables');
  if (!protein || !pantry || !vegetable) return [];
  const ingredients = [protein, pantry, vegetable];
  const estimatedCost = Math.round(ingredients.reduce((sum, deal) => sum + deal.price, 0) * 100) / 100;
  if (estimatedCost > input.maxMealCost) return [];
  return [
    {
      title: `${protein.name} ${pantry.name.toLowerCase()} bowl`,
      ingredientProductIds: ingredients.map((deal) => deal.productId),
      estimatedCost,
      estimatedCostPerServing: Math.round((estimatedCost / input.servings) * 100) / 100,
      reason: 'Uses high-scoring current deals across protein, pantry, and vegetables.'
    }
  ];
}

export type PrivacyExportInput = {
  userId: string;
  favoriteStoreIds: string[];
  watchlistProductIds: string[];
  receiptIds: string[];
  householdIds: string[];
};

export type PrivacyExport = {
  userId: string;
  generatedAt: string;
  sections: Array<{ name: string; records: unknown[] }>;
};

export function buildPrivacyExport(input: PrivacyExportInput, generatedAt = '2026-05-19T00:00:00.000Z'): PrivacyExport {
  return {
    userId: input.userId,
    generatedAt,
    sections: [
      { name: 'profile', records: [{ userId: input.userId }] },
      { name: 'favorite_stores', records: input.favoriteStoreIds.map((storeId) => ({ storeId })) },
      { name: 'watchlist', records: input.watchlistProductIds.map((productId) => ({ productId })) },
      { name: 'receipts', records: input.receiptIds.map((receiptId) => ({ receiptId })) },
      { name: 'households', records: input.householdIds.map((householdId) => ({ householdId })) }
    ]
  };
}

export type AccountDeletionPlan = {
  userId: string;
  deleteFromTables: string[];
  anonymizeTables: string[];
  reason: string;
};

export function planAccountDeletion(userId: string): AccountDeletionPlan {
  return {
    userId,
    deleteFromTables: ['watchlist_items', 'favorite_stores', 'basket_items', 'weekly_baskets', 'receipt_items', 'receipt_uploads', 'user_preferences', 'app_users'],
    anonymizeTables: ['community_price_reports'],
    reason: 'Delete personal account, budget, basket, watchlist, and receipt data; anonymize community observations that may still support aggregate price quality.'
  };
}

export type AdvertiserInput = {
  userId: string;
  district?: string;
  categoryInterest?: string;
  weeklyBudget?: number;
  receiptTotal?: number;
  receiptImageUrl?: string;
};

export type AdvertiserPayload = {
  district?: string;
  categoryInterest?: string;
};

export function redactForAdvertisers(input: AdvertiserInput): AdvertiserPayload {
  return {
    district: input.district,
    categoryInterest: input.categoryInterest
  };
}
