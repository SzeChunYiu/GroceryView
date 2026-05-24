export * from './types/chain.js';

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

export type DealScoreSourceType = 'shelf' | 'online' | 'flyer' | 'member' | 'receipt' | 'shelf_photo' | 'manual' | 'estimated';

export type HistoricalDealScorePoint = {
  observedAt: string;
  unitPrice: number;
  sourceType: DealScoreSourceType;
  confidence: number;
};

export type DealScoreReasonCode =
  | 'low_percentile'
  | 'below_median'
  | 'below_30_day_low'
  | 'near_30_day_low'
  | 'limited_history'
  | 'low_confidence'
  | 'mixed_source_types'
  | 'claimed_regular_price_unverified'
  | 'distance_excluded'
  | 'perishable_short_history'
  | 'source_type_cap';

export type HistoricalDealScoreInput = {
  currentUnitPrice: number;
  asOf: string;
  history: HistoricalDealScorePoint[];
  sourceType: DealScoreSourceType;
  sourceConfidence: number;
  claimedRegularUnitPrice?: number;
  distanceKm?: number;
  perishableShortLife?: boolean;
};

export type HistoricalDealScore = {
  score: number;
  band: ScoreBand;
  currentPercentile: number;
  medianUnitPrice: number;
  medianDiscountPercent: number;
  observedThirtyDayLow?: number;
  thirtyDayLowDiscountPercent?: number;
  observationCount: number;
  cappedAt?: number;
  reasons: DealScoreReasonCode[];
  warnings: DealScoreReasonCode[];
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const formatSek = (value: number): string => `${value.toFixed(2)} SEK`;
function requireNonBlank(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}
const storeNameFromId = (storeId: string): string =>
  storeId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

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

export function calculateHistoricalDealScore(input: HistoricalDealScoreInput): HistoricalDealScore {
  if (input.currentUnitPrice < 0) throw new Error('Current unit price must be non-negative.');
  const asOf = Date.parse(input.asOf);
  if (Number.isNaN(asOf)) throw new Error('asOf must be an ISO date.');

  const parsedHistory = input.history
    .map((point) => ({ ...point, observedAtMs: Date.parse(point.observedAt) }))
    .filter((point) => !Number.isNaN(point.observedAtMs) && point.observedAtMs <= asOf)
    .sort((a, b) => a.observedAtMs - b.observedAtMs);
  if (parsedHistory.length === 0) throw new Error('At least one historical unit-price point is required.');
  if (parsedHistory.some((point) => point.unitPrice < 0)) throw new Error('Historical unit prices must be non-negative.');

  const reasons = new Set<DealScoreReasonCode>();
  const warnings = new Set<DealScoreReasonCode>();
  const historyPrices = parsedHistory.map((point) => point.unitPrice);
  const medianUnitPrice = median(historyPrices);
  const percentilePrices = [...historyPrices, input.currentUnitPrice].sort((a, b) => a - b);
  let rank = 0;
  for (let index = 0; index < percentilePrices.length; index += 1) {
    if (percentilePrices[index] <= input.currentUnitPrice) rank = index;
  }
  const currentPercentile = percentilePrices.length === 1 ? 0 : Math.round((rank / (percentilePrices.length - 1)) * 100);
  const medianDiscountPercent = medianUnitPrice > 0
    ? roundMoney(((medianUnitPrice - input.currentUnitPrice) / medianUnitPrice) * 100)
    : 0;

  const thirtyDayStart = asOf - 30 * 24 * 60 * 60 * 1000;
  const thirtyDayPrices = parsedHistory
    .filter((point) => point.observedAtMs >= thirtyDayStart)
    .map((point) => point.unitPrice);
  const observedThirtyDayLow = thirtyDayPrices.length === 0 ? undefined : roundMoney(Math.min(...thirtyDayPrices));
  const thirtyDayLowDiscountPercent = observedThirtyDayLow === undefined || observedThirtyDayLow <= 0
    ? undefined
    : roundMoney(((observedThirtyDayLow - input.currentUnitPrice) / observedThirtyDayLow) * 100);

  if (currentPercentile <= 20) reasons.add('low_percentile');
  if (medianDiscountPercent >= 5) reasons.add('below_median');
  if (observedThirtyDayLow !== undefined && input.currentUnitPrice <= observedThirtyDayLow) reasons.add('below_30_day_low');
  if (observedThirtyDayLow !== undefined && input.currentUnitPrice > observedThirtyDayLow && input.currentUnitPrice <= observedThirtyDayLow * 1.03) reasons.add('near_30_day_low');
  if (input.distanceKm !== undefined) reasons.add('distance_excluded');
  if (input.perishableShortLife) reasons.add('perishable_short_history');

  const sourceTypes = new Set(parsedHistory.map((point) => point.sourceType));
  let cap = 100;
  if (parsedHistory.length < 3 && !input.perishableShortLife) {
    cap = Math.min(cap, 60);
    warnings.add('limited_history');
  }
  if (input.sourceConfidence < 0.5) {
    cap = Math.min(cap, 50);
    warnings.add('low_confidence');
  }
  if (sourceTypes.size > 1) {
    cap = Math.min(cap, 70);
    warnings.add('mixed_source_types');
  }
  if (input.sourceType === 'estimated' || input.sourceType === 'manual') {
    cap = Math.min(cap, 60);
    warnings.add('source_type_cap');
  }
  if (
    input.claimedRegularUnitPrice !== undefined &&
    observedThirtyDayLow !== undefined &&
    input.claimedRegularUnitPrice > observedThirtyDayLow
  ) {
    cap = Math.min(cap, 70);
    warnings.add('claimed_regular_price_unverified');
  }

  const percentileStrength = 100 - currentPercentile;
  const medianDiscountStrength = clamp(medianDiscountPercent * 3, 0, 100);
  const thirtyDayStrength = observedThirtyDayLow === undefined
    ? 0
    : input.currentUnitPrice <= observedThirtyDayLow
      ? 100
      : input.currentUnitPrice <= observedThirtyDayLow * 1.03 ? 70 : 0;
  const sourceQuality = clamp(input.sourceConfidence, 0, 1) * 70 + Math.min(1, parsedHistory.length / 5) * 30;
  const rawScore = Math.round(
    percentileStrength * 0.35 +
      medianDiscountStrength * 0.25 +
      thirtyDayStrength * 0.2 +
      sourceQuality * 0.2
  );
  const score = Math.min(rawScore, cap);

  return {
    score,
    band: scoreBand(score),
    currentPercentile,
    medianUnitPrice: roundMoney(medianUnitPrice),
    medianDiscountPercent,
    observedThirtyDayLow,
    thirtyDayLowDiscountPercent,
    observationCount: parsedHistory.length,
    cappedAt: cap < rawScore ? cap : undefined,
    reasons: [...reasons],
    warnings: [...warnings]
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export type DealOpportunityInput = {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  currentPrice: number;
  regularPrice: number;
  dealScore: number;
  sourceConfidence: number;
  sponsoredPlacement?: boolean;
};

export type DealOpportunity = DealOpportunityInput & {
  band: ScoreBand;
  priceDrop: number;
  discountPercent: number;
  reason: string;
};

export function rankDealOpportunities(input: {
  deals: DealOpportunityInput[];
  minimumDealScore?: number;
  minimumSourceConfidence?: number;
}): DealOpportunity[] {
  const minimumDealScore = input.minimumDealScore ?? 60;
  const minimumSourceConfidence = input.minimumSourceConfidence ?? 0.5;

  return input.deals
    .filter((deal) => !deal.sponsoredPlacement)
    .filter((deal) => deal.dealScore >= minimumDealScore)
    .filter((deal) => deal.sourceConfidence >= minimumSourceConfidence)
    .map((deal) => {
      const priceDrop = roundMoney(Math.max(0, deal.regularPrice - deal.currentPrice));
      const discountPercent = deal.regularPrice > 0 ? roundMoney((priceDrop / deal.regularPrice) * 100) : 0;
      const band = scoreBand(deal.dealScore);

      return {
        ...deal,
        band,
        priceDrop,
        discountPercent,
        reason: `${deal.productName} is ${discountPercent}% below regular price at ${deal.storeName} with Deal Score ${deal.dealScore}.`
      };
    })
    .sort((a, b) => {
      if (b.dealScore !== a.dealScore) return b.dealScore - a.dealScore;
      if (b.discountPercent !== a.discountPercent) return b.discountPercent - a.discountPercent;
      return a.productName.localeCompare(b.productName);
    });
}

export type StorePrice = {
  storeId: string;
  storeName: string;
  price: number;
  priceType?: WatchlistPriceType;
  distanceKm?: number;
};

export type BasketInputItem = {
  productId: string;
  quantity: number;
  prices: StorePrice[];
};

export type BasketComparisonInput = {
  favoriteStoreIds: string[];
  enabledMemberStoreIds?: string[];
  items: BasketInputItem[];
};

export type MultiWeekStockUpHistoryPoint = {
  observedAt: string;
  unitPrice: number;
  sourceType: DealScoreSourceType;
  confidence: number;
};

export type MultiWeekStockUpItemInput = {
  productId: string;
  productName: string;
  storeName: string;
  weeklyNeedUnits: number;
  packageUnits: number;
  comparableUnit: string;
  currentUnitPrice: number;
  history: MultiWeekStockUpHistoryPoint[];
  storageLimitWeeks?: number;
  seasonalityNote?: string;
};

export type MultiWeekStockUpInput = {
  asOf: string;
  planningWeeks: number;
  weeklyBudget: number;
  items: MultiWeekStockUpItemInput[];
};

export type MultiWeekStockUpConfidence = 'high' | 'medium' | 'low';

export type MultiWeekStockUpRow = {
  productId: string;
  productName: string;
  storeName: string;
  planningWeeks: number;
  comparableUnit: string;
  plannedUnits: number;
  packagesNeeded: number;
  currentUnitPrice: number;
  typicalUnitPrice: number;
  historicalLowUnitPrice: number;
  currentVsTypicalPercent: number;
  currentVsHistoricalLowPercent: number;
  upfrontCost: number;
  weeklyEquivalentCost: number;
  weeklyBudgetSharePercent: number;
  observationCount: number;
  observedHistoryWindow: string;
  historyWindowStart: string;
  historyWindowEnd: string;
  confidence: MultiWeekStockUpConfidence;
  contextLabel: string;
  reviewTrigger: string;
  seasonalityNote?: string;
};

export type MultiWeekStockUpPlan = {
  asOf: string;
  planningWeeks: number;
  weeklyBudget: number;
  totalUpfrontCost: number;
  weeklyEquivalentCost: number;
  weeklyBudgetSharePercent: number;
  rows: MultiWeekStockUpRow[];
  coverage: {
    confidence: MultiWeekStockUpConfidence;
    observedItemCount: number;
    totalItemCount: number;
    caveat: string;
  };
  guardrails: string[];
};

export type BasketComparisonLineStatus =
  | 'matched'
  | 'missing_product_match'
  | 'unavailable'
  | 'substitution_offered'
  | 'substitution_accepted'
  | 'member_only'
  | 'weight_adjusted';

export type BasketComparisonLinePriceSource = 'online' | 'shelf' | 'flyer' | 'member' | 'receipt' | 'estimated';
export type BasketComparisonLineAvailabilitySource = 'retailer' | 'community' | 'manual' | 'unknown';

export type BasketComparisonLineFixture = {
  basketLineId: string;
  requestedProductId: string;
  requestedQuantity: number;
  requestedUnit: string;
  retailerChainId: string;
  storeId: string;
  status: BasketComparisonLineStatus;
  matchedProductId?: string;
  replacementProductId?: string;
  replacementAccepted?: boolean;
  availabilitySource: BasketComparisonLineAvailabilitySource;
  priceSourceType?: BasketComparisonLinePriceSource;
  unitPrice?: number;
  lineTotal?: number;
  memberOnly: boolean;
  weightAdjusted: boolean;
  confidence: number;
  exclusionReason?: string;
  disclosureCopy: string;
};

export type BasketComparisonLineFixtureValidation = {
  status: 'valid' | 'invalid';
  basketLineIds: string[];
  issues: string[];
};

export type BasketAssignment = {
  productId: string;
  storeId: string;
  storeName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  priceType: WatchlistPriceType;
  memberSavings?: number;
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
  bestSingleStore?: SingleStoreOption;
  savingsVsBestSingleStore: number;
  splitStoreCount: number;
  missingProductIds: string[];
  memberSavingsTotal: number;
  memberPriceStoreIds: string[];
  excludedMemberPriceProductIds: string[];
};

export type StoreBasketCoverage = {
  storeId: string;
  storeName: string;
  knownTotal: number;
  availableProductIds: string[];
  missingProductIds: string[];
  coveragePercent: number;
};

export type StoreBasketCoverageSummary = {
  stores: StoreBasketCoverage[];
  bestCoverage?: StoreBasketCoverage;
  fullCoverageStoreIds: string[];
};


export type BasketTripCostTravelMode = 'walk' | 'bike' | 'transit' | 'car' | 'delivery';

export type BasketTripCostOptionInput = {
  strategyId: string;
  label: string;
  basketTotal: number | null;
  storeIds: string[];
  distanceKm?: number;
  durationMinutes?: number;
  deliveryFee?: number;
  missingProductIds?: string[];
};

export type BasketTripCostInput = {
  currency: 'SEK';
  travelMode: BasketTripCostTravelMode;
  options: BasketTripCostOptionInput[];
  valueOfTimePerHour?: number;
  carCostPerKm?: number;
  transitFare?: number;
  splitTripPenalty?: number;
};

export type BasketTripCostOption = BasketTripCostOptionInput & {
  pricedBasketTotal: number | null;
  travelCost: number;
  effectiveTotal: number | null;
  complete: boolean;
  warnings: string[];
};

export type BasketTripCostPlan = {
  currency: 'SEK';
  travelMode: BasketTripCostTravelMode;
  bestOption?: BasketTripCostOption;
  options: BasketTripCostOption[];
  guardrails: string[];
};




export type BasketFulfillmentMode = 'pickup' | 'delivery';
export type BasketFulfillmentAccess = 'official_api' | 'manual_evidence' | 'stub_only' | 'blocked';

export type BasketFulfillmentSlotEvidenceSource = {
  access: BasketFulfillmentAccess;
  evidenceUrl?: string;
  capturedAt: string;
  shopperConsent: boolean;
};

export type BasketFulfillmentSlotInput = {
  slotId: string;
  mode: BasketFulfillmentMode;
  startsAt: string;
  endsAt: string;
  fee: number;
  currency: 'SEK';
  available: boolean;
};

export type BasketFulfillmentSlotsInput = {
  retailerId: string;
  retailerName: string;
  storeId: string;
  storeName: string;
  asOf: string;
  basketProductIds: string[];
  source: BasketFulfillmentSlotEvidenceSource;
  slots: BasketFulfillmentSlotInput[];
};

export type BasketFulfillmentSlotsPlan = {
  retailerId: string;
  retailerName: string;
  storeId: string;
  storeName: string;
  asOf: string;
  status: 'evidence_available' | 'manual_review' | 'blocked';
  availableSlotCount: number;
  availableSlots: BasketFulfillmentSlotInput[];
  blockedReasons: string[];
  guardrails: string[];
};

const fulfillmentSlotGuardrails = [
  'Fulfillment slots are evidence snapshots, not retailer reservations.',
  'Delivery or pickup availability must be re-confirmed inside the retailer checkout.',
  'GroceryView cannot claim checkout completion, delivery booking, or inventory reservation from slot evidence.'
];

export function planBasketFulfillmentSlots(input: BasketFulfillmentSlotsInput): BasketFulfillmentSlotsPlan {
  requireNonBlank(input.retailerId, 'retailerId');
  requireNonBlank(input.retailerName, 'retailerName');
  requireNonBlank(input.storeId, 'storeId');
  requireNonBlank(input.storeName, 'storeName');
  requireNonBlank(input.asOf, 'asOf');
  requireNonBlank(input.source.capturedAt, 'capturedAt');
  const blockedReasons: string[] = [];
  if (!input.source.shopperConsent) blockedReasons.push('Shopper consent is required before using retailer checkout slot evidence.');
  if (input.source.access === 'blocked' || input.source.access === 'stub_only') blockedReasons.push(`${input.retailerName} fulfillment slot access is ${input.source.access}.`);
  for (const productId of input.basketProductIds) requireNonBlank(productId, 'basketProductIds.productId');

  const slots = input.slots.map((slot) => {
    requireNonBlank(slot.slotId, 'slotId');
    requireNonBlank(slot.startsAt, 'startsAt');
    requireNonBlank(slot.endsAt, 'endsAt');
    if (slot.fee < 0) throw new Error('fee must be non-negative.');
    if (!slot.available) blockedReasons.push(`${slot.slotId} is currently unavailable.`);
    return slot;
  });
  const availableSlots = slots.filter((slot) => slot.available);
  const status = blockedReasons.some((reason) => /consent|required|blocked|stub_only/.test(reason))
    ? 'blocked'
    : availableSlots.length > 0 ? 'evidence_available' : 'manual_review';
  return {
    retailerId: input.retailerId,
    retailerName: input.retailerName,
    storeId: input.storeId,
    storeName: input.storeName,
    asOf: input.asOf,
    status,
    availableSlotCount: availableSlots.length,
    availableSlots,
    blockedReasons,
    guardrails: fulfillmentSlotGuardrails
  };
}

export type BasketImportExportSourceKind = 'bookmarklet' | 'browser_extension' | 'copy_paste';

export type BasketImportExportSource = {
  sourceKind: BasketImportExportSourceKind;
  retailerId: string;
  origin: string;
  capturedAt: string;
  consentGranted: boolean;
};

export type BasketImportExportCapturedLine = {
  rawName: string;
  quantity: number;
  productId?: string;
  productUrl?: string;
};

export type BasketImportExportKnownProduct = {
  productId: string;
  productName: string;
  aliases?: string[];
};

export type BasketImportExportInput = {
  source: BasketImportExportSource;
  capturedLines: BasketImportExportCapturedLine[];
  knownProducts: BasketImportExportKnownProduct[];
};

export type BasketImportExportAcceptedItem = {
  productId: string;
  productName: string;
  quantity: number;
  matchSource: 'product_id' | 'alias';
  productUrl?: string;
};

export type BasketImportExportReviewItem = {
  rawName: string;
  quantity: number;
  reason: string;
};

export type BasketImportExportPlan = {
  status: 'ready' | 'needs_review' | 'blocked';
  source: BasketImportExportSource;
  acceptedItems: BasketImportExportAcceptedItem[];
  reviewItems: BasketImportExportReviewItem[];
  exportText: string;
  guardrails: string[];
};

function normalizeImportName(value: string): string {
  return value.trim().toLocaleLowerCase('sv-SE').replace(/\s+/g, ' ');
}

export function planBasketImportExport(input: BasketImportExportInput): BasketImportExportPlan {
  requireNonBlank(input.source.retailerId, 'retailerId');
  requireNonBlank(input.source.origin, 'origin');
  requireNonBlank(input.source.capturedAt, 'capturedAt');
  const guardrails = [
    'Bookmarklet and extension imports require explicit shopper consent before reading retailer page content.',
    'Only matched GroceryView product ids can update the account basket automatically.',
    'Unmatched retailer rows stay in review and are never silently added as verified products.'
  ];
  if (!input.source.consentGranted) {
    return { status: 'blocked', source: input.source, acceptedItems: [], reviewItems: [], exportText: '', guardrails };
  }

  const byId = new Map(input.knownProducts.map((product) => [product.productId, product]));
  const byAlias = new Map<string, BasketImportExportKnownProduct>();
  for (const product of input.knownProducts) {
    requireNonBlank(product.productId, 'knownProducts.productId');
    requireNonBlank(product.productName, 'knownProducts.productName');
    byAlias.set(normalizeImportName(product.productName), product);
    for (const alias of product.aliases ?? []) byAlias.set(normalizeImportName(alias), product);
  }

  const acceptedItems: BasketImportExportAcceptedItem[] = [];
  const reviewItems: BasketImportExportReviewItem[] = [];
  for (const line of input.capturedLines) {
    requireNonBlank(line.rawName, 'rawName');
    if (!Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > 99) throw new Error('quantity must be an integer between 1 and 99.');
    const productById = line.productId ? byId.get(line.productId) : undefined;
    const productByAlias = byAlias.get(normalizeImportName(line.rawName));
    const product = productById ?? productByAlias;
    if (!product) {
      reviewItems.push({ rawName: line.rawName, quantity: line.quantity, reason: 'No verified GroceryView product match for retailer row.' });
      continue;
    }
    acceptedItems.push({
      productId: product.productId,
      productName: product.productName,
      quantity: line.quantity,
      matchSource: productById ? 'product_id' : 'alias',
      ...(line.productUrl ? { productUrl: line.productUrl } : {})
    });
  }

  return {
    status: reviewItems.length > 0 ? 'needs_review' : 'ready',
    source: input.source,
    acceptedItems,
    reviewItems,
    exportText: acceptedItems.map((item) => `${item.quantity} × ${item.productName}`).join('\n'),
    guardrails
  };
}

export type RetailerHandoffSupportLevel = 'supported' | 'manual' | 'unsupported';

export type RetailerHandoffSupport = {
  productDeepLinks: RetailerHandoffSupportLevel;
  basketTransfer: RetailerHandoffSupportLevel;
  copyList: RetailerHandoffSupportLevel;
  retailerAppSearch: RetailerHandoffSupportLevel;
  checkoutConfirmation: RetailerHandoffSupportLevel;
};

export type RetailerHandoffLineInput = {
  productId: string;
  productName: string;
  quantity: number;
  productUrl?: string;
  matched: boolean;
};

export type RetailerHandoffInput = {
  retailerId: string;
  retailerName: string;
  basketId: string;
  lines: RetailerHandoffLineInput[];
  support: RetailerHandoffSupport;
};

export type RetailerHandoffActionType = 'basket_transfer' | 'product_deep_links' | 'copy_list' | 'retailer_app_search';
export type RetailerHandoffActionStatus = 'ready' | 'partial' | 'manual_review' | 'unsupported';

export type RetailerHandoffAction = {
  actionType: RetailerHandoffActionType;
  status: RetailerHandoffActionStatus;
  label: string;
  lineCount: number;
  productIds: string[];
  urlCount: number;
  requiresRetailerConfirmation: boolean;
  reason: string;
};

export type RetailerHandoffPlan = {
  retailerId: string;
  retailerName: string;
  basketId: string;
  primaryAction: RetailerHandoffAction;
  actions: RetailerHandoffAction[];
  unsupportedReasons: string[];
  guardrails: string[];
};

export type RetailerDeepLinkEvidence = {
  productId: string;
  productName: string;
  productUrl?: string;
  matched: boolean;
  httpStatus?: number;
  canonicalProductId?: string;
  lastCheckedAt?: string;
};

export type RetailerDeepLinkQuality = 'verified' | 'unchecked' | 'broken' | 'mismatch' | 'missing';

export type RetailerDeepLinkQualityRow = {
  productId: string;
  productName: string;
  productUrl: string | null;
  quality: RetailerDeepLinkQuality;
  reason: string;
  lastCheckedAt: string | null;
};

export type RetailerDeepLinkQualityReport = {
  retailerId: string;
  retailerName: string;
  asOf: string;
  status: 'ready' | 'limited' | 'blocked';
  readyLinkCount: number;
  brokenLinkCount: number;
  unmatchedLineCount: number;
  rows: RetailerDeepLinkQualityRow[];
  guardrails: string[];
};

export type RetailerBasketTransferInput = RetailerHandoffInput & {
  transferEndpoint?: string;
  signedPayload?: string;
  shopperSessionPresent: boolean;
};

export type RetailerBasketTransferSession = {
  retailerId: string;
  retailerName: string;
  basketId: string;
  status: 'ready' | 'blocked' | 'manual_review';
  canAttemptTransfer: boolean;
  transferLineCount: number;
  endpoint: string | null;
  productIds: string[];
  blockedReasons: string[];
  requiresRetailerConfirmation: boolean;
  guardrails: string[];
};

export function planRetailerBasketTransferSession(input: RetailerBasketTransferInput): RetailerBasketTransferSession {
  requireNonBlank(input.retailerId, 'retailerId');
  requireNonBlank(input.retailerName, 'retailerName');
  requireNonBlank(input.basketId, 'basketId');
  const blockedReasons: string[] = [];
  if (input.support.basketTransfer !== 'supported') {
    blockedReasons.push(`${input.retailerName} basket transfer is not verified as supported.`);
  }
  if (!input.shopperSessionPresent) {
    blockedReasons.push('A signed-in shopper retailer session is required before transfer can be attempted.');
  }
  if (!input.transferEndpoint?.trim()) {
    blockedReasons.push('A verified retailer transfer endpoint is required.');
  }
  if (!input.signedPayload?.trim()) {
    blockedReasons.push('A signed transfer payload is required.');
  }

  const transferableLines = input.lines.filter((line) => {
    requireNonBlank(line.productId, 'productId');
    requireNonBlank(line.productName, 'productName');
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error('quantity must be a positive integer.');
    return line.matched && Boolean(line.productUrl);
  });
  if (transferableLines.length !== input.lines.length) {
    blockedReasons.push('Every basket line needs a verified retailer product match and product URL before transfer.');
  }

  const status = blockedReasons.length > 0 ? 'blocked' : 'ready';
  return {
    retailerId: input.retailerId,
    retailerName: input.retailerName,
    basketId: input.basketId,
    status,
    canAttemptTransfer: status === 'ready',
    transferLineCount: status === 'ready' ? transferableLines.length : 0,
    endpoint: status === 'ready' ? input.transferEndpoint!.trim() : null,
    productIds: status === 'ready' ? transferableLines.map((line) => line.productId) : [],
    blockedReasons,
    requiresRetailerConfirmation: true,
    guardrails: [
      'Basket transfer requires a verified retailer capability, endpoint, and signed payload.',
      'Every transferred line must use a verified GroceryView product match and retailer product URL.',
      'A transfer attempt is not checkout confirmation, payment, delivery booking, or inventory reservation.'
    ]
  };
}

export function planRetailerHandoff(input: RetailerHandoffInput): RetailerHandoffPlan {
  requireNonBlank(input.retailerId, 'retailerId');
  requireNonBlank(input.retailerName, 'retailerName');
  requireNonBlank(input.basketId, 'basketId');
  const lines = input.lines.map((line) => {
    requireNonBlank(line.productId, 'productId');
    requireNonBlank(line.productName, 'productName');
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error('quantity must be a positive integer.');
    return line;
  });
  const matchedLines = lines.filter((line) => line.matched);
  const linkedLines = matchedLines.filter((line) => Boolean(line.productUrl));
  const allProductIds = lines.map((line) => line.productId);

  const action = (
    actionType: RetailerHandoffActionType,
    support: RetailerHandoffSupportLevel,
    readyLines: RetailerHandoffLineInput[],
    label: string,
    manualReason: string,
    unsupportedReason: string
  ): RetailerHandoffAction => {
    if (support === 'unsupported') {
      return { actionType, status: 'unsupported', label, lineCount: 0, productIds: [], urlCount: 0, requiresRetailerConfirmation: true, reason: unsupportedReason };
    }
    if (support === 'manual') {
      return { actionType, status: 'manual_review', label, lineCount: lines.length, productIds: allProductIds, urlCount: 0, requiresRetailerConfirmation: true, reason: manualReason };
    }
    const status: RetailerHandoffActionStatus = readyLines.length === lines.length ? 'ready' : readyLines.length > 0 ? 'partial' : 'manual_review';
    return {
      actionType,
      status,
      label,
      lineCount: readyLines.length,
      productIds: readyLines.map((line) => line.productId),
      urlCount: readyLines.filter((line) => Boolean(line.productUrl)).length,
      requiresRetailerConfirmation: true,
      reason: status === 'ready' ? `${label} is ready for all basket lines.` : `${label} needs shopper review for unmatched or unlinked basket lines.`
    };
  };

  const actions: RetailerHandoffAction[] = [
    action('copy_list', input.support.copyList, lines, 'Copy list', 'Copy the list into the retailer app manually.', `${input.retailerName} copy-list handoff is not supported.`),
    action('product_deep_links', input.support.productDeepLinks, linkedLines, 'Product deep links', 'Open product searches manually in the retailer app.', `${input.retailerName} product deep links are not supported.`),
    action('retailer_app_search', input.support.retailerAppSearch, lines, 'Retailer app search', 'Search each item in the retailer app and confirm matches.', `${input.retailerName} app search handoff is not supported.`),
    action('basket_transfer', input.support.basketTransfer, matchedLines, 'Basket transfer', 'Transfer requires retailer-side confirmation before GroceryView can call it complete.', `${input.retailerName} does not currently support verified basket transfer.`)
  ];

  const priority: RetailerHandoffActionStatus[] = ['ready', 'partial', 'manual_review', 'unsupported'];
  const primaryAction = [...actions].sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status))[0] ?? actions[0]!;
  const unsupportedReasons = actions
    .filter((item) => item.status === 'unsupported' && item.actionType === 'basket_transfer')
    .map((item) => item.reason);
  if (input.support.checkoutConfirmation === 'unsupported') {
    unsupportedReasons.push('Checkout confirmation is not available, so GroceryView cannot claim purchase completion.');
  }

  return {
    retailerId: input.retailerId,
    retailerName: input.retailerName,
    basketId: input.basketId,
    primaryAction,
    actions,
    unsupportedReasons,
    guardrails: [
      'Retailer handoff is an action aid, not checkout confirmation.',
      'Unsupported basket transfer falls back to copyable lists and product deep links.',
      'Missing product links remain visible and require shopper review before retailer handoff.'
    ]
  };
}

export function scoreRetailerDeepLinkQuality(input: {
  retailerId: string;
  retailerName: string;
  asOf: string;
  links: RetailerDeepLinkEvidence[];
}): RetailerDeepLinkQualityReport {
  requireNonBlank(input.retailerId, 'retailerId');
  requireNonBlank(input.retailerName, 'retailerName');
  requireNonBlank(input.asOf, 'asOf');

  const rows = input.links.map((link): RetailerDeepLinkQualityRow => {
    requireNonBlank(link.productId, 'productId');
    requireNonBlank(link.productName, 'productName');

    if (!link.matched || !link.productUrl?.trim()) {
      return {
        productId: link.productId,
        productName: link.productName,
        productUrl: link.productUrl?.trim() || null,
        quality: 'missing',
        reason: 'No verified retailer product URL is available for this basket line.',
        lastCheckedAt: link.lastCheckedAt ?? null
      };
    }

    if (link.canonicalProductId && link.canonicalProductId !== link.productId) {
      return {
        productId: link.productId,
        productName: link.productName,
        productUrl: link.productUrl.trim(),
        quality: 'mismatch',
        reason: 'Retailer canonical product id does not match the GroceryView product id.',
        lastCheckedAt: link.lastCheckedAt ?? null
      };
    }

    if (typeof link.httpStatus === 'number' && (link.httpStatus < 200 || link.httpStatus >= 400)) {
      return {
        productId: link.productId,
        productName: link.productName,
        productUrl: link.productUrl.trim(),
        quality: 'broken',
        reason: `Retailer link returned HTTP ${link.httpStatus}.`,
        lastCheckedAt: link.lastCheckedAt ?? null
      };
    }

    if (link.httpStatus === 200 && link.canonicalProductId === link.productId) {
      return {
        productId: link.productId,
        productName: link.productName,
        productUrl: link.productUrl.trim(),
        quality: 'verified',
        reason: 'Retailer URL resolved and canonical product evidence matches.',
        lastCheckedAt: link.lastCheckedAt ?? null
      };
    }

    return {
      productId: link.productId,
      productName: link.productName,
      productUrl: link.productUrl.trim(),
      quality: 'unchecked',
      reason: 'Retailer URL is present but has not been recently verified with HTTP and canonical product evidence.',
      lastCheckedAt: link.lastCheckedAt ?? null
    };
  });

  const readyLinkCount = rows.filter((row) => row.quality === 'verified').length;
  const brokenLinkCount = rows.filter((row) => row.quality === 'broken' || row.quality === 'mismatch').length;
  const unmatchedLineCount = rows.filter((row) => row.quality === 'missing').length;
  const status = readyLinkCount === rows.length && rows.length > 0 ? 'ready' : readyLinkCount > 0 && brokenLinkCount === 0 ? 'limited' : brokenLinkCount > 0 && readyLinkCount === 0 ? 'blocked' : 'limited';

  return {
    retailerId: input.retailerId,
    retailerName: input.retailerName,
    asOf: input.asOf,
    status,
    readyLinkCount,
    brokenLinkCount,
    unmatchedLineCount,
    rows,
    guardrails: [
      'Deep-link quality measures whether GroceryView can send a shopper to a retailer product page, not checkout confirmation.',
      'Broken, mismatched, or missing links must fall back to retailer app search or copy-list handoff.',
      'Canonical product evidence is required before a link can be labeled verified.'
    ]
  };
}

export function planBasketTripCost(input: BasketTripCostInput): BasketTripCostPlan {
  const valueOfTimePerHour = input.valueOfTimePerHour ?? 0;
  const carCostPerKm = input.carCostPerKm ?? 0;
  const transitFare = input.transitFare ?? 0;
  const splitTripPenalty = input.splitTripPenalty ?? 0;
  if (valueOfTimePerHour < 0 || carCostPerKm < 0 || transitFare < 0 || splitTripPenalty < 0) {
    throw new Error('Travel cost parameters must be non-negative.');
  }

  const options = input.options.map((option): BasketTripCostOption => {
    requireNonBlank(option.strategyId, 'strategyId');
    requireNonBlank(option.label, 'label');
    if (option.basketTotal !== null && option.basketTotal < 0) throw new Error('basketTotal must be non-negative or null.');
    if (option.distanceKm !== undefined && option.distanceKm < 0) throw new Error('distanceKm must be non-negative.');
    if (option.durationMinutes !== undefined && option.durationMinutes < 0) throw new Error('durationMinutes must be non-negative.');
    if (option.deliveryFee !== undefined && option.deliveryFee < 0) throw new Error('deliveryFee must be non-negative.');

    const distanceCost = input.travelMode === 'car' ? (option.distanceKm ?? 0) * carCostPerKm : 0;
    const timeCost = ((option.durationMinutes ?? 0) / 60) * valueOfTimePerHour;
    const modeCost = input.travelMode === 'transit' ? transitFare : input.travelMode === 'delivery' ? (option.deliveryFee ?? 0) : 0;
    const splitCost = option.storeIds.length > 1 ? splitTripPenalty : 0;
    const travelCost = roundMoney(distanceCost + timeCost + modeCost + splitCost);
    const missingProductIds = option.missingProductIds ?? [];
    const complete = option.basketTotal !== null && missingProductIds.length === 0;
    const warnings: string[] = [];
    if (missingProductIds.length > 0) warnings.push(`Missing verified prices for: ${missingProductIds.join(', ')}.`);
    if (option.basketTotal === null) warnings.push('Basket total is unavailable because at least one required line is not priced.');
    if (splitCost > 0) warnings.push(`Split shop adds ${formatSek(splitCost)} handling/time penalty.`);

    return {
      ...option,
      missingProductIds,
      pricedBasketTotal: option.basketTotal,
      travelCost,
      effectiveTotal: complete ? roundMoney((option.basketTotal ?? 0) + travelCost) : null,
      complete,
      warnings
    };
  }).sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? -1 : 1;
    if (a.effectiveTotal !== null && b.effectiveTotal !== null && a.effectiveTotal !== b.effectiveTotal) return a.effectiveTotal - b.effectiveTotal;
    if (a.pricedBasketTotal !== null && b.pricedBasketTotal !== null && a.pricedBasketTotal !== b.pricedBasketTotal) return a.pricedBasketTotal - b.pricedBasketTotal;
    return a.label.localeCompare(b.label);
  });

  return {
    currency: input.currency,
    travelMode: input.travelMode,
    bestOption: options.find((option) => option.complete),
    options,
    guardrails: [
      'Trip cost is shown separately from verified shelf totals.',
      'Options with missing product prices are not ranked as complete even when travel looks cheap.',
      'Travel estimates are planning aids, not retailer checkout or delivery confirmations.'
    ]
  };
}

export type LocalOfferSourceType = 'shelf' | 'online' | 'flyer' | 'member' | 'receipt' | 'shelf_photo' | 'manual' | 'estimated';

export type LocalOfferBasketItem = {
  productId: string;
  quantity: number;
  baselineUnitPrice?: number;
};

export type LocalOffer = {
  productId: string;
  storeId: string;
  storeName: string;
  unitPrice: number;
  observedAt: string;
  sourceType: LocalOfferSourceType;
  confidence: number;
  available?: boolean;
  distanceKm?: number;
};

export type LocalOfferBasketInput = {
  items: LocalOfferBasketItem[];
  offers: LocalOffer[];
  storeIds?: string[];
  asOf: string;
  staleAfterHours?: number;
};

export type LocalOfferBasketLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sourceType: LocalOfferSourceType;
  confidence: number;
  observedAt: string;
  stale: boolean;
};

export type LocalOfferStoreSummary = {
  storeId: string;
  storeName: string;
  subtotal: number;
  matchedProductIds: string[];
  missingProductIds: string[];
  unavailableProductIds: string[];
  staleProductIds: string[];
  coveragePercent: number;
  averageConfidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  freshnessLabel: 'fresh' | 'mixed' | 'stale';
  sourceTypes: LocalOfferSourceType[];
  lines: LocalOfferBasketLine[];
  savingsVsBaseline?: number;
};

export type LocalOfferBasketSummary = {
  stores: LocalOfferStoreSummary[];
  bestStore?: LocalOfferStoreSummary;
  baselineTotal?: number;
};

export type RecurringBasketCadence = 'weekly' | 'biweekly' | 'monthly';

export type RecurringBasketLineInput = {
  productId: string;
  productName: string;
  quantity: number;
  currentUnitPrice?: number | null;
  previousUnitPrice?: number | null;
  currentStoreName?: string;
  previousStoreName?: string;
  substituteProductName?: string;
  confidence?: number;
};

export type RecurringBasketChangeType =
  | 'price_up'
  | 'price_down'
  | 'new_item'
  | 'missing_current_price'
  | 'substitute_available'
  | 'unchanged';

export type RecurringBasketDigestLine = {
  productId: string;
  productName: string;
  quantity: number;
  currentUnitPrice: number | null;
  previousUnitPrice: number | null;
  currentLineTotal: number | null;
  previousLineTotal: number | null;
  lineDelta: number | null;
  lineDeltaPercent: number | null;
  currentStoreName?: string;
  previousStoreName?: string;
  substituteProductName?: string;
  confidence: number;
  changeType: RecurringBasketChangeType;
  recommendedAction: string;
};

export type RecurringBasketChangeSummary = {
  priceUp: number;
  priceDown: number;
  newItem: number;
  missingCurrentPrice: number;
  substituteAvailable: number;
  unchanged: number;
};

export type RecurringBasketDigestInput = {
  templateId: string;
  templateName: string;
  cadence: RecurringBasketCadence;
  asOf: string;
  lastPurchasedAt?: string;
  lines: RecurringBasketLineInput[];
};

export type RecurringBasketDigest = {
  templateId: string;
  templateName: string;
  cadence: RecurringBasketCadence;
  asOf: string;
  lastPurchasedAt?: string;
  lineCount: number;
  comparableCurrentTotal: number;
  comparablePreviousTotal: number;
  comparableDelta: number;
  comparableDeltaPercent: number;
  missingCurrentPriceProductIds: string[];
  changeSummary: RecurringBasketChangeSummary;
  headline: string;
  lines: RecurringBasketDigestLine[];
  guardrails: string[];
};

export function compareBasketStrategies(input: BasketComparisonInput): BasketComparisonResult {
  const favoriteSet = new Set(input.favoriteStoreIds);
  const enabledMemberSet = new Set(input.enabledMemberStoreIds ?? []);
  const missingProductIds: string[] = [];
  const excludedMemberPriceProductIds = new Set<string>();
  const assignments: BasketAssignment[] = [];
  const storeTotals = new Map<string, SingleStoreOption>();
  const memberPriceStoreIds = new Set<string>();
  let memberSavingsTotal = 0;

  for (const item of input.items) {
    const favoritePrices = item.prices.filter((price) => favoriteSet.has(price.storeId));
    const eligiblePrices = favoritePrices.filter((price) => {
      if (price.priceType !== 'member') return true;
      const isEnabled = enabledMemberSet.has(price.storeId);
      if (!isEnabled) excludedMemberPriceProductIds.add(`${item.productId}@${price.storeId}`);
      return isEnabled;
    });
    if (eligiblePrices.length === 0) {
      missingProductIds.push(item.productId);
      continue;
    }

    const bestEligibleByStore = new Map<string, StorePrice>();
    for (const price of eligiblePrices) {
      const current = bestEligibleByStore.get(price.storeId);
      if (!current || price.price < current.price) bestEligibleByStore.set(price.storeId, price);
    }

    const shelfBaselineByStore = new Map<string, StorePrice>();
    for (const price of favoritePrices) {
      if (price.priceType === 'member') continue;
      const current = shelfBaselineByStore.get(price.storeId);
      if (!current || price.price < current.price) shelfBaselineByStore.set(price.storeId, price);
    }

    for (const price of bestEligibleByStore.values()) {
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

    const cheapest = [...bestEligibleByStore.values()].reduce((best, candidate) =>
      candidate.price < best.price ? candidate : best
    );
    const priceType = cheapest.priceType ?? 'shelf';
    const shelfBaseline = shelfBaselineByStore.get(cheapest.storeId);
    const memberSavings = priceType === 'member' && shelfBaseline && shelfBaseline.price > cheapest.price
      ? roundMoney((shelfBaseline.price - cheapest.price) * item.quantity)
      : undefined;
    if (priceType === 'member') {
      memberPriceStoreIds.add(cheapest.storeId);
      memberSavingsTotal = roundMoney(memberSavingsTotal + (memberSavings ?? 0));
    }
    assignments.push({
      productId: item.productId,
      storeId: cheapest.storeId,
      storeName: cheapest.storeName,
      quantity: item.quantity,
      unitPrice: cheapest.price,
      lineTotal: roundMoney(cheapest.price * item.quantity),
      priceType,
      memberSavings
    });
  }

  const cheapestByProduct = {
    total: roundMoney(assignments.reduce((sum, item) => sum + item.lineTotal, 0)),
    assignments
  };
  const singleStoreOptions = [...storeTotals.values()].sort((a, b) => a.total - b.total);
  const bestSingleStore = singleStoreOptions.find((option) => option.itemCount === assignments.length);

  return {
    cheapestByProduct,
    singleStoreOptions,
    bestSingleStore,
    savingsVsBestSingleStore: bestSingleStore ? roundMoney(bestSingleStore.total - cheapestByProduct.total) : 0,
    splitStoreCount: new Set(assignments.map((assignment) => assignment.storeId)).size,
    missingProductIds,
    memberSavingsTotal,
    memberPriceStoreIds: [...memberPriceStoreIds].sort(),
    excludedMemberPriceProductIds: [...excludedMemberPriceProductIds]
  };
}

export function summarizeStoreBasketCoverage(input: BasketComparisonInput): StoreBasketCoverageSummary {
  const coverageByStore = new Map<string, StoreBasketCoverage>();

  for (const storeId of input.favoriteStoreIds) {
    coverageByStore.set(storeId, {
      storeId,
      storeName: storeNameFromId(storeId),
      knownTotal: 0,
      availableProductIds: [],
      missingProductIds: [],
      coveragePercent: input.items.length === 0 ? 100 : 0
    });
  }

  for (const item of input.items) {
    for (const storeId of input.favoriteStoreIds) {
      const coverage = coverageByStore.get(storeId);
      if (!coverage) continue;

      const price = item.prices.find((candidate) => candidate.storeId === storeId);
      if (!price) {
        coverage.missingProductIds.push(item.productId);
        continue;
      }

      coverage.storeName = price.storeName;
      coverage.knownTotal = roundMoney(coverage.knownTotal + price.price * item.quantity);
      coverage.availableProductIds.push(item.productId);
    }
  }

  const stores = [...coverageByStore.values()]
    .map((coverage) => ({
      ...coverage,
      coveragePercent: input.items.length === 0
        ? 100
        : roundMoney((coverage.availableProductIds.length / input.items.length) * 100)
    }))
    .sort((a, b) => {
      if (b.coveragePercent !== a.coveragePercent) return b.coveragePercent - a.coveragePercent;
      if (a.knownTotal !== b.knownTotal) return a.knownTotal - b.knownTotal;
      return a.storeName.localeCompare(b.storeName);
    });

  return {
    stores,
    bestCoverage: stores[0],
    fullCoverageStoreIds: stores
      .filter((coverage) => coverage.missingProductIds.length === 0)
      .map((coverage) => coverage.storeId)
  };
}

function stockUpConfidence(observationCount: number, averageConfidence: number): MultiWeekStockUpConfidence {
  if (observationCount >= 5 && averageConfidence >= 0.8) return 'high';
  if (observationCount >= 3 && averageConfidence >= 0.65) return 'medium';
  return 'low';
}

function weakestStockUpConfidence(values: MultiWeekStockUpConfidence[]): MultiWeekStockUpConfidence {
  if (values.includes('low')) return 'low';
  if (values.includes('medium')) return 'medium';
  return 'high';
}

export function planMultiWeekStockUpList(input: MultiWeekStockUpInput): MultiWeekStockUpPlan {
  if (!Number.isInteger(input.planningWeeks) || input.planningWeeks <= 0) throw new Error('planningWeeks must be a positive integer.');
  if (input.weeklyBudget <= 0) throw new Error('weeklyBudget must be positive.');
  const asOf = Date.parse(input.asOf);
  if (Number.isNaN(asOf)) throw new Error('asOf must be an ISO date.');

  const rows = input.items.map((item): MultiWeekStockUpRow => {
    requireNonBlank(item.productId, 'productId');
    requireNonBlank(item.productName, 'productName');
    requireNonBlank(item.storeName, 'storeName');
    requireNonBlank(item.comparableUnit, 'comparableUnit');
    if (item.weeklyNeedUnits <= 0) throw new Error('weeklyNeedUnits must be positive.');
    if (item.packageUnits <= 0) throw new Error('packageUnits must be positive.');
    if (item.currentUnitPrice < 0) throw new Error('currentUnitPrice must be non-negative.');

    const parsedHistory = item.history
      .map((point) => ({ ...point, observedAtMs: Date.parse(point.observedAt) }))
      .filter((point) => !Number.isNaN(point.observedAtMs) && point.observedAtMs <= asOf)
      .sort((a, b) => a.observedAtMs - b.observedAtMs);
    if (parsedHistory.length === 0) throw new Error('At least one historical unit-price point is required.');
    if (parsedHistory.some((point) => point.unitPrice < 0)) throw new Error('Historical unit prices must be non-negative.');

    const prices = parsedHistory.map((point) => point.unitPrice);
    const typicalUnitPrice = roundMoney(median(prices));
    const historicalLowUnitPrice = roundMoney(Math.min(...prices));
    const plannedWeeks = item.storageLimitWeeks === undefined
      ? input.planningWeeks
      : Math.min(input.planningWeeks, Math.max(1, item.storageLimitWeeks));
    const plannedUnits = roundMoney(item.weeklyNeedUnits * plannedWeeks);
    const packagesNeeded = Math.ceil(plannedUnits / item.packageUnits);
    const upfrontCost = roundMoney(packagesNeeded * item.packageUnits * item.currentUnitPrice);
    const weeklyEquivalentCost = roundMoney(upfrontCost / plannedWeeks);
    const averageConfidence = parsedHistory.reduce((sum, point) => sum + clamp(point.confidence, 0, 1), 0) / parsedHistory.length;
    const confidence = stockUpConfidence(parsedHistory.length, averageConfidence);
    const currentVsTypicalPercent = typicalUnitPrice > 0 ? roundMoney(((item.currentUnitPrice - typicalUnitPrice) / typicalUnitPrice) * 100) : 0;
    const currentVsHistoricalLowPercent = historicalLowUnitPrice > 0 ? roundMoney(((item.currentUnitPrice - historicalLowUnitPrice) / historicalLowUnitPrice) * 100) : 0;

    return {
      productId: item.productId,
      productName: item.productName,
      storeName: item.storeName,
      planningWeeks: plannedWeeks,
      comparableUnit: item.comparableUnit,
      plannedUnits,
      packagesNeeded,
      currentUnitPrice: roundMoney(item.currentUnitPrice),
      typicalUnitPrice,
      historicalLowUnitPrice,
      currentVsTypicalPercent,
      currentVsHistoricalLowPercent,
      upfrontCost,
      weeklyEquivalentCost,
      weeklyBudgetSharePercent: roundMoney((weeklyEquivalentCost / input.weeklyBudget) * 100),
      observationCount: parsedHistory.length,
      observedHistoryWindow: `${parsedHistory[0]!.observedAt} to ${parsedHistory[parsedHistory.length - 1]!.observedAt}`,
      historyWindowStart: parsedHistory[0]!.observedAt,
      historyWindowEnd: parsedHistory[parsedHistory.length - 1]!.observedAt,
      confidence,
      contextLabel: `${parsedHistory.length} observed unit-price points; typical and low are historical facts, not a forecast.`,
      reviewTrigger: item.storageLimitWeeks !== undefined && item.storageLimitWeeks < input.planningWeeks
        ? `Storage limit caps this at ${plannedWeeks} weeks; re-check observed prices before buying the next batch.`
        : 'Re-check observed prices before the planned weeks are used up or when a new verified row arrives.',
      ...(item.seasonalityNote ? { seasonalityNote: item.seasonalityNote } : {})
    };
  });

  const totalUpfrontCost = roundMoney(rows.reduce((sum, row) => sum + row.upfrontCost, 0));
  const weeklyEquivalentCost = roundMoney(totalUpfrontCost / input.planningWeeks);

  return {
    asOf: input.asOf,
    planningWeeks: input.planningWeeks,
    weeklyBudget: input.weeklyBudget,
    totalUpfrontCost,
    weeklyEquivalentCost,
    weeklyBudgetSharePercent: roundMoney((weeklyEquivalentCost / input.weeklyBudget) * 100),
    rows,
    coverage: {
      confidence: weakestStockUpConfidence(rows.map((row) => row.confidence)),
      observedItemCount: rows.length,
      totalItemCount: input.items.length,
      caveat: 'Historical low and typical prices use observed unit-price rows only; missing history lowers confidence and no future price is predicted.'
    },
    guardrails: [
      'No price forecast is produced or implied.',
      'Historical low and typical prices are computed from dated observed unit-price rows.',
      'Budget impact is the current upfront cost spread across the shopper-selected planning weeks.',
      'Storage limits can shorten a row horizon, and shoppers should re-check observed prices before restocking.'
    ]
  };
}

function hasPricedBasketLineTotal(line: BasketComparisonLineFixture): boolean {
  return line.unitPrice !== undefined && line.lineTotal !== undefined && line.priceSourceType !== undefined;
}

export function validateBasketComparisonLineFixtures(lines: BasketComparisonLineFixture[]): BasketComparisonLineFixtureValidation {
  const issues: string[] = [];
  const basketLineIds = lines.map((line) => line.basketLineId).sort();
  const seen = new Set<string>();

  for (const line of lines) {
    if (seen.has(line.basketLineId)) issues.push(`duplicate_line:${line.basketLineId}`);
    seen.add(line.basketLineId);
    if (!line.basketLineId.trim()) issues.push('missing_line_id');
    if (!line.requestedProductId.trim()) issues.push(`missing_requested_product:${line.basketLineId}`);
    if (line.requestedQuantity <= 0) issues.push(`invalid_quantity:${line.basketLineId}`);
    if (!line.requestedUnit.trim()) issues.push(`missing_requested_unit:${line.basketLineId}`);
    if (!line.retailerChainId.trim()) issues.push(`missing_retailer:${line.basketLineId}`);
    if (!line.storeId.trim()) issues.push(`missing_store:${line.basketLineId}`);
    if (line.confidence < 0 || line.confidence > 1) issues.push(`invalid_confidence:${line.basketLineId}`);
    if (!line.disclosureCopy.trim()) issues.push(`missing_disclosure:${line.basketLineId}`);
    if (line.unitPrice !== undefined && line.unitPrice < 0) issues.push(`invalid_unit_price:${line.basketLineId}`);
    if (line.lineTotal !== undefined && line.lineTotal < 0) issues.push(`invalid_line_total:${line.basketLineId}`);

    if (line.status === 'matched') {
      if (!line.matchedProductId) issues.push(`matched_product_required:${line.basketLineId}`);
      if (!hasPricedBasketLineTotal(line)) issues.push(`matched_price_required:${line.basketLineId}`);
      if (line.exclusionReason) issues.push(`matched_has_exclusion:${line.basketLineId}`);
    }
    if (line.status === 'missing_product_match') {
      if (!line.exclusionReason) issues.push(`missing_match_reason_required:${line.basketLineId}`);
      if (line.matchedProductId || line.replacementProductId || line.lineTotal !== undefined) issues.push(`missing_match_has_included_data:${line.basketLineId}`);
    }
    if (line.status === 'unavailable') {
      if (!line.matchedProductId) issues.push(`unavailable_product_required:${line.basketLineId}`);
      if (!line.exclusionReason) issues.push(`unavailable_reason_required:${line.basketLineId}`);
      if (line.lineTotal !== undefined) issues.push(`unavailable_has_line_total:${line.basketLineId}`);
    }
    if (line.status === 'substitution_offered') {
      if (!line.replacementProductId) issues.push(`substitution_replacement_required:${line.basketLineId}`);
      if (line.replacementAccepted !== false) issues.push(`substitution_offered_acceptance_required:${line.basketLineId}`);
      if (!line.exclusionReason) issues.push(`substitution_offered_reason_required:${line.basketLineId}`);
      if (line.lineTotal !== undefined) issues.push(`substitution_offered_has_line_total:${line.basketLineId}`);
    }
    if (line.status === 'substitution_accepted') {
      if (!line.replacementProductId) issues.push(`accepted_substitution_replacement_required:${line.basketLineId}`);
      if (line.replacementAccepted !== true) issues.push(`accepted_substitution_flag_required:${line.basketLineId}`);
      if (!hasPricedBasketLineTotal(line)) issues.push(`accepted_substitution_price_required:${line.basketLineId}`);
    }
    if (line.status === 'member_only') {
      if (!line.memberOnly) issues.push(`member_only_flag_required:${line.basketLineId}`);
      if (!line.exclusionReason) issues.push(`member_only_reason_required:${line.basketLineId}`);
      if (line.lineTotal !== undefined) issues.push(`member_only_has_public_total:${line.basketLineId}`);
    }
    if (line.status === 'weight_adjusted') {
      if (!line.weightAdjusted) issues.push(`weight_adjusted_flag_required:${line.basketLineId}`);
      if (!hasPricedBasketLineTotal(line)) issues.push(`weight_adjusted_price_required:${line.basketLineId}`);
      if (line.exclusionReason) issues.push(`weight_adjusted_has_exclusion:${line.basketLineId}`);
    }
  }

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    basketLineIds,
    issues
  };
}

export function summarizeLocalOfferBasket(input: LocalOfferBasketInput): LocalOfferBasketSummary {
  const asOf = Date.parse(input.asOf);
  if (Number.isNaN(asOf)) throw new Error('asOf must be an ISO date.');
  const staleAfterMs = (input.staleAfterHours ?? 48) * 60 * 60 * 1000;
  if (staleAfterMs < 0) throw new Error('staleAfterHours must be non-negative.');

  const itemById = new Map(input.items.map((item) => [item.productId, item]));
  const storeIds = input.storeIds ?? [...new Set(input.offers.map((offer) => offer.storeId))];
  const baselineTotal = input.items.every((item) => item.baselineUnitPrice !== undefined)
    ? roundMoney(input.items.reduce((sum, item) => sum + (item.baselineUnitPrice ?? 0) * item.quantity, 0))
    : undefined;

  const offersByStoreProduct = new Map<string, LocalOffer[]>();
  for (const offer of input.offers) {
    if (!itemById.has(offer.productId)) continue;
    if (input.storeIds && !storeIds.includes(offer.storeId)) continue;
    if (offer.unitPrice < 0) throw new Error('Local offer unit prices must be non-negative.');
    if (Number.isNaN(Date.parse(offer.observedAt))) throw new Error('Local offer observedAt must be an ISO date.');
    const key = `${offer.storeId}\u0000${offer.productId}`;
    offersByStoreProduct.set(key, [...(offersByStoreProduct.get(key) ?? []), offer]);
  }

  const stores = storeIds.map((storeId) => {
    const storeOffers = input.offers.filter((offer) => offer.storeId === storeId);
    const storeName = storeOffers[0]?.storeName ?? storeNameFromId(storeId);
    const lines: LocalOfferBasketLine[] = [];
    const missingProductIds: string[] = [];
    const unavailableProductIds: string[] = [];

    for (const item of input.items) {
      const offers = offersByStoreProduct.get(`${storeId}\u0000${item.productId}`) ?? [];
      const availableOffers = offers.filter((offer) => offer.available !== false);
      if (availableOffers.length === 0) {
        if (offers.some((offer) => offer.available === false)) {
          unavailableProductIds.push(item.productId);
        } else {
          missingProductIds.push(item.productId);
        }
        continue;
      }

      const bestOffer = availableOffers.reduce((best, candidate) => {
        if (candidate.unitPrice !== best.unitPrice) return candidate.unitPrice < best.unitPrice ? candidate : best;
        return candidate.confidence > best.confidence ? candidate : best;
      });
      const observedAtMs = Date.parse(bestOffer.observedAt);
      lines.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: roundMoney(bestOffer.unitPrice),
        lineTotal: roundMoney(bestOffer.unitPrice * item.quantity),
        sourceType: bestOffer.sourceType,
        confidence: clamp(bestOffer.confidence, 0, 1),
        observedAt: bestOffer.observedAt,
        stale: asOf - observedAtMs > staleAfterMs
      });
    }

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    const averageConfidence = lines.length === 0
      ? 0
      : roundMoney(lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length);
    const staleProductIds = lines.filter((line) => line.stale).map((line) => line.productId);
    const sourceTypes = [...new Set(lines.map((line) => line.sourceType))].sort();
    const coveragePercent = input.items.length === 0 ? 100 : roundMoney((lines.length / input.items.length) * 100);

    return {
      storeId,
      storeName,
      subtotal,
      matchedProductIds: lines.map((line) => line.productId),
      missingProductIds,
      unavailableProductIds,
      staleProductIds,
      coveragePercent,
      averageConfidence,
      confidenceLabel: averageConfidence >= 0.8 ? 'high' : averageConfidence >= 0.5 ? 'medium' : 'low',
      freshnessLabel: lines.length === 0
        ? 'stale'
        : staleProductIds.length === 0
          ? 'fresh'
          : staleProductIds.length === lines.length ? 'stale' : 'mixed',
      sourceTypes,
      lines,
      savingsVsBaseline: baselineTotal === undefined || coveragePercent < 100 ? undefined : roundMoney(baselineTotal - subtotal)
    } satisfies LocalOfferStoreSummary;
  }).sort((a, b) => {
    if (b.coveragePercent !== a.coveragePercent) return b.coveragePercent - a.coveragePercent;
    if (a.subtotal !== b.subtotal) return a.subtotal - b.subtotal;
    if (b.averageConfidence !== a.averageConfidence) return b.averageConfidence - a.averageConfidence;
    return a.storeName.localeCompare(b.storeName);
  });

  return {
    stores,
    bestStore: stores[0],
    baselineTotal
  };
}

function recurringBasketLineAction(line: {
  changeType: RecurringBasketChangeType;
  substituteProductName?: string;
}): string {
  if (line.changeType === 'missing_current_price') return 'Do not auto-buy; current verified price is missing.';
  if (line.changeType === 'new_item') return 'Review once before adding to the recurring basket baseline.';
  if (line.changeType === 'substitute_available') return `Review suggested substitute before checkout: ${line.substituteProductName}.`;
  if (line.changeType === 'price_up') return 'Review price increase and compare against substitutes before checkout.';
  if (line.changeType === 'price_down') return 'Keep in recurring basket; current verified price is lower than the previous shop.';
  return 'Keep in recurring basket; price is effectively unchanged.';
}

export function planRecurringBasketDigest(input: RecurringBasketDigestInput): RecurringBasketDigest {
  requireNonBlank(input.templateId, 'templateId');
  requireNonBlank(input.templateName, 'templateName');
  if (Number.isNaN(Date.parse(input.asOf))) throw new Error('asOf must be an ISO date.');
  if (input.lastPurchasedAt !== undefined && Number.isNaN(Date.parse(input.lastPurchasedAt))) {
    throw new Error('lastPurchasedAt must be an ISO date.');
  }

  const changeSummary: RecurringBasketChangeSummary = {
    priceUp: 0,
    priceDown: 0,
    newItem: 0,
    missingCurrentPrice: 0,
    substituteAvailable: 0,
    unchanged: 0
  };
  const missingCurrentPriceProductIds: string[] = [];
  let comparableCurrentTotal = 0;
  let comparablePreviousTotal = 0;

  const lines = input.lines.map((line): RecurringBasketDigestLine => {
    requireNonBlank(line.productId, 'productId');
    requireNonBlank(line.productName, 'productName');
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error('quantity must be a positive integer.');
    if (line.currentUnitPrice !== undefined && line.currentUnitPrice !== null && line.currentUnitPrice < 0) {
      throw new Error('currentUnitPrice must be non-negative.');
    }
    if (line.previousUnitPrice !== undefined && line.previousUnitPrice !== null && line.previousUnitPrice < 0) {
      throw new Error('previousUnitPrice must be non-negative.');
    }

    const currentUnitPrice = line.currentUnitPrice ?? null;
    const previousUnitPrice = line.previousUnitPrice ?? null;
    const currentLineTotal = currentUnitPrice === null ? null : roundMoney(currentUnitPrice * line.quantity);
    const previousLineTotal = previousUnitPrice === null ? null : roundMoney(previousUnitPrice * line.quantity);
    const lineDelta = currentLineTotal === null || previousLineTotal === null
      ? null
      : roundMoney(currentLineTotal - previousLineTotal);
    const lineDeltaPercent = lineDelta === null || previousLineTotal === null || previousLineTotal === 0
      ? null
      : roundMoney((lineDelta / previousLineTotal) * 100);

    let changeType: RecurringBasketChangeType = 'unchanged';
    if (currentLineTotal === null) {
      changeType = 'missing_current_price';
      missingCurrentPriceProductIds.push(line.productId);
    } else if (previousLineTotal === null) {
      changeType = 'new_item';
    } else if (line.substituteProductName && lineDelta !== null && lineDelta > 0.5) {
      changeType = 'substitute_available';
    } else if (lineDelta !== null && lineDelta > 0.5) {
      changeType = 'price_up';
    } else if (lineDelta !== null && lineDelta < -0.5) {
      changeType = 'price_down';
    }

    if (currentLineTotal !== null && previousLineTotal !== null) {
      comparableCurrentTotal = roundMoney(comparableCurrentTotal + currentLineTotal);
      comparablePreviousTotal = roundMoney(comparablePreviousTotal + previousLineTotal);
    }

    if (lineDelta !== null && lineDelta > 0.5) changeSummary.priceUp += 1;
    if (changeType === 'price_down') changeSummary.priceDown += 1;
    if (changeType === 'new_item') changeSummary.newItem += 1;
    if (changeType === 'missing_current_price') changeSummary.missingCurrentPrice += 1;
    if (changeType === 'substitute_available') changeSummary.substituteAvailable += 1;
    if (changeType === 'unchanged') changeSummary.unchanged += 1;

    return {
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      currentUnitPrice,
      previousUnitPrice,
      currentLineTotal,
      previousLineTotal,
      lineDelta,
      lineDeltaPercent,
      ...(line.currentStoreName ? { currentStoreName: line.currentStoreName } : {}),
      ...(line.previousStoreName ? { previousStoreName: line.previousStoreName } : {}),
      ...(line.substituteProductName ? { substituteProductName: line.substituteProductName } : {}),
      confidence: clamp(line.confidence ?? 1, 0, 1),
      changeType,
      recommendedAction: recurringBasketLineAction({ changeType, substituteProductName: line.substituteProductName })
    };
  });

  const comparableDelta = roundMoney(comparableCurrentTotal - comparablePreviousTotal);
  const comparableDeltaPercent = comparablePreviousTotal === 0
    ? 0
    : roundMoney((comparableDelta / comparablePreviousTotal) * 100);
  const direction = comparableDelta <= 0 ? 'lower' : 'higher';
  const headline = comparablePreviousTotal === 0
    ? `${input.templateName} is ready for its first recurring basket baseline.`
    : `${input.templateName} is ${Math.abs(comparableDeltaPercent).toFixed(2)}% ${direction} than the previous shop on comparable lines.`;

  return {
    templateId: input.templateId,
    templateName: input.templateName,
    cadence: input.cadence,
    asOf: input.asOf,
    ...(input.lastPurchasedAt ? { lastPurchasedAt: input.lastPurchasedAt } : {}),
    lineCount: input.lines.length,
    comparableCurrentTotal: roundMoney(comparableCurrentTotal),
    comparablePreviousTotal: roundMoney(comparablePreviousTotal),
    comparableDelta,
    comparableDeltaPercent,
    missingCurrentPriceProductIds,
    changeSummary,
    headline,
    lines,
    guardrails: [
      'Only lines with both current and previous verified prices are included in comparable totals.',
      'Suggested substitutes require user confirmation and never rewrite a saved recurring basket automatically.',
      'Missing current prices block automatic checkout handoff and remain visible in the digest.'
    ]
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

export type PriceHistoryPoint = {
  observedAt: string;
  price: number;
  storeId?: string;
};

export type PriceHistorySummary = {
  latestPrice: number;
  previousPrice?: number;
  changeFromPrevious: number;
  lowestPrice: number;
  highestPrice: number;
  isNewLow: boolean;
  observedCount: number;
  latestObservedAt: string;
};

export type PriceChartSourceType = 'shelf' | 'online' | 'flyer' | 'member' | 'receipt' | 'shelf_photo' | 'manual' | 'estimated';

export type PriceChartLineStyle = 'solid' | 'dashed' | 'dotted';

export type PriceChartMarkerType = 'promotion' | 'member' | 'new_low' | 'receipt_confirmed' | 'source_warning';

export type PriceChartObservation = PriceHistoryPoint & {
  storeId: string;
  storeName: string;
  sourceType: PriceChartSourceType;
  confidence: number;
  provenanceLabel?: string;
  markerType?: PriceChartMarkerType;
  markerLabel?: string;
};

export type PriceChartSeriesPoint = {
  time: string;
  value: number;
  confidence: number;
  provenanceLabel?: string;
};

export type PriceChartMarker = {
  time: string;
  type: PriceChartMarkerType;
  text: string;
  color: string;
  shape: 'circle' | 'arrowUp' | 'arrowDown';
  position: 'aboveBar' | 'belowBar' | 'inBar';
  sourceType: PriceChartSourceType;
  provenanceLabel?: string;
};

export type PriceChartSeries = {
  id: string;
  storeId: string;
  storeName: string;
  sourceType: PriceChartSourceType;
  lineStyle: PriceChartLineStyle;
  points: PriceChartSeriesPoint[];
  markers: PriceChartMarker[];
};

export type PriceChartAdapterInput = {
  observations: PriceChartObservation[];
  asOf?: string;
  rangeDays?: 7 | 30 | 90 | 365;
  markerLimitPerSeries?: number;
};

export type PriceChartAdapterResult = {
  series: PriceChartSeries[];
  windowStart?: string;
  windowEnd?: string;
};

export type PriceHistoryConfidenceState =
  | 'high_confidence_history'
  | 'limited_history'
  | 'sparse_observations'
  | 'missing_source_evidence'
  | 'no_observed_offer'
  | 'estimated_price'
  | 'member_price_excluded';

export type PriceHistoryLegalCopyMode = 'lowest_in_window' | 'observed_low_only';

export type PriceHistoryConfidenceDisclosureInput = {
  rangeDays: 30 | 90 | 365;
  firstObservedAt?: string;
  lastObservedAt?: string;
  observationCount: number;
  sourceTypesIncluded: PriceChartSourceType[];
  expectedSourceTypes?: PriceChartSourceType[];
  availabilityGapCount?: number;
  hasConfirmedOutOfStock?: boolean;
  hasEstimatedPoints?: boolean;
  hasMemberOnlyExcluded?: boolean;
  productScopeKnown?: boolean;
  storeScopeKnown?: boolean;
};

export type PriceHistoryConfidenceDisclosure = {
  rangeDays: 30 | 90 | 365;
  firstObservedAt?: string;
  lastObservedAt?: string;
  observationCount: number;
  sourceTypesIncluded: PriceChartSourceType[];
  sourceTypesMissing: PriceChartSourceType[];
  availabilityGapCount: number;
  hasConfirmedOutOfStock: boolean;
  hasEstimatedPoints: boolean;
  hasMemberOnlyExcluded: boolean;
  confidenceState: PriceHistoryConfidenceState;
  headlineCopy: string;
  detailCopy: string;
  canClaimLowestInWindow: boolean;
  legalCopyMode: PriceHistoryLegalCopyMode;
};

const chartLineStyleWeight: Record<PriceChartLineStyle, number> = {
  solid: 0,
  dashed: 1,
  dotted: 2
};

export function priceChartLineStyle(input: {
  sourceType: PriceChartSourceType;
  confidence: number;
}): PriceChartLineStyle {
  const confidence = clamp(input.confidence, 0, 1);
  if (input.sourceType === 'estimated' || input.sourceType === 'manual' || confidence < 0.5) return 'dotted';
  if (input.sourceType === 'shelf_photo' || confidence < 0.8) return 'dashed';
  return 'solid';
}

export function summarizePriceHistory(points: PriceHistoryPoint[]): PriceHistorySummary {
  if (points.length === 0) {
    throw new Error('At least one price history point is required.');
  }

  const ordered = [...points].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  const latest = ordered.at(-1)!;
  const previous = ordered.at(-2);
  const previousPrices = ordered.slice(0, -1).map((point) => point.price);
  const historicalLow = previousPrices.length > 0 ? Math.min(...previousPrices) : latest.price;

  return {
    latestPrice: latest.price,
    previousPrice: previous?.price,
    changeFromPrevious: previous ? roundMoney(latest.price - previous.price) : 0,
    lowestPrice: Math.min(...ordered.map((point) => point.price)),
    highestPrice: Math.max(...ordered.map((point) => point.price)),
    isNewLow: latest.price < historicalLow,
    observedCount: ordered.length,
    latestObservedAt: latest.observedAt
  };
}

function uniqueSourceTypes(sourceTypes: PriceChartSourceType[]): PriceChartSourceType[] {
  return [...new Set(sourceTypes)].sort();
}

function sourceTypeList(sourceTypes: PriceChartSourceType[]): string {
  if (sourceTypes.length === 0) return 'no source';
  return sourceTypes.map((sourceType) => sourceType.replace(/_/g, ' ')).join('/');
}

function observedSpanDays(firstObservedAt?: string, lastObservedAt?: string): number | undefined {
  if (!firstObservedAt || !lastObservedAt) return undefined;
  const first = Date.parse(firstObservedAt);
  const last = Date.parse(lastObservedAt);
  if (Number.isNaN(first) || Number.isNaN(last)) throw new Error('Price history disclosure dates must be ISO dates.');
  if (last < first) throw new Error('lastObservedAt must be after firstObservedAt.');
  return Math.max(1, Math.ceil((last - first) / (24 * 60 * 60 * 1000)) + 1);
}

export function summarizePriceHistoryConfidence(input: PriceHistoryConfidenceDisclosureInput): PriceHistoryConfidenceDisclosure {
  if (input.observationCount < 0) throw new Error('observationCount must be non-negative.');
  const availabilityGapCount = input.availabilityGapCount ?? 0;
  if (availabilityGapCount < 0) throw new Error('availabilityGapCount must be non-negative.');

  const sourceTypesIncluded = uniqueSourceTypes(input.sourceTypesIncluded);
  const expectedSourceTypes = uniqueSourceTypes(input.expectedSourceTypes ?? sourceTypesIncluded);
  const sourceTypesMissing = expectedSourceTypes.filter((sourceType) => !sourceTypesIncluded.includes(sourceType));
  const spanDays = observedSpanDays(input.firstObservedAt, input.lastObservedAt);
  const hasCompleteWindow = spanDays !== undefined && spanDays >= input.rangeDays;
  const hasEstimatedPoints = input.hasEstimatedPoints === true || sourceTypesIncluded.includes('estimated');
  const hasMemberOnlyExcluded = input.hasMemberOnlyExcluded === true;
  const hasConfirmedOutOfStock = input.hasConfirmedOutOfStock === true;

  let confidenceState: PriceHistoryConfidenceState = 'high_confidence_history';
  let headlineCopy = 'High confidence history';
  let detailCopy = `Compared with ${input.rangeDays} days of observed prices from ${sourceTypeList(sourceTypesIncluded)}.`;

  if (input.observationCount === 0 || availabilityGapCount > 0) {
    confidenceState = 'no_observed_offer';
    headlineCopy = hasConfirmedOutOfStock ? 'Confirmed out of stock' : 'No observed offer';
    detailCopy = hasConfirmedOutOfStock
      ? 'The retailer source indicated out of stock during this period.'
      : 'We did not observe an available offer for this source during this period.';
  } else if (hasEstimatedPoints) {
    confidenceState = 'estimated_price';
    headlineCopy = 'Estimated price';
    detailCopy = 'This range includes estimated prices and should not trigger a deal alert without a confirmed source.';
  } else if (hasMemberOnlyExcluded) {
    confidenceState = 'member_price_excluded';
    headlineCopy = 'Member price excluded';
    detailCopy = 'Personalized or login-only offers are not included in this default history.';
  } else if (sourceTypesMissing.length > 0) {
    confidenceState = 'missing_source_evidence';
    headlineCopy = sourceTypesMissing.includes('shelf') ? 'No shelf-price evidence' : 'Source evidence missing';
    detailCopy = `This chart uses ${sourceTypeList(sourceTypesIncluded)} observations; ${sourceTypeList(sourceTypesMissing)} prices may differ.`;
  } else if (input.observationCount < 3) {
    confidenceState = 'sparse_observations';
    headlineCopy = 'Sparse observations';
    detailCopy = `Only ${input.observationCount} price observation${input.observationCount === 1 ? '' : 's'} are available in this range.`;
  } else if (!hasCompleteWindow) {
    confidenceState = 'limited_history';
    headlineCopy = 'Limited history';
    detailCopy = spanDays === undefined
      ? `We do not have a complete ${input.rangeDays}-day observation window for this item.`
      : `We have observed this item for ${spanDays} days, so older lows may be missing.`;
  }

  const hasSingleSourceScope = sourceTypesIncluded.length === 1;
  const hasKnownScope = input.productScopeKnown !== false && input.storeScopeKnown !== false;
  const canClaimLowestInWindow = input.observationCount >= 3 &&
    hasCompleteWindow &&
    hasSingleSourceScope &&
    hasKnownScope &&
    !hasEstimatedPoints &&
    !hasMemberOnlyExcluded &&
    availabilityGapCount === 0;

  return {
    rangeDays: input.rangeDays,
    firstObservedAt: input.firstObservedAt,
    lastObservedAt: input.lastObservedAt,
    observationCount: input.observationCount,
    sourceTypesIncluded,
    sourceTypesMissing,
    availabilityGapCount,
    hasConfirmedOutOfStock,
    hasEstimatedPoints,
    hasMemberOnlyExcluded,
    confidenceState,
    headlineCopy,
    detailCopy,
    canClaimLowestInWindow,
    legalCopyMode: canClaimLowestInWindow ? 'lowest_in_window' : 'observed_low_only'
  };
}

function chartMarkersForObservation(observation: PriceChartObservation, isNewLow: boolean): PriceChartMarker[] {
  const markers: PriceChartMarker[] = [];
  const sourceMarker = sourceTypeMarker(observation);
  if (sourceMarker) markers.push(sourceMarker);
  if (isNewLow) {
    markers.push({
      time: observation.observedAt,
      type: 'new_low',
      text: 'New low',
      color: '#0f766e',
      shape: 'arrowUp',
      position: 'belowBar',
      sourceType: observation.sourceType,
      provenanceLabel: observation.provenanceLabel
    });
  }
  if (clamp(observation.confidence, 0, 1) < 0.5) {
    markers.push({
      time: observation.observedAt,
      type: 'source_warning',
      text: observation.markerLabel ?? 'Low confidence',
      color: '#b45309',
      shape: 'circle',
      position: 'inBar',
      sourceType: observation.sourceType,
      provenanceLabel: observation.provenanceLabel
    });
  }
  if (observation.markerType && !markers.some((marker) => marker.type === observation.markerType)) {
    markers.push({
      time: observation.observedAt,
      type: observation.markerType,
      text: observation.markerLabel ?? markerText(observation.markerType),
      color: markerColor(observation.markerType),
      shape: observation.markerType === 'new_low' ? 'arrowUp' : 'circle',
      position: observation.markerType === 'new_low' ? 'belowBar' : 'aboveBar',
      sourceType: observation.sourceType,
      provenanceLabel: observation.provenanceLabel
    });
  }
  return markers;
}

function sourceTypeMarker(observation: PriceChartObservation): PriceChartMarker | undefined {
  if (observation.sourceType === 'flyer') {
    return {
      time: observation.observedAt,
      type: 'promotion',
      text: observation.markerLabel ?? 'Flyer',
      color: '#2563eb',
      shape: 'circle',
      position: 'aboveBar',
      sourceType: observation.sourceType,
      provenanceLabel: observation.provenanceLabel
    };
  }
  if (observation.sourceType === 'member') {
    return {
      time: observation.observedAt,
      type: 'member',
      text: observation.markerLabel ?? 'Member',
      color: '#7c3aed',
      shape: 'circle',
      position: 'aboveBar',
      sourceType: observation.sourceType,
      provenanceLabel: observation.provenanceLabel
    };
  }
  if (observation.sourceType === 'receipt') {
    return {
      time: observation.observedAt,
      type: 'receipt_confirmed',
      text: observation.markerLabel ?? 'Receipt',
      color: '#16a34a',
      shape: 'circle',
      position: 'inBar',
      sourceType: observation.sourceType,
      provenanceLabel: observation.provenanceLabel
    };
  }
  return undefined;
}

function markerText(type: PriceChartMarkerType): string {
  if (type === 'promotion') return 'Promo';
  if (type === 'member') return 'Member';
  if (type === 'new_low') return 'New low';
  if (type === 'receipt_confirmed') return 'Receipt';
  return 'Source';
}

function markerColor(type: PriceChartMarkerType): string {
  if (type === 'promotion') return '#2563eb';
  if (type === 'member') return '#7c3aed';
  if (type === 'new_low') return '#0f766e';
  if (type === 'receipt_confirmed') return '#16a34a';
  return '#b45309';
}

function markerPriority(type: PriceChartMarkerType): number {
  if (type === 'source_warning') return 0;
  if (type === 'new_low') return 1;
  if (type === 'promotion' || type === 'member') return 2;
  return 3;
}

function limitChartMarkers(markers: PriceChartMarker[], limit: number): PriceChartMarker[] {
  if (markers.length <= limit) return markers;
  return [...markers]
    .sort((a, b) => {
      const priority = markerPriority(a.type) - markerPriority(b.type);
      if (priority !== 0) return priority;
      return Date.parse(b.time) - Date.parse(a.time);
    })
    .slice(0, limit)
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
}

export function buildPriceChartSeries(input: PriceChartAdapterInput): PriceChartAdapterResult {
  const asOfMs = input.asOf ? Date.parse(input.asOf) : undefined;
  if (input.asOf && Number.isNaN(asOfMs)) throw new Error('asOf must be an ISO date.');
  const windowStartMs = asOfMs !== undefined && input.rangeDays !== undefined
    ? asOfMs - input.rangeDays * 24 * 60 * 60 * 1000
    : undefined;
  const markerLimitPerSeries = input.markerLimitPerSeries ?? 12;
  if (markerLimitPerSeries < 0) throw new Error('markerLimitPerSeries must be non-negative.');

  const grouped = new Map<string, PriceChartObservation[]>();
  for (const observation of input.observations) {
    const observedAtMs = Date.parse(observation.observedAt);
    if (Number.isNaN(observedAtMs)) throw new Error('Price chart observations must use ISO observedAt dates.');
    if (observation.price < 0) throw new Error('Price chart observations must use non-negative prices.');
    if (windowStartMs !== undefined && observedAtMs < windowStartMs) continue;
    if (asOfMs !== undefined && observedAtMs > asOfMs) continue;

    const key = `${observation.storeId}\u0000${observation.sourceType}`;
    grouped.set(key, [...(grouped.get(key) ?? []), observation]);
  }

  const series = [...grouped.entries()].map(([key, observations]) => {
    const [storeId, sourceType] = key.split('\u0000') as [string, PriceChartSourceType];
    const sorted = [...observations].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
    const lowPrice = Math.min(...sorted.map((observation) => observation.price));
    const lineStyle = sorted
      .map((observation) => priceChartLineStyle(observation))
      .reduce((worst, candidate) =>
        chartLineStyleWeight[candidate] > chartLineStyleWeight[worst] ? candidate : worst
      );
    const rawMarkers = sorted.flatMap((observation) => chartMarkersForObservation(observation, observation.price === lowPrice));

    return {
      id: `${storeId}:${sourceType}`,
      storeId,
      storeName: sorted[0].storeName,
      sourceType,
      lineStyle,
      points: sorted.map((observation) => ({
        time: observation.observedAt,
        value: roundMoney(observation.price),
        confidence: clamp(observation.confidence, 0, 1),
        provenanceLabel: observation.provenanceLabel
      })),
      markers: limitChartMarkers(rawMarkers, markerLimitPerSeries)
    } satisfies PriceChartSeries;
  }).sort((a, b) => {
    const storeCompare = a.storeName.localeCompare(b.storeName);
    if (storeCompare !== 0) return storeCompare;
    return a.sourceType.localeCompare(b.sourceType);
  });

  return {
    series,
    windowStart: windowStartMs === undefined ? undefined : new Date(windowStartMs).toISOString(),
    windowEnd: asOfMs === undefined ? undefined : new Date(asOfMs).toISOString()
  };
}

export type BrandTier = 'national' | 'premium' | 'standard_private_label' | 'budget_private_label' | 'organic_private_label' | 'discount_chain_label';

export type BrandTierPriceObservation = {
  brandTier: BrandTier;
  category: string;
  baseUnitPrice: number;
  currentUnitPrice: number;
};

export type BrandTierIndex = {
  brandTier: BrandTier;
  label: string;
  value: number;
  movementPercent: number;
  categoryCount: number;
};

export type BrandTierIndexSummary = {
  indices: BrandTierIndex[];
  privateLabelSavingsPercent: number;
  highestSavingsCategories: string[];
  premiumGapPercent: number;
};

const brandTierLabels: Record<BrandTier, string> = {
  national: 'National Brand Index',
  premium: 'Premium Brand Index',
  standard_private_label: 'Standard Private Label Index',
  budget_private_label: 'Budget Private Label Index',
  organic_private_label: 'Organic Brand Index',
  discount_chain_label: 'Private Label Index'
};

export function calculateBrandTierIndices(observations: BrandTierPriceObservation[]): BrandTierIndexSummary {
  if (observations.length === 0) throw new Error('At least one brand-tier observation is required.');

  const byTier = new Map<BrandTier, BrandTierPriceObservation[]>();
  for (const observation of observations) {
    const current = byTier.get(observation.brandTier) ?? [];
    current.push(observation);
    byTier.set(observation.brandTier, current);
  }

  const indices = [...byTier.entries()]
    .map(([brandTier, rows]) => calculateFixedBasketIndex({
      id: `${brandTier}-index`,
      label: brandTierLabels[brandTier],
      baseDate: 'brand-tier-base',
      currentDate: 'brand-tier-current',
      components: rows.map((row) => ({ productId: row.category, baseUnitPrice: row.baseUnitPrice, currentUnitPrice: row.currentUnitPrice, weight: 1 }))
    }))
    .map((index) => ({
      brandTier: index.id.replace('-index', '') as BrandTier,
      label: index.label,
      value: index.value,
      movementPercent: index.movementPercent,
      categoryCount: index.components.length
    }))
    .sort((a, b) => a.value - b.value);

  const nationalByCategory = new Map(observations.filter((row) => row.brandTier === 'national').map((row) => [row.category, row.currentUnitPrice]));
  const privateRows = observations.filter((row) => isPrivateLabel(row.brandTier));
  const savingsByCategory = privateRows
    .map((row) => {
      const national = nationalByCategory.get(row.category);
      if (!national || national <= 0) return undefined;
      return { category: row.category, savingsPercent: ((national - row.currentUnitPrice) / national) * 100 };
    })
    .filter((row): row is { category: string; savingsPercent: number } => row !== undefined);

  const averageSavings = savingsByCategory.length
    ? savingsByCategory.reduce((sum, row) => sum + row.savingsPercent, 0) / savingsByCategory.length
    : 0;
  const premiumIndex = indices.find((index) => index.brandTier === 'premium')?.value;
  const privateIndexValues = indices.filter((index) => isPrivateLabel(index.brandTier)).map((index) => index.value);
  const privateIndexAverage = privateIndexValues.length ? privateIndexValues.reduce((sum, value) => sum + value, 0) / privateIndexValues.length : undefined;

  return {
    indices,
    privateLabelSavingsPercent: roundMoney(averageSavings),
    highestSavingsCategories: savingsByCategory.sort((a, b) => b.savingsPercent - a.savingsPercent).slice(0, 3).map((row) => row.category),
    premiumGapPercent: premiumIndex !== undefined && privateIndexAverage !== undefined ? roundMoney(((premiumIndex - privateIndexAverage) / privateIndexAverage) * 100) : 0
  };
}

export type SearchableProduct = {
  id: string;
  ticker: string;
  name: string;
  category: string;
  brandTier: BrandTier;
  availableChains: string[];
};

export type CategoryDealCandidate = {
  productId: string;
  productName: string;
  category: string;
  storeName: string;
  price: number;
  dealScore: number;
  sourceConfidence: number;
};

export type CategoryDealLeader = CategoryDealCandidate & {
  signal: string;
};

export function summarizeCategoryDealLeaders(input: {
  candidates: CategoryDealCandidate[];
  minimumSourceConfidence?: number;
}): CategoryDealLeader[] {
  const minimumSourceConfidence = input.minimumSourceConfidence ?? 0.5;
  const leaderByCategory = new Map<string, CategoryDealCandidate>();

  for (const candidate of input.candidates) {
    if (candidate.sourceConfidence < minimumSourceConfidence) continue;
    const current = leaderByCategory.get(candidate.category);
    if (
      !current ||
      candidate.dealScore > current.dealScore ||
      (candidate.dealScore === current.dealScore && candidate.price < current.price) ||
      (candidate.dealScore === current.dealScore &&
        candidate.price === current.price &&
        candidate.productName.localeCompare(current.productName) < 0)
    ) {
      leaderByCategory.set(candidate.category, candidate);
    }
  }

  return [...leaderByCategory.values()]
    .map((candidate) => ({
      ...candidate,
      signal: `${scoreBand(candidate.dealScore).label} at ${formatSek(candidate.price)}`
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

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

export type WatchlistPriceType = 'shelf' | 'member' | 'promotion' | 'estimated';

export type WatchlistItem = {
  productId: string;
  targetPrice?: number;
  alertDealScoreAt?: number;
  favoriteStoresOnly: boolean;
  allowedPriceTypes?: WatchlistPriceType[];
};

export type WatchlistProductPriceSnapshot = {
  storeId: string;
  storeName: string;
  price: number;
  priceType: WatchlistPriceType;
};

export type WatchlistProductSnapshot = {
  productId: string;
  productName: string;
  bestPrice: number;
  bestStoreId: string;
  bestPriceType?: WatchlistPriceType;
  prices?: WatchlistProductPriceSnapshot[];
  dealScore: number;
  isNew52WeekLow: boolean;
};

export type WatchlistAlert = {
  productId: string;
  productName: string;
  type: 'target_price' | 'deal_score' | 'new_52_week_low';
  severity: 'info' | 'opportunity' | 'urgent';
  trigger: {
    metric: 'price' | 'deal_score' | 'price_history';
    value: number | string;
    threshold?: number;
    storeId?: string;
    storeName?: string;
  };
  message: string;
};

function watchlistProductForItem(item: WatchlistItem, product: WatchlistProductSnapshot): WatchlistProductSnapshot | null {
  if (!item.allowedPriceTypes || item.allowedPriceTypes.length === 0) return product;

  const allowed = new Set(item.allowedPriceTypes);
  const eligiblePrices = (product.prices ?? [])
    .filter((price) => allowed.has(price.priceType))
    .sort((left, right) => left.price - right.price || left.storeName.localeCompare(right.storeName));

  if (eligiblePrices.length > 0) {
    const bestPrice = eligiblePrices[0]!;
    return {
      ...product,
      bestPrice: bestPrice.price,
      bestStoreId: bestPrice.storeId,
      bestPriceType: bestPrice.priceType,
      prices: eligiblePrices
    };
  }

  const fallbackPriceType = product.bestPriceType ?? 'shelf';
  return allowed.has(fallbackPriceType) ? product : null;
}

export function buildWatchlistAlerts(input: {
  watchlist: WatchlistItem[];
  products: WatchlistProductSnapshot[];
  favoriteStoreIds: string[];
}): WatchlistAlert[] {
  const productById = new Map(input.products.map((product) => [product.productId, product]));
  const favoriteStoreSet = new Set(input.favoriteStoreIds);
  const alerts: WatchlistAlert[] = [];

  for (const item of input.watchlist) {
    const rawProduct = productById.get(item.productId);
    const product = rawProduct ? watchlistProductForItem(item, rawProduct) : null;
    if (!product) continue;
    if (item.favoriteStoresOnly && !favoriteStoreSet.has(product.bestStoreId)) continue;

    if (item.targetPrice !== undefined && product.bestPrice <= item.targetPrice) {
      const storeName = storeNameFromId(product.bestStoreId);
      alerts.push({
        productId: product.productId,
        productName: product.productName,
        type: 'target_price',
        severity: product.bestPrice <= item.targetPrice * 0.9 ? 'urgent' : 'opportunity',
        trigger: {
          metric: 'price',
          value: product.bestPrice,
          threshold: item.targetPrice,
          storeId: product.bestStoreId,
          storeName
        },
        message: `${product.productName} is ${formatSek(product.bestPrice)} at ${storeName}, below your ${formatSek(item.targetPrice)} target.`
      });
    }

    if (item.alertDealScoreAt !== undefined && product.dealScore >= item.alertDealScoreAt) {
      alerts.push({
        productId: product.productId,
        productName: product.productName,
        type: 'deal_score',
        severity: product.dealScore >= 90 ? 'urgent' : 'opportunity',
        trigger: {
          metric: 'deal_score',
          value: product.dealScore,
          threshold: item.alertDealScoreAt,
          storeId: product.bestStoreId,
          storeName: storeNameFromId(product.bestStoreId)
        },
        message: `${product.productName} has Deal Score ${product.dealScore}, meeting your ${item.alertDealScoreAt}+ alert.`
      });
    }

    if (product.isNew52WeekLow) {
      alerts.push({
        productId: product.productId,
        productName: product.productName,
        type: 'new_52_week_low',
        severity: 'urgent',
        trigger: {
          metric: 'price_history',
          value: 'new_52_week_low',
          storeId: product.bestStoreId,
          storeName: storeNameFromId(product.bestStoreId)
        },
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

export type GroceryAlertType =
  | 'target_price'
  | 'new_low'
  | 'weekly_watchlist_digest'
  | 'back_in_stock'
  | 'member_only'
  | 'rss_feed'
  | 'basket_digest';

export type GroceryAlertChannel = 'push' | 'email' | 'in_app' | 'in_app_digest' | 'rss';
export type GroceryAlertFrequency = 'immediate_24h_dedupe' | 'daily_digest' | 'weekly_digest' | 'pull_only';

export type GroceryAlertChannelDefault = {
  alertType: GroceryAlertType;
  defaultChannel: GroceryAlertChannel;
  eligibleChannels: GroceryAlertChannel[];
  requiresExplicitOptIn: boolean;
  isPromotionalEmail: boolean;
  requiresOneClickUnsubscribe: boolean;
  requiresPreferenceLink: boolean;
  maxFrequency: GroceryAlertFrequency;
  quietHoursRespect: boolean;
  dedupeWindowHours: number;
  rssEligible: boolean;
  reason: string;
};

export const groceryAlertChannelDefaults: GroceryAlertChannelDefault[] = [
  {
    alertType: 'target_price',
    defaultChannel: 'email',
    eligibleChannels: ['email', 'push', 'in_app', 'rss'],
    requiresExplicitOptIn: true,
    isPromotionalEmail: false,
    requiresOneClickUnsubscribe: false,
    requiresPreferenceLink: true,
    maxFrequency: 'immediate_24h_dedupe',
    quietHoursRespect: true,
    dedupeWindowHours: 24,
    rssEligible: true,
    reason: 'A user-set threshold is expected to produce a direct alert, while push still requires explicit platform opt-in.'
  },
  {
    alertType: 'new_low',
    defaultChannel: 'in_app',
    eligibleChannels: ['in_app', 'email', 'push', 'rss'],
    requiresExplicitOptIn: true,
    isPromotionalEmail: true,
    requiresOneClickUnsubscribe: true,
    requiresPreferenceLink: true,
    maxFrequency: 'daily_digest',
    quietHoursRespect: true,
    dedupeWindowHours: 24,
    rssEligible: true,
    reason: 'New lows can be noisy in sparse grocery data, so the default stays in-app unless the user opts into direct channels.'
  },
  {
    alertType: 'weekly_watchlist_digest',
    defaultChannel: 'in_app_digest',
    eligibleChannels: ['in_app_digest', 'email', 'push'],
    requiresExplicitOptIn: true,
    isPromotionalEmail: true,
    requiresOneClickUnsubscribe: true,
    requiresPreferenceLink: true,
    maxFrequency: 'weekly_digest',
    quietHoursRespect: true,
    dedupeWindowHours: 168,
    rssEligible: false,
    reason: 'Weekly grocery planning belongs in a digest by default, aligned with flyer cadence instead of immediate interruption.'
  },
  {
    alertType: 'back_in_stock',
    defaultChannel: 'email',
    eligibleChannels: ['email', 'push', 'in_app'],
    requiresExplicitOptIn: true,
    isPromotionalEmail: false,
    requiresOneClickUnsubscribe: false,
    requiresPreferenceLink: true,
    maxFrequency: 'immediate_24h_dedupe',
    quietHoursRespect: true,
    dedupeWindowHours: 24,
    rssEligible: false,
    reason: 'Restock and observed-again alerts are user-watch events, but they should dedupe by product and source.'
  },
  {
    alertType: 'member_only',
    defaultChannel: 'in_app_digest',
    eligibleChannels: ['in_app_digest', 'in_app'],
    requiresExplicitOptIn: true,
    isPromotionalEmail: false,
    requiresOneClickUnsubscribe: false,
    requiresPreferenceLink: true,
    maxFrequency: 'daily_digest',
    quietHoursRespect: true,
    dedupeWindowHours: 24,
    rssEligible: false,
    reason: 'Member-only and personalized offers remain user-scoped and are not eligible for public RSS or default push/email.'
  },
  {
    alertType: 'rss_feed',
    defaultChannel: 'rss',
    eligibleChannels: ['rss'],
    requiresExplicitOptIn: false,
    isPromotionalEmail: false,
    requiresOneClickUnsubscribe: false,
    requiresPreferenceLink: false,
    maxFrequency: 'pull_only',
    quietHoursRespect: false,
    dedupeWindowHours: 0,
    rssEligible: true,
    reason: 'RSS is pull-based and public, so it must exclude private or member-only alert content.'
  },
  {
    alertType: 'basket_digest',
    defaultChannel: 'email',
    eligibleChannels: ['email', 'in_app_digest'],
    requiresExplicitOptIn: true,
    isPromotionalEmail: true,
    requiresOneClickUnsubscribe: true,
    requiresPreferenceLink: true,
    maxFrequency: 'weekly_digest',
    quietHoursRespect: true,
    dedupeWindowHours: 168,
    rssEligible: false,
    reason: 'Basket savings summaries are promotional digest content by default and need unsubscribe and preference controls.'
  }
];

export function planGroceryAlertChannelDefault(alertType: GroceryAlertType): GroceryAlertChannelDefault {
  const plan = groceryAlertChannelDefaults.find((candidate) => candidate.alertType === alertType);
  if (!plan) throw new Error(`No grocery alert channel default for ${alertType}.`);
  return {
    ...plan,
    eligibleChannels: [...plan.eligibleChannels]
  };
}

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
  privateLabelPreference?: PrivateLabelPreference;
};

export type PrivateLabelPreference = {
  acceptedTiers: BrandTier[];
  blockedCategories: string[];
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

function privateLabelAllowed(input: SmartSwapInput, candidate: ProductMatchInput): boolean {
  if (!isPrivateLabel(candidate.brandTier)) return true;
  if (input.acceptPrivateLabel === 'no') return false;
  if (input.privateLabelPreference?.blockedCategories.includes(candidate.category)) return false;
  if (input.privateLabelPreference && !input.privateLabelPreference.acceptedTiers.includes(candidate.brandTier)) return false;
  if (input.acceptPrivateLabel === 'maybe' && candidate.brandTier === 'budget_private_label') return false;
  return true;
}

export function recommendSmartSwaps(input: SmartSwapInput): SmartSwapRecommendation[] {
  const recommendations: SmartSwapRecommendation[] = [];

  for (const candidate of input.candidates) {
    if (!privateLabelAllowed(input, candidate)) continue;
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

export type StockoutBasketLineStatus = 'available' | 'out_of_stock' | 'missing_price' | 'retailer_unavailable';

export type StockoutBasketLine = {
  basketLineId: string;
  productId: string;
  productName: string;
  category: string;
  packageSize: number;
  packageUnit: string;
  brandTier: BrandTier;
  unitPrice: number;
  requestedQuantity: number;
  status: StockoutBasketLineStatus;
};

export type StockoutSubstitutionPolicy = {
  allowPrivateLabel?: boolean;
  minimumConfidence?: MatchConfidence;
  maxUnitPriceIncreasePercent?: number;
  blockedCategories?: string[];
  dietaryTagsRequired?: string[];
};

export type StockoutSubstitutionCandidate = {
  productId: string;
  productName: string;
  category: string;
  packageSize: number;
  packageUnit: string;
  brandTier: BrandTier;
  unitPrice: number;
  inStock: boolean;
  source: string;
  observedAt: string;
  dietaryTags?: string[];
};

export type StockoutSubstitutionOption = {
  productId: string;
  productName: string;
  lineTotal: number;
  unitPrice: number;
  priceDeltaPercent: number;
  confidence: MatchConfidence;
  qualityRisk: QualityRisk;
  reason: string;
  source: string;
  observedAt: string;
  replacementAccepted: false;
};

export type RejectedStockoutSubstitutionCandidate = {
  productId: string;
  reason: string;
};

export type StockoutSubstitutionPlan = {
  status: 'not_needed' | 'substitution_options' | 'blocked';
  basketLineId: string;
  lineStatus: StockoutBasketLineStatus;
  options: StockoutSubstitutionOption[];
  rejectedCandidates: RejectedStockoutSubstitutionCandidate[];
  guardrails: string[];
};

const matchConfidenceOrder: Record<MatchConfidence, number> = {
  low: 0,
  'medium-low': 1,
  medium: 2,
  high: 3
};

function confidenceClearsMinimum(confidence: MatchConfidence, minimum: MatchConfidence): boolean {
  return matchConfidenceOrder[confidence] >= matchConfidenceOrder[minimum];
}

function candidateAsMatchInput(candidate: StockoutSubstitutionCandidate): ProductMatchInput {
  return {
    id: candidate.productId,
    brand: candidate.productName,
    category: candidate.category,
    packageSize: candidate.packageSize,
    packageUnit: candidate.packageUnit,
    brandTier: candidate.brandTier,
    unitPrice: candidate.unitPrice
  };
}

export function planStockoutSubstitutionOptions(input: {
  basketLine: StockoutBasketLine;
  candidates: StockoutSubstitutionCandidate[];
  acceptableSubstitutionPolicy?: StockoutSubstitutionPolicy;
}): StockoutSubstitutionPlan {
  const { basketLine } = input;
  const policy = input.acceptableSubstitutionPolicy ?? {};
  const rejectedCandidates: RejectedStockoutSubstitutionCandidate[] = [];
  const guardrails = [
    'Substitution options are never auto-accepted; the shopper must confirm before a basket line changes.',
    'Only verified in-stock candidate rows with comparable package evidence can be offered.',
    'Dietary and blocked-category policies fail closed before price savings are considered.'
  ];

  if (basketLine.status === 'available') {
    return {
      status: 'not_needed',
      basketLineId: basketLine.basketLineId,
      lineStatus: basketLine.status,
      options: [],
      rejectedCandidates: [],
      guardrails
    };
  }

  const blockedCategories = new Set(policy.blockedCategories ?? []);
  const dietaryTagsRequired = policy.dietaryTagsRequired ?? [];
  const minimumConfidence = policy.minimumConfidence ?? 'medium-low';
  const maxUnitPriceIncreasePercent = policy.maxUnitPriceIncreasePercent ?? 0;

  const sourceMatchInput: ProductMatchInput = {
    id: basketLine.productId,
    brand: basketLine.productName,
    category: basketLine.category,
    packageSize: basketLine.packageSize,
    packageUnit: basketLine.packageUnit,
    brandTier: basketLine.brandTier,
    unitPrice: basketLine.unitPrice
  };

  const options: StockoutSubstitutionOption[] = [];

  for (const candidate of input.candidates) {
    if (!candidate.inStock) {
      rejectedCandidates.push({ productId: candidate.productId, reason: 'Candidate is not verified in stock.' });
      continue;
    }
    if (blockedCategories.has(candidate.category)) {
      rejectedCandidates.push({ productId: candidate.productId, reason: 'Candidate category is blocked by shopper policy.' });
      continue;
    }
    if (!policy.allowPrivateLabel && isPrivateLabel(candidate.brandTier)) {
      rejectedCandidates.push({ productId: candidate.productId, reason: 'Private-label substitutions are not allowed by shopper policy.' });
      continue;
    }
    const candidateTags = new Set(candidate.dietaryTags ?? []);
    const missingDietaryTags = dietaryTagsRequired.filter((tag) => !candidateTags.has(tag));
    if (missingDietaryTags.length > 0) {
      rejectedCandidates.push({ productId: candidate.productId, reason: `Candidate is missing required dietary evidence: ${missingDietaryTags.join(', ')}.` });
      continue;
    }

    const match = classifyProductMatch({ source: sourceMatchInput, candidate: candidateAsMatchInput(candidate) });
    if (match.mode === 'not_recommended') {
      rejectedCandidates.push({ productId: candidate.productId, reason: match.reason });
      continue;
    }
    if (!confidenceClearsMinimum(match.confidence, minimumConfidence)) {
      rejectedCandidates.push({ productId: candidate.productId, reason: `Match confidence ${match.confidence} is below required ${minimumConfidence}.` });
      continue;
    }

    const priceDeltaPercent = Math.round(((candidate.unitPrice - basketLine.unitPrice) / basketLine.unitPrice) * 10000) / 100;
    if (priceDeltaPercent > maxUnitPriceIncreasePercent) {
      rejectedCandidates.push({ productId: candidate.productId, reason: `Unit price increase ${priceDeltaPercent}% exceeds policy limit ${maxUnitPriceIncreasePercent}%.` });
      continue;
    }

    options.push({
      productId: candidate.productId,
      productName: candidate.productName,
      unitPrice: candidate.unitPrice,
      lineTotal: Math.round(candidate.unitPrice * basketLine.requestedQuantity * 100) / 100,
      priceDeltaPercent,
      confidence: match.confidence,
      qualityRisk: match.qualityRisk,
      reason: match.reason,
      source: candidate.source,
      observedAt: candidate.observedAt,
      replacementAccepted: false
    });
  }

  return {
    status: options.length > 0 ? 'substitution_options' : 'blocked',
    basketLineId: basketLine.basketLineId,
    lineStatus: basketLine.status,
    options: options.sort((a, b) => a.unitPrice - b.unitPrice || matchConfidenceOrder[b.confidence] - matchConfidenceOrder[a.confidence]),
    rejectedCandidates,
    guardrails
  };
}

export type DietarySubstitutionIntent = 'dairy_free' | 'gluten_free' | 'vegan' | 'halal' | 'kosher' | 'medical' | 'general';

export type DietarySubstitutionProduct = {
  productId: string;
  productName: string;
  category: string;
  packageSize: number;
  packageUnit: string;
  unitPrice: number;
  dietaryTags: string[];
  brandTier: BrandTier;
};

export type DietarySubstitutionCandidate = DietarySubstitutionProduct & {
  allergenTags?: string[];
  evidenceSource: string;
  observedAt: string;
};

export type DietarySubstitutionPreference = {
  profileId: string;
  requiredDietaryTags: string[];
  blockedDietaryTags: string[];
  allergenAvoidanceTags: string[];
  substitutionIntent: DietarySubstitutionIntent;
  maxUnitPriceIncreasePercent: number;
};

export type DietarySubstitutionRecommendation = {
  productId: string;
  productName: string;
  category: string;
  unitPrice: number;
  unitPriceDeltaPercent: number;
  dietaryTagsMatched: string[];
  evidenceSource: string;
  observedAt: string;
  confidence: MatchConfidence;
  confirmationRequired: true;
  reason: string;
};

export type BlockedDietarySubstitutionCandidate = {
  productId: string;
  reason: string;
};

export type DietarySubstitutionAssistantPlan = {
  status: 'recommendations' | 'blocked';
  profileId: string;
  substitutionIntent: DietarySubstitutionIntent;
  recommendations: DietarySubstitutionRecommendation[];
  blockedCandidates: BlockedDietarySubstitutionCandidate[];
  guardrails: string[];
};

const medicalDietCategories = new Set(['baby_formula', 'medical_diet', 'clinical_nutrition']);

const dietaryEquivalentCategories: Partial<Record<DietarySubstitutionIntent, Record<string, string[]>>> = {
  dairy_free: {
    milk: ['milk', 'dairy_substitute', 'beverages'],
    yogurt: ['yogurt', 'dairy_substitute'],
    butter: ['butter', 'plant_based_spread']
  },
  vegan: {
    milk: ['dairy_substitute', 'beverages'],
    meat: ['plant_based_protein'],
    yogurt: ['dairy_substitute']
  },
  gluten_free: {
    pasta: ['pasta', 'gluten_free_pasta'],
    bread: ['bread', 'gluten_free_bread']
  }
};

function categoriesCompatibleForDietarySubstitution(source: DietarySubstitutionProduct, candidate: DietarySubstitutionCandidate, intent: DietarySubstitutionIntent): boolean {
  if (source.category === candidate.category) return true;
  return dietaryEquivalentCategories[intent]?.[source.category]?.includes(candidate.category) ?? false;
}

export function planDietarySubstitutionAssistant(input: {
  source: DietarySubstitutionProduct;
  preference: DietarySubstitutionPreference;
  candidates: DietarySubstitutionCandidate[];
}): DietarySubstitutionAssistantPlan {
  requireNonBlank(input.preference.profileId, 'profileId');
  requireNonBlank(input.source.productId, 'productId');
  requireNonBlank(input.source.productName, 'productName');
  if (input.preference.maxUnitPriceIncreasePercent < 0) throw new Error('maxUnitPriceIncreasePercent must be non-negative.');

  const guardrails = [
    'No dietary swap is auto-applied; the shopper must confirm every replacement.',
    'Required dietary evidence and allergen avoidance rules fail closed before savings are considered.',
    'Medical and infant diet substitutions require professional confirmation and are blocked from automatic recommendations.'
  ];
  const blockedCandidates: BlockedDietarySubstitutionCandidate[] = [];

  if (medicalDietCategories.has(input.source.category) || input.preference.substitutionIntent === 'medical') {
    return {
      status: 'blocked',
      profileId: input.preference.profileId,
      substitutionIntent: input.preference.substitutionIntent,
      recommendations: [],
      blockedCandidates: input.candidates.map((candidate) => ({
        productId: candidate.productId,
        reason: 'Medical or infant diet categories require professional confirmation and cannot be suggested automatically.'
      })),
      guardrails
    };
  }

  const requiredDietaryTags = input.preference.requiredDietaryTags;
  const blockedDietaryTags = new Set(input.preference.blockedDietaryTags);
  const allergenAvoidanceTags = new Set(input.preference.allergenAvoidanceTags);
  const recommendations: DietarySubstitutionRecommendation[] = [];

  for (const candidate of input.candidates) {
    requireNonBlank(candidate.productId, 'candidate.productId');
    requireNonBlank(candidate.productName, 'candidate.productName');
    requireNonBlank(candidate.evidenceSource, 'candidate.evidenceSource');

    const candidateDietaryTags = new Set(candidate.dietaryTags);
    const candidateAllergenTags = new Set(candidate.allergenTags ?? []);
    const missingDietaryTags = requiredDietaryTags.filter((tag) => !candidateDietaryTags.has(tag));
    if (missingDietaryTags.length > 0) {
      blockedCandidates.push({ productId: candidate.productId, reason: `Candidate is missing required dietary evidence: ${missingDietaryTags.join(', ')}.` });
      continue;
    }
    const blockedTags = candidate.dietaryTags.filter((tag) => blockedDietaryTags.has(tag));
    if (blockedTags.length > 0) {
      blockedCandidates.push({ productId: candidate.productId, reason: `Candidate contains blocked dietary evidence: ${blockedTags.join(', ')}.` });
      continue;
    }
    const blockedAllergens = [...candidateAllergenTags].filter((tag) => allergenAvoidanceTags.has(tag));
    if (blockedAllergens.length > 0) {
      blockedCandidates.push({ productId: candidate.productId, reason: `Candidate contains blocked allergen evidence: ${blockedAllergens.join(', ')}.` });
      continue;
    }
    if (!categoriesCompatibleForDietarySubstitution(input.source, candidate, input.preference.substitutionIntent)) {
      blockedCandidates.push({ productId: candidate.productId, reason: 'Candidate category is not compatible with the requested dietary substitution intent.' });
      continue;
    }
    if (input.source.packageUnit.toLowerCase() !== candidate.packageUnit.toLowerCase() || Math.abs(input.source.packageSize - candidate.packageSize) > Math.max(1, input.source.packageSize * 0.1)) {
      blockedCandidates.push({ productId: candidate.productId, reason: 'Candidate package size is not comparable for dietary substitution.' });
      continue;
    }

    const unitPriceDeltaPercent = Math.round(((candidate.unitPrice - input.source.unitPrice) / input.source.unitPrice) * 10000) / 100;
    if (unitPriceDeltaPercent > input.preference.maxUnitPriceIncreasePercent) {
      blockedCandidates.push({ productId: candidate.productId, reason: `Unit price increase ${unitPriceDeltaPercent}% exceeds dietary preference limit ${input.preference.maxUnitPriceIncreasePercent}%.` });
      continue;
    }

    recommendations.push({
      productId: candidate.productId,
      productName: candidate.productName,
      category: candidate.category,
      unitPrice: candidate.unitPrice,
      unitPriceDeltaPercent,
      dietaryTagsMatched: requiredDietaryTags.filter((tag) => candidateDietaryTags.has(tag)),
      evidenceSource: candidate.evidenceSource,
      observedAt: candidate.observedAt,
      confidence: sourceAndCandidateShareCategory(input.source, candidate) ? 'high' : 'medium',
      confirmationRequired: true,
      reason: sourceAndCandidateShareCategory(input.source, candidate)
        ? 'Same category and required dietary evidence match.'
        : 'Dietary substitution intent allows this verified cross-category replacement.'
    });
  }

  return {
    status: recommendations.length > 0 ? 'recommendations' : 'blocked',
    profileId: input.preference.profileId,
    substitutionIntent: input.preference.substitutionIntent,
    recommendations: recommendations.sort((a, b) => a.unitPriceDeltaPercent - b.unitPriceDeltaPercent || b.confidence.localeCompare(a.confidence)),
    blockedCandidates,
    guardrails
  };
}

function sourceAndCandidateShareCategory(source: DietarySubstitutionProduct, candidate: DietarySubstitutionCandidate): boolean {
  return source.category === candidate.category;
}

export type ComparableCommodityUnit = 'kg' | 'l' | 'st';

export type CommodityPriceObservation = {
  commodityId: string;
  commodityName?: string;
  productId: string;
  productName: string;
  chainId: string;
  chainName?: string;
  unitPrice: number;
  comparableUnit: ComparableCommodityUnit;
  sourceConfidence: number;
  observedAt?: string;
  variant?: string;
  isOrganic?: boolean;
  originCountry?: string;
};

export type CommodityComparisonRow = {
  rank: number;
  commodityId: string;
  commodityName: string;
  productId: string;
  productName: string;
  chainId: string;
  chainName: string;
  unitPrice: number;
  comparableUnit: ComparableCommodityUnit;
  sourceConfidence: number;
  observedAt?: string;
  variant?: string;
  isOrganic?: boolean;
  originCountry?: string;
  priceGapToNext: number;
  savingsVsNextPercent: number;
};

export type CommodityComparison = {
  status: 'priced' | 'insufficient_coverage';
  commodityId: string;
  commodityName: string;
  comparableUnit: ComparableCommodityUnit;
  rows: CommodityComparisonRow[];
  cheapestChain: CommodityComparisonRow | null;
  coverage: {
    chainCount: number;
    observationCount: number;
    rejectedObservationCount: number;
    comparableUnit: ComparableCommodityUnit;
  };
  confidenceLabel: string;
};

export function compareCommodityUnitPrices(input: {
  commodityId: string;
  commodityName: string;
  comparableUnit: ComparableCommodityUnit;
  observations: CommodityPriceObservation[];
  minimumConfidence?: number;
}): CommodityComparison {
  const minimumConfidence = input.minimumConfidence ?? 0.6;
  const accepted = input.observations.filter((observation) =>
    observation.commodityId === input.commodityId &&
    observation.comparableUnit === input.comparableUnit &&
    Number.isFinite(observation.unitPrice) &&
    observation.unitPrice > 0 &&
    clamp(observation.sourceConfidence, 0, 1) >= minimumConfidence
  );
  const rejectedObservationCount = input.observations.length - accepted.length;
  const bestByChain = new Map<string, CommodityPriceObservation>();

  for (const observation of accepted) {
    const current = bestByChain.get(observation.chainId);
    if (
      !current ||
      observation.unitPrice < current.unitPrice ||
      (observation.unitPrice === current.unitPrice && observation.sourceConfidence > current.sourceConfidence) ||
      (observation.unitPrice === current.unitPrice && observation.sourceConfidence === current.sourceConfidence && observation.productName.localeCompare(current.productName) < 0)
    ) {
      bestByChain.set(observation.chainId, observation);
    }
  }

  const ranked = [...bestByChain.values()]
    .sort((left, right) => left.unitPrice - right.unitPrice || right.sourceConfidence - left.sourceConfidence || left.chainId.localeCompare(right.chainId))
    .map((observation, index, observations): CommodityComparisonRow => {
      const next = observations[index + 1];
      const priceGapToNext = next ? roundMoney(next.unitPrice - observation.unitPrice) : 0;
      const savingsVsNextPercent = next && next.unitPrice > 0 ? roundMoney((priceGapToNext / next.unitPrice) * 100) : 0;
      return {
        rank: index + 1,
        commodityId: input.commodityId,
        commodityName: input.commodityName,
        productId: observation.productId,
        productName: observation.productName,
        chainId: observation.chainId,
        chainName: observation.chainName ?? storeNameFromId(observation.chainId),
        unitPrice: roundMoney(observation.unitPrice),
        comparableUnit: input.comparableUnit,
        sourceConfidence: roundMoney(clamp(observation.sourceConfidence, 0, 1)),
        observedAt: observation.observedAt,
        variant: observation.variant,
        isOrganic: observation.isOrganic,
        originCountry: observation.originCountry,
        priceGapToNext,
        savingsVsNextPercent
      };
    });

  const averageConfidence = accepted.length === 0 ? 0 : accepted.reduce((sum, observation) => sum + clamp(observation.sourceConfidence, 0, 1), 0) / accepted.length;
  const status: CommodityComparison['status'] = ranked.length >= 2 ? 'priced' : 'insufficient_coverage';
  const confidenceLabel = status === 'priced'
    ? `${ranked.length} chains, ${accepted.length} confidence-cleared commodity/alias match rows; average source confidence ${roundMoney(averageConfidence * 100)}%.`
    : `${accepted.length} confidence-cleared commodity/alias match rows, but fewer than two chains share ${input.comparableUnit} evidence.`;

  return {
    status,
    commodityId: input.commodityId,
    commodityName: input.commodityName,
    comparableUnit: input.comparableUnit,
    rows: ranked,
    cheapestChain: ranked[0] ?? null,
    coverage: {
      chainCount: ranked.length,
      observationCount: accepted.length,
      rejectedObservationCount,
      comparableUnit: input.comparableUnit
    },
    confidenceLabel
  };
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

export type CommodityMappingReviewCandidate = {
  id: string;
  commodityId: string;
  commodityName: string;
  productId: string;
  productName: string;
  alias: string;
  chainLabel: string;
  sourceConfidence: number;
  createdAt: string;
  reporterId?: string;
  evidence: string[];
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
  subjectType: 'product_match' | 'community_report' | 'commodity_mapping';
  subjectId: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
};

export type HumanReviewDecision = 'approve' | 'reject' | 'needs_more_info';

export type HumanReviewWriteback = {
  action:
    | 'approve_product_match'
    | 'reject_product_match'
    | 'accept_community_report'
    | 'dismiss_community_report'
    | 'approve_commodity_mapping'
    | 'reject_commodity_mapping'
    | 'keep_in_review';
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
  commodityMappings?: CommodityMappingReviewCandidate[];
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

  for (const mapping of input.commodityMappings ?? []) {
    const sourceConfidence = roundMoney(clamp(mapping.sourceConfidence, 0, 1));
    if (sourceConfidence >= 0.75) continue;
    queue.push({
      id: `review-${mapping.id}`,
      subjectType: 'commodity_mapping',
      subjectId: mapping.id,
      priority: sourceConfidence < 0.45 ? 'high' : 'medium',
      reason: `Commodity mapping ${mapping.alias} → ${mapping.commodityName} for ${mapping.productId} has source confidence ${sourceConfidence} and must be validated before shopper-facing coverage.`
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

  if (item.subjectType === 'commodity_mapping') {
    return {
      action: decision === 'approve' ? 'approve_commodity_mapping' : 'reject_commodity_mapping',
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
  role?: 'owner' | 'editor' | 'viewer';
};

export type HouseholdBasketItem = {
  productId: string;
  quantity: number;
  addedBy: string;
  checked?: boolean;
  checkedBy?: string;
  checkedAt?: string;
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
  const canEdit = (userId: string): boolean => {
    const member = input.members.find((candidate) => candidate.userId === userId);
    return member?.role !== 'viewer';
  };
  const cloneBasketItem = (item: HouseholdBasketItem): HouseholdBasketItem => ({
    productId: item.productId,
    quantity: item.quantity,
    addedBy: item.addedBy,
    checked: item.checked ?? false,
    ...(item.checkedBy ? { checkedBy: item.checkedBy } : {}),
    ...(item.checkedAt ? { checkedAt: item.checkedAt } : {})
  });

  return {
    addBasketItem(item: HouseholdBasketItem) {
      requireMember(item.addedBy);
      if (item.checkedBy) {
        requireMember(item.checkedBy);
        if (!canEdit(item.checkedBy)) throw new Error('viewer cannot edit household shopping list');
      }
      if (item.checked && !item.checkedBy) throw new Error('checked household basket items require checkedBy');
      basketItems.push(cloneBasketItem(item));
    },
    checkBasketItem(input: { productId: string; checked: boolean; checkedBy: string; checkedAt?: string }) {
      requireMember(input.checkedBy);
      if (!canEdit(input.checkedBy)) throw new Error('viewer cannot edit household shopping list');
      const item = basketItems.find((candidate) => candidate.productId === input.productId);
      if (!item) throw new Error(`Household basket item not found: ${input.productId}`);
      item.checked = input.checked;
      if (input.checked) {
        item.checkedBy = input.checkedBy;
        item.checkedAt = input.checkedAt;
      } else {
        delete item.checkedBy;
        delete item.checkedAt;
      }
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
        basketItems: basketItems.map(cloneBasketItem),
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
  checkedItemCount: number;
  openItemCount: number;
  memberContributions: Array<{ userId: string; displayName: string; itemCount: number; checkedItemCount: number }>;
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
    checkedItemCount: snapshot.basketItems.filter((item) => item.checked === true).length,
    openItemCount: snapshot.basketItems.filter((item) => item.checked !== true).length,
    memberContributions: snapshot.members.map((member) => ({
      userId: member.userId,
      displayName: member.displayName,
      itemCount: snapshot.basketItems.filter((item) => item.addedBy === member.userId).length,
      checkedItemCount: snapshot.basketItems.filter((item) => item.checkedBy === member.userId).length
    })),
    sharedFavoriteStoreIds: [...snapshot.sharedFavoriteStoreIds]
  };
}


export type ShareableHouseholdListRole = 'viewer' | 'editor';

export type ShareableHouseholdListRecipient = {
  userId?: string;
  email?: string;
  role: ShareableHouseholdListRole;
};

export type ShareableHouseholdListPermission = {
  recipient: string;
  role: ShareableHouseholdListRole;
  canEdit: boolean;
  reason: string;
};

export type ShareableHouseholdListPlan = {
  householdId: string;
  householdName: string;
  requesterUserId: string;
  canShare: boolean;
  itemCount: number;
  memberCount: number;
  shareTokenRequired: boolean;
  expiresAt: string | null;
  permissions: ShareableHouseholdListPermission[];
  blockers: string[];
  guardrails: string[];
};

export function planShareableHouseholdList(snapshot: HouseholdSnapshot, input: {
  requesterUserId: string;
  recipients: ShareableHouseholdListRecipient[];
  expiresAt?: string;
}): ShareableHouseholdListPlan {
  const memberIds = new Set(snapshot.members.map((member) => member.userId));
  const blockers: string[] = [];
  if (!memberIds.has(input.requesterUserId)) blockers.push('requester_not_household_member');
  if (input.recipients.some((recipient) => !recipient.userId && recipient.role === 'editor')) blockers.push('external_invite_cannot_edit');

  const permissions = input.recipients.map<ShareableHouseholdListPermission>((recipient) => {
    const recipientId = recipient.userId ?? recipient.email ?? 'unknown-recipient';
    const isHouseholdMember = !!recipient.userId && memberIds.has(recipient.userId);
    const canEdit = recipient.role === 'editor' && isHouseholdMember;
    return {
      recipient: recipientId,
      role: recipient.role,
      canEdit,
      reason: canEdit ? 'household_member_editor' : recipient.role === 'editor' ? 'external_or_unknown_view_only' : 'viewer_permission'
    };
  });

  return {
    householdId: snapshot.id,
    householdName: snapshot.name,
    requesterUserId: input.requesterUserId,
    canShare: blockers.length === 0,
    itemCount: snapshot.basketItems.length,
    memberCount: snapshot.members.length,
    shareTokenRequired: true,
    expiresAt: input.expiresAt ?? null,
    permissions,
    blockers,
    guardrails: [
      'No anonymous household edits: requester identity must match a signed-in household member before sharing.',
      'External invite links are view-only until the recipient signs in and joins the household.',
      'Shared lists expose product ids, quantities, and store preferences only after an expiring share token is minted server-side.'
    ]
  };
}

export type PantryInventoryItem = {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unit: 'each' | 'kg' | 'g' | 'l' | 'ml' | 'pack';
  minimumQuantity: number;
  targetQuantity?: number;
  expiresAt?: string;
  lastPurchasedAt?: string;
};

export type PantryUsageEvent = {
  productId: string;
  quantityUsed: number;
  usedAt: string;
};

export type PantryDeal = {
  productId: string;
  storeId: string;
  storeName: string;
  price: number;
  dealScore?: number;
};

export type PantryStatus = 'in_stock' | 'low_stock' | 'expiring_soon' | 'expired';

export type PantryInventoryStatus = PantryInventoryItem & {
  remainingQuantity: number;
  status: PantryStatus;
  daysUntilExpiry?: number;
};

export type PantryReplenishment = {
  productId: string;
  name: string;
  quantityToBuy: number;
  unit: PantryInventoryItem['unit'];
  priority: 'high' | 'medium' | 'low';
  reason: string;
  alreadyInBasket: boolean;
  bestDeal?: PantryDeal;
};

export type PantryPlan = {
  householdId?: string;
  statuses: PantryInventoryStatus[];
  replenishment: PantryReplenishment[];
  expiringSoonProductIds: string[];
};

export function planPantryReplenishment(input: {
  pantry: PantryInventoryItem[];
  usage?: PantryUsageEvent[];
  deals?: PantryDeal[];
  now: string;
  household?: HouseholdSnapshot;
  expiringSoonDays?: number;
}): PantryPlan {
  const nowMs = Date.parse(input.now);
  if (Number.isNaN(nowMs)) throw new Error('now must be an ISO date.');
  const expiringSoonDays = input.expiringSoonDays ?? 3;
  const usageByProduct = new Map<string, number>();
  for (const event of input.usage ?? []) {
    if (event.quantityUsed < 0) throw new Error('quantityUsed must be non-negative.');
    if (Number.isNaN(Date.parse(event.usedAt))) throw new Error('usedAt must be an ISO date.');
    usageByProduct.set(event.productId, roundMoney((usageByProduct.get(event.productId) ?? 0) + event.quantityUsed));
  }

  const basketProductIds = new Set((input.household?.basketItems ?? []).map((item) => item.productId));
  const dealByProduct = new Map<string, PantryDeal>();
  for (const deal of input.deals ?? []) {
    const current = dealByProduct.get(deal.productId);
    if (!current || (deal.dealScore ?? 0) > (current.dealScore ?? 0) || ((deal.dealScore ?? 0) === (current.dealScore ?? 0) && deal.price < current.price)) {
      dealByProduct.set(deal.productId, { ...deal });
    }
  }

  const statuses = input.pantry.map((item): PantryInventoryStatus => {
    if (item.quantity < 0 || item.minimumQuantity < 0) throw new Error('pantry quantities must be non-negative.');
    const remainingQuantity = Math.max(0, roundMoney(item.quantity - (usageByProduct.get(item.productId) ?? 0)));
    const daysUntilExpiry = item.expiresAt === undefined ? undefined : Math.ceil((Date.parse(item.expiresAt) - nowMs) / 86_400_000);
    if (daysUntilExpiry !== undefined && Number.isNaN(daysUntilExpiry)) throw new Error(`expiresAt must be an ISO date for ${item.productId}.`);
    const status: PantryStatus =
      daysUntilExpiry !== undefined && daysUntilExpiry < 0
        ? 'expired'
        : daysUntilExpiry !== undefined && daysUntilExpiry <= expiringSoonDays
          ? 'expiring_soon'
          : remainingQuantity <= item.minimumQuantity
            ? 'low_stock'
            : 'in_stock';
    return {
      ...item,
      remainingQuantity,
      status,
      ...(daysUntilExpiry !== undefined ? { daysUntilExpiry } : {})
    };
  });

  const replenishment = statuses
    .filter((item) => item.status === 'low_stock' || item.status === 'expired')
    .map((item): PantryReplenishment => {
      const targetQuantity = item.targetQuantity ?? item.minimumQuantity * 2;
      const quantityToBuy = Math.max(1, roundMoney(targetQuantity - item.remainingQuantity));
      const alreadyInBasket = basketProductIds.has(item.productId);
      return {
        productId: item.productId,
        name: item.name,
        quantityToBuy,
        unit: item.unit,
        priority: item.status === 'expired' ? 'high' : item.remainingQuantity === 0 ? 'high' : 'medium',
        reason: item.status === 'expired' ? 'Expired pantry item should be replaced.' : 'Pantry item is at or below its minimum quantity.',
        alreadyInBasket,
        ...(dealByProduct.has(item.productId) ? { bestDeal: dealByProduct.get(item.productId) } : {})
      };
    })
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 };
      return priorityRank[a.priority] - priorityRank[b.priority] || a.name.localeCompare(b.name);
    });

  return {
    householdId: input.household?.id,
    statuses,
    replenishment,
    expiringSoonProductIds: statuses.filter((item) => item.status === 'expiring_soon').map((item) => item.productId)
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

export type MealCostOffer = {
  chainId: string;
  storeName: string;
  productId: string;
  productName: string;
  packageQuantity: number;
  packageUnit: string;
  packagePrice: number;
  confidence: number;
  source: string;
};

export type MealCostIngredient = {
  ingredientId: string;
  label: string;
  quantityNeeded: number;
  unit: string;
  offers: MealCostOffer[];
};

export type MealCostBreakdownRow = {
  ingredientId: string;
  label: string;
  quantityNeeded: number;
  unit: string;
  selectedProductId: string;
  productName: string;
  chainId: string;
  storeName: string;
  packageQuantity: number;
  packageUnit: string;
  packagePrice: number;
  ingredientCost: number;
  confidence: number;
  source: string;
};

export type MealCostChainOption = {
  chainId: string;
  storeNames: string[];
  coveredIngredients: number;
  ingredientCount: number;
  coverageShare: number;
  totalCost: number;
  costPerServing: number;
  averageConfidence: number;
  eligible: boolean;
};

export type MealCostBreakdown = {
  mealId: string;
  title: string;
  servings: number;
  status: 'priced' | 'insufficient_coverage';
  totalCost: number;
  costPerServing: number;
  cheapestChain: MealCostChainOption | null;
  breakdown: MealCostBreakdownRow[];
  chainOptions: MealCostChainOption[];
  coverage: {
    ingredientCount: number;
    matchedIngredients: number;
    offerCount: number;
    eligibleChainCount: number;
    minimumConfidence: number;
  };
  confidenceLabel: string;
  blockedReason?: string;
};

function ingredientOfferCost(ingredient: MealCostIngredient, offer: MealCostOffer): number | null {
  if (ingredient.unit !== offer.packageUnit) return null;
  if (offer.packageQuantity <= 0 || offer.packagePrice < 0 || ingredient.quantityNeeded <= 0) return null;
  return roundMoney((ingredient.quantityNeeded / offer.packageQuantity) * offer.packagePrice);
}

function mealCostRowFor(ingredient: MealCostIngredient, offer: MealCostOffer): MealCostBreakdownRow | null {
  const ingredientCost = ingredientOfferCost(ingredient, offer);
  if (ingredientCost === null) return null;
  return {
    ingredientId: ingredient.ingredientId,
    label: ingredient.label,
    quantityNeeded: ingredient.quantityNeeded,
    unit: ingredient.unit,
    selectedProductId: offer.productId,
    productName: offer.productName,
    chainId: offer.chainId,
    storeName: offer.storeName,
    packageQuantity: offer.packageQuantity,
    packageUnit: offer.packageUnit,
    packagePrice: offer.packagePrice,
    ingredientCost,
    confidence: offer.confidence,
    source: offer.source
  };
}

function bestMealCostRowForChain(ingredient: MealCostIngredient, chainId: string, minimumConfidence: number): MealCostBreakdownRow | null {
  return ingredient.offers
    .filter((offer) => offer.chainId === chainId && offer.confidence >= minimumConfidence)
    .map((offer) => mealCostRowFor(ingredient, offer))
    .filter((row): row is MealCostBreakdownRow => row !== null)
    .sort((a, b) => a.ingredientCost - b.ingredientCost || b.confidence - a.confidence || a.productName.localeCompare(b.productName))[0] ?? null;
}

export function calculateMealCostBreakdown(input: {
  mealId: string;
  title: string;
  servings: number;
  ingredients: MealCostIngredient[];
  minimumConfidence?: number;
}): MealCostBreakdown {
  if (!input.mealId.trim()) throw new Error('mealId is required.');
  if (!input.title.trim()) throw new Error('title is required.');
  if (input.servings <= 0) throw new Error('servings must be positive.');
  const minimumConfidence = input.minimumConfidence ?? 0.5;
  if (minimumConfidence < 0 || minimumConfidence > 1) throw new Error('minimumConfidence must be between 0 and 1.');
  for (const ingredient of input.ingredients) {
    if (!ingredient.ingredientId.trim()) throw new Error('ingredientId is required.');
    if (!ingredient.label.trim()) throw new Error(`label is required for ${ingredient.ingredientId}.`);
    if (ingredient.quantityNeeded <= 0) throw new Error(`quantityNeeded must be positive for ${ingredient.ingredientId}.`);
  }

  const chainIds = [...new Set(input.ingredients.flatMap((ingredient) => ingredient.offers.map((offer) => offer.chainId)))].sort();
  const chainRows = new Map<string, MealCostBreakdownRow[]>();
  const chainOptions = chainIds.map((chainId): MealCostChainOption => {
    const rows = input.ingredients
      .map((ingredient) => bestMealCostRowForChain(ingredient, chainId, minimumConfidence))
      .filter((row): row is MealCostBreakdownRow => row !== null);
    chainRows.set(chainId, rows);
    const totalCost = roundMoney(rows.reduce((sum, row) => sum + row.ingredientCost, 0));
    const averageConfidence = rows.length === 0 ? 0 : Math.round((rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) * 100) / 100;
    return {
      chainId,
      storeNames: [...new Set(rows.map((row) => row.storeName))].sort(),
      coveredIngredients: rows.length,
      ingredientCount: input.ingredients.length,
      coverageShare: input.ingredients.length === 0 ? 0 : Math.round((rows.length / input.ingredients.length) * 100) / 100,
      totalCost,
      costPerServing: roundMoney(totalCost / input.servings),
      averageConfidence,
      eligible: rows.length === input.ingredients.length && input.ingredients.length > 0
    };
  }).sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return a.totalCost - b.totalCost || b.averageConfidence - a.averageConfidence || a.chainId.localeCompare(b.chainId);
  });

  const cheapestChain = chainOptions.find((option) => option.eligible) ?? null;
  const breakdown = cheapestChain ? (chainRows.get(cheapestChain.chainId) ?? []) : [];
  const matchedIngredients = new Set(
    input.ingredients
      .filter((ingredient) => chainIds.some((chainId) => bestMealCostRowForChain(ingredient, chainId, minimumConfidence) !== null))
      .map((ingredient) => ingredient.ingredientId)
  ).size;
  const offerCount = input.ingredients.reduce((sum, ingredient) => sum + ingredient.offers.filter((offer) => offer.confidence >= minimumConfidence && ingredientOfferCost(ingredient, offer) !== null).length, 0);
  const status: MealCostBreakdown['status'] = cheapestChain ? 'priced' : 'insufficient_coverage';
  const averageConfidencePct = cheapestChain ? Math.round(cheapestChain.averageConfidence * 100) : 0;

  return {
    mealId: input.mealId,
    title: input.title,
    servings: input.servings,
    status,
    totalCost: cheapestChain?.totalCost ?? 0,
    costPerServing: cheapestChain?.costPerServing ?? 0,
    cheapestChain,
    breakdown,
    chainOptions,
    coverage: {
      ingredientCount: input.ingredients.length,
      matchedIngredients,
      offerCount,
      eligibleChainCount: chainOptions.filter((option) => option.eligible).length,
      minimumConfidence
    },
    confidenceLabel: cheapestChain
      ? `${matchedIngredients}/${input.ingredients.length} ingredients priced from real ingredient offer rows; ${chainOptions.filter((option) => option.eligible).length} eligible chains; average confidence ${averageConfidencePct}%.`
      : `${matchedIngredients}/${input.ingredients.length} ingredients have real ingredient offer rows, but no single chain covers the full recipe.`,
    ...(cheapestChain ? {} : { blockedReason: 'No single chain has confidence-cleared offers for every ingredient, so the meal cost stays withheld.' })
  };
}

export type ExpiryDealReport = {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  category: string;
  originalPrice: number;
  currentPrice: number;
  markdownPercent: number;
  expiresAt: string;
  reportedAt: string;
  distanceKm?: number;
  verificationCount: number;
  photoCount: number;
};

export type ExpiryDealRadarInput = {
  reports: ExpiryDealReport[];
  now: string;
  favoriteStoreIds?: string[];
  categoryFilter?: string[];
  maxDistanceKm?: number;
};

export type ExpiryDealRadarItem = ExpiryDealReport & {
  savings: number;
  hoursUntilExpiry: number;
  urgency: 'expires_today' | 'expires_soon' | 'fresh_markdown';
  verification: 'verified' | 'needs_confirmation';
  radarScore: number;
};

export type ExpiryDealRadarStore = {
  storeId: string;
  storeName: string;
  topMarkdownPercent: number;
  items: ExpiryDealRadarItem[];
};

export type ExpiryDealRadarAlert = {
  reportId: string;
  productId: string;
  storeId: string;
  type: 'expiry_markdown';
  message: string;
};

export type ExpiryDealRadar = {
  stores: ExpiryDealRadarStore[];
  alerts: ExpiryDealRadarAlert[];
  staleReportIds: string[];
};

export function buildExpiryDealRadar(input: ExpiryDealRadarInput): ExpiryDealRadar {
  const now = new Date(input.now).getTime();
  if (!Number.isFinite(now)) throw new Error('now must be a valid ISO date.');
  const favoriteStores = new Set(input.favoriteStoreIds ?? []);
  const categories = new Set((input.categoryFilter ?? []).map((category) => category.toLowerCase()));
  const staleReportIds: string[] = [];
  const items: ExpiryDealRadarItem[] = [];

  for (const report of input.reports) {
    const expiresAt = new Date(report.expiresAt).getTime();
    const reportedAt = new Date(report.reportedAt).getTime();
    if (!Number.isFinite(expiresAt) || !Number.isFinite(reportedAt)) throw new Error('report dates must be valid ISO dates.');
    if (report.originalPrice <= 0 || report.currentPrice < 0) throw new Error('report prices must be non-negative and include a positive original price.');
    if (favoriteStores.size > 0 && !favoriteStores.has(report.storeId)) continue;
    if (categories.size > 0 && !categories.has(report.category.toLowerCase())) continue;
    if (input.maxDistanceKm !== undefined && (report.distanceKm === undefined || report.distanceKm > input.maxDistanceKm)) continue;

    const hoursUntilExpiry = Math.round(((expiresAt - now) / 3_600_000) * 100) / 100;
    const reportAgeHours = (now - reportedAt) / 3_600_000;
    if (hoursUntilExpiry < 0 || reportAgeHours > 24) {
      staleReportIds.push(report.id);
      continue;
    }

    const savings = roundMoney(report.originalPrice - report.currentPrice);
    const expiryBoost = hoursUntilExpiry <= 12 ? 30 : hoursUntilExpiry <= 36 ? 18 : 8;
    const verificationBoost = report.verificationCount >= 2 || report.photoCount >= 1 ? 15 : 0;
    const freshnessBoost = Math.max(0, 12 - reportAgeHours);
    const radarScore = Math.round(clamp(report.markdownPercent + expiryBoost + verificationBoost + freshnessBoost, 0, 100));

    items.push({
      ...report,
      savings,
      hoursUntilExpiry,
      urgency: hoursUntilExpiry <= 12 ? 'expires_today' : hoursUntilExpiry <= 36 ? 'expires_soon' : 'fresh_markdown',
      verification: verificationBoost > 0 ? 'verified' : 'needs_confirmation',
      radarScore
    });
  }

  const ranked = items.sort((a, b) => b.radarScore - a.radarScore || a.hoursUntilExpiry - b.hoursUntilExpiry);
  const byStore = new Map<string, ExpiryDealRadarStore>();
  for (const item of ranked) {
    const store = byStore.get(item.storeId) ?? {
      storeId: item.storeId,
      storeName: item.storeName,
      topMarkdownPercent: item.markdownPercent,
      items: []
    };
    store.topMarkdownPercent = Math.max(store.topMarkdownPercent, item.markdownPercent);
    store.items.push(item);
    byStore.set(item.storeId, store);
  }

  return {
    stores: [...byStore.values()].sort((a, b) => b.items[0].radarScore - a.items[0].radarScore),
    alerts: ranked
      .filter((item) => item.radarScore >= 75 && item.verification === 'verified')
      .map((item) => ({
        reportId: item.id,
        productId: item.productId,
        storeId: item.storeId,
        type: 'expiry_markdown',
        message: `${item.productName} is ${item.markdownPercent}% off at ${item.storeName} before expiry.`
      })),
    staleReportIds
  };
}

export type PrivacyExportInput = {
  userId: string;
  lists?: unknown[];
  alerts?: unknown[];
  preferences?: unknown[];
  analyticsEvents?: unknown[];
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
      { name: 'lists', records: input.lists ?? [] },
      { name: 'alerts', records: input.alerts ?? [] },
      { name: 'preferences', records: input.preferences ?? [] },
      { name: 'analytics_events', records: input.analyticsEvents ?? [] },
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

export type PrivacyRequestType = 'data_export' | 'account_deletion' | 'ad_data_opt_out';
export type PrivacyRequestStatus = 'received' | 'in_progress' | 'fulfilled' | 'rejected';

export type PrivacyRequest = {
  id: string;
  userId: string;
  type: PrivacyRequestType;
  receivedAt: string;
  status: PrivacyRequestStatus;
};

export type PrivacyRequestFulfillmentPlanInput = {
  now: string;
  slaDays: number;
  alertBeforeDays: number;
  requests: PrivacyRequest[];
};

export type PrivacyRequestFulfillmentItem = PrivacyRequest & {
  dueAt: string;
  daysUntilDue: number;
  requiredAction: 'fulfill_export' | 'fulfill_deletion' | 'apply_ad_opt_out' | 'none';
  risk: 'overdue' | 'due_soon' | 'on_track' | 'closed';
};

export type PrivacyRequestFulfillmentPlan = {
  status: 'healthy' | 'attention_required';
  items: PrivacyRequestFulfillmentItem[];
  overdueRequestIds: string[];
  dueSoonRequestIds: string[];
};

function privacyRequestAction(type: PrivacyRequestType): PrivacyRequestFulfillmentItem['requiredAction'] {
  if (type === 'data_export') return 'fulfill_export';
  if (type === 'account_deletion') return 'fulfill_deletion';
  return 'apply_ad_opt_out';
}

function wholeDaysBetween(fromMs: number, toMs: number): number {
  return Math.ceil((toMs - fromMs) / 86_400_000);
}

export function planPrivacyRequestFulfillment(input: PrivacyRequestFulfillmentPlanInput): PrivacyRequestFulfillmentPlan {
  const nowMs = Date.parse(input.now);
  if (Number.isNaN(nowMs)) throw new Error('now must be an ISO date.');
  if (!Number.isFinite(input.slaDays) || input.slaDays <= 0) throw new Error('slaDays must be positive.');
  if (!Number.isFinite(input.alertBeforeDays) || input.alertBeforeDays < 0) throw new Error('alertBeforeDays must be non-negative.');

  const overdueRequestIds: string[] = [];
  const dueSoonRequestIds: string[] = [];
  const items = input.requests.map<PrivacyRequestFulfillmentItem>((request) => {
    const receivedAtMs = Date.parse(request.receivedAt);
    if (Number.isNaN(receivedAtMs)) throw new Error(`receivedAt must be an ISO date for ${request.id}.`);

    const dueAtMs = receivedAtMs + input.slaDays * 86_400_000;
    const daysUntilDue = wholeDaysBetween(nowMs, dueAtMs);
    const closed = request.status === 'fulfilled' || request.status === 'rejected';
    const risk = closed ? 'closed' : dueAtMs < nowMs ? 'overdue' : daysUntilDue <= input.alertBeforeDays ? 'due_soon' : 'on_track';

    if (risk === 'overdue') overdueRequestIds.push(request.id);
    if (risk === 'due_soon') dueSoonRequestIds.push(request.id);

    return {
      ...request,
      dueAt: new Date(dueAtMs).toISOString(),
      daysUntilDue,
      requiredAction: closed ? 'none' : privacyRequestAction(request.type),
      risk
    };
  });

  return {
    status: overdueRequestIds.length > 0 || dueSoonRequestIds.length > 0 ? 'attention_required' : 'healthy',
    items,
    overdueRequestIds,
    dueSoonRequestIds
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

export type PersonalInflationItem = {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  baseUnitPrice: number;
  currentUnitPrice: number;
  confidence: 'high' | 'medium' | 'low';
};

export type PersonalInflationContribution = {
  productId: string;
  productName: string;
  category: string;
  changePercent: number;
  changeAmount: number;
  weight: number;
  confidence: 'high' | 'medium' | 'low';
};

export type PersonalInflationConfidence = 'high' | 'medium' | 'low';

export type PersonalInflationSummary = {
  baseDate: string;
  currentDate: string;
  inflationPercent: number;
  changeAmount: number;
  baseSpend: number;
  currentSpend: number;
  confidence: PersonalInflationConfidence;
  itemContributions: PersonalInflationContribution[];
  categoryContributions: { category: string; changePercent: number; spend: number }[];
  missingProductIds: string[];
};

export type PersonalInflationInput = {
  baseDate: string;
  currentDate: string;
  items: PersonalInflationItem[];
  missingProductIds?: string[];
};

function personalInflationConfidenceRank(c: 'high' | 'medium' | 'low'): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1;
}

function summarizeInflationChange(changePercent: number): PersonalInflationConfidence {
  if (changePercent > 5) return 'high';
  if (changePercent > 2) return 'medium';
  return 'low';
}

export function calculatePersonalGroceryInflation(input: PersonalInflationInput): PersonalInflationSummary {
  const { baseDate, currentDate, items, missingProductIds = [] } = input;

  const totalBaseSpend = items.reduce((sum, item) => sum + item.baseUnitPrice * item.quantity, 0);
  const totalCurrentSpend = items.reduce((sum, item) => sum + item.currentUnitPrice * item.quantity, 0);
  const changeAmount = totalCurrentSpend - totalBaseSpend;
  const inflationPercent = totalBaseSpend > 0 ? Math.round((changeAmount / totalBaseSpend) * 1000) / 10 : 0;

  const itemContributions: PersonalInflationContribution[] = items.map((item) => {
    const itemBase = item.baseUnitPrice * item.quantity;
    const itemCurrent = item.currentUnitPrice * item.quantity;
    const itemChange = itemCurrent - itemBase;
    const itemChangePercent = itemBase > 0 ? Math.round((itemChange / itemBase) * 1000) / 10 : 0;
    const weight = totalBaseSpend > 0 ? Math.round((itemBase / totalBaseSpend) * 100) / 100 : 0;
    return {
      productId: item.productId,
      productName: item.productName,
      category: item.category,
      changePercent: itemChangePercent,
      changeAmount: Math.round(itemChange * 100) / 100,
      weight,
      confidence: item.confidence
    };
  });

  const categoryMap = new Map<string, { totalChange: number; totalBase: number }>();
  for (const item of items) {
    const existing = categoryMap.get(item.category) ?? { totalChange: 0, totalBase: 0 };
    const itemBase = item.baseUnitPrice * item.quantity;
    const itemChange = (item.currentUnitPrice - item.baseUnitPrice) * item.quantity;
    categoryMap.set(item.category, {
      totalChange: existing.totalChange + itemChange,
      totalBase: existing.totalBase + itemBase
    });
  }
  const categoryContributions = Array.from(categoryMap.entries()).map(([category, { totalChange, totalBase }]) => ({
    category,
    changePercent: totalBase > 0 ? Math.round((totalChange / totalBase) * 1000) / 10 : 0,
    spend: Math.round(totalBase * 100) / 100
  }));

  const avgConfidenceRank = items.length > 0
    ? items.reduce((sum, item) => sum + personalInflationConfidenceRank(item.confidence), 0) / items.length
    : 0;
  const confidence = summarizeInflationChange(Math.abs(inflationPercent));

  void avgConfidenceRank;

  return {
    baseDate,
    currentDate,
    inflationPercent,
    changeAmount: Math.round(changeAmount * 100) / 100,
    baseSpend: Math.round(totalBaseSpend * 100) / 100,
    currentSpend: Math.round(totalCurrentSpend * 100) / 100,
    confidence,
    itemContributions,
    categoryContributions,
    missingProductIds
  };
}

// ── Chain price index ────────────────────────────────────────────────────────
// Cross-chain "how expensive is this chain" index on a 100-centred scale where
// 100 = the market median for a category. Designed to stay comparable even when
// chains carry different products and coverage is sparse — the explicit ask of
// "for chains we don't have full price information, design a way to do similar":
//   1. caller normalises to unit price (SEK per comparable unit),
//   2. per category the market reference = median unit price across ALL chains,
//      and each chain's category median is expressed as a ratio to it (so a chain
//      is only ever judged against the market for the categories it actually
//      carries — no cross-chain product matching needed),
//   3. thin cells are shrunk toward 1.0 (market) by pseudo-observations, so a
//      single observation can't swing the index,
//   4. categories aggregate via a market-size-weighted GEOMETRIC mean (symmetric
//      to up/down moves),
//   5. coverage + confidence are reported per cell and overall, and low-coverage
//      cells are flagged `estimated` so the UI can mark modelled values honestly.
// Matched-basket refinement (EAN / fuzzy product matching) can layer on top later
// for the categories where it's available, raising confidence without changing
// the scale.

export type ChainPriceObservation = {
  chainId: string;
  category: string;
  unitPrice: number; // SEK per comparable unit (kg / l / pcs)
};

export type ChainCategoryIndex = {
  category: string;
  index: number; // 100 = market median for the category
  observations: number;
  marketReference: number; // market median unit price for the category
  confidence: 'high' | 'medium' | 'low';
  estimated: boolean; // true when coverage is below the confident threshold
};

export type ChainPriceIndex = {
  chainId: string;
  overallIndex: number; // 100 = market-median basket
  observations: number;
  categoriesCovered: number;
  confidence: 'high' | 'medium' | 'low';
  byCategory: ChainCategoryIndex[];
};

export type ChainPriceIndexSummary = {
  chains: ChainPriceIndex[]; // sorted cheapest (lowest index) first
  categories: string[]; // every category present in the market
  marketReferenceByCategory: Record<string, number>;
  generatedFrom: number; // total observations used
};

const CHAIN_INDEX_SHRINKAGE_PRIOR = 4; // pseudo-observations pulling a cell toward the market
const CHAIN_INDEX_MIN_CONFIDENT = 4; // observations before a cell is "measured" not "estimated"

function weightedGeometricMean(values: number[], weights: number[]): number {
  let weightSum = 0;
  let logSum = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (!Number.isFinite(value) || value <= 0) continue;
    const weight = weights[i] ?? 1;
    logSum += weight * Math.log(value);
    weightSum += weight;
  }
  if (weightSum === 0) return 0;
  return Math.exp(logSum / weightSum);
}

export function calculateChainPriceIndex(observations: ChainPriceObservation[]): ChainPriceIndexSummary {
  const usable = observations.filter(
    (o) => Number.isFinite(o.unitPrice) && o.unitPrice > 0 && Boolean(o.chainId) && Boolean(o.category)
  );
  if (usable.length === 0) {
    return { chains: [], categories: [], marketReferenceByCategory: {}, generatedFrom: 0 };
  }

  // Market reference (median unit price) + size per category, across all chains.
  const marketByCategory = new Map<string, number[]>();
  for (const o of usable) {
    const arr = marketByCategory.get(o.category) ?? [];
    arr.push(o.unitPrice);
    marketByCategory.set(o.category, arr);
  }
  const marketReferenceByCategory: Record<string, number> = {};
  const marketCategorySize: Record<string, number> = {};
  for (const [category, prices] of marketByCategory) {
    marketReferenceByCategory[category] = median(prices);
    marketCategorySize[category] = prices.length;
  }
  const categories = [...marketByCategory.keys()].sort((a, b) => a.localeCompare(b));

  // Group observations by chain.
  const byChain = new Map<string, ChainPriceObservation[]>();
  for (const o of usable) {
    const arr = byChain.get(o.chainId) ?? [];
    arr.push(o);
    byChain.set(o.chainId, arr);
  }

  const chains: ChainPriceIndex[] = [];
  for (const [chainId, rows] of byChain) {
    const chainByCategory = new Map<string, number[]>();
    for (const r of rows) {
      const arr = chainByCategory.get(r.category) ?? [];
      arr.push(r.unitPrice);
      chainByCategory.set(r.category, arr);
    }

    const byCategory: ChainCategoryIndex[] = [];
    const ratios: number[] = [];
    const weights: number[] = [];
    for (const [category, prices] of chainByCategory) {
      const reference = marketReferenceByCategory[category];
      if (!reference || reference <= 0) continue;
      const n = prices.length;
      const rawRatio = median(prices) / reference;
      // Shrink toward the market (1.0) by CHAIN_INDEX_SHRINKAGE_PRIOR pseudo-obs.
      const adjustedRatio = (n * rawRatio + CHAIN_INDEX_SHRINKAGE_PRIOR) / (n + CHAIN_INDEX_SHRINKAGE_PRIOR);
      byCategory.push({
        category,
        index: roundMoney(adjustedRatio * 100),
        observations: n,
        marketReference: roundMoney(reference),
        confidence: n >= 12 ? 'high' : n >= CHAIN_INDEX_MIN_CONFIDENT ? 'medium' : 'low',
        estimated: n < CHAIN_INDEX_MIN_CONFIDENT
      });
      ratios.push(adjustedRatio);
      weights.push(marketCategorySize[category] ?? 1);
    }

    byCategory.sort((a, b) => a.category.localeCompare(b.category));
    const overall = roundMoney(weightedGeometricMean(ratios, weights) * 100) || 100;
    const totalObs = rows.length;
    const confidence =
      totalObs >= 30 && byCategory.length >= 4
        ? 'high'
        : totalObs >= 10 && byCategory.length >= 2
          ? 'medium'
          : 'low';

    chains.push({
      chainId,
      overallIndex: overall,
      observations: totalObs,
      categoriesCovered: byCategory.length,
      confidence,
      byCategory
    });
  }

  chains.sort((a, b) => a.overallIndex - b.overallIndex);

  return { chains, categories, marketReferenceByCategory, generatedFrom: usable.length };
}
