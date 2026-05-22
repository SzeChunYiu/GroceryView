import {
  buildPriceChartSeries,
  buildExpiryDealRadar,
  buildWatchlistAlerts,
  calculateBrandTierIndices,
  calculateChainPriceIndex,
  calculateDealScore,
  calculateFixedBasketIndex,
  compareBasketStrategies,
  planBasketFulfillmentSlots,
  planBasketImportExport,
  planBasketTripCost,
  planRetailerBasketTransferSession,
  planRetailerHandoff,
  createHouseholdState,
  rankNutritionPerKrona,
  planPantryReplenishment,
  planRecurringBasketDigest,
  reviewReceiptScan,
  scoreBand,
  searchProducts,
  summarizeBudget,
  summarizePriceHistoryConfidence,
  summarizePriceHistory,
  summarizeHousehold,
  summarizeLocalOfferBasket,
  suggestDealBasedMeals,
  type BasketComparisonResult,
  type BasketImportExportCapturedLine,
  type BasketImportExportPlan,
  type BasketImportExportReviewItem,
  type BasketImportExportSource,
  type BasketFulfillmentSlotsPlan,
  type BasketFulfillmentSlotInput,
  type BasketTripCostPlan,
  type BasketTripCostTravelMode,
  type RetailerBasketTransferSession,
  type RetailerHandoffPlan,
  type RetailerHandoffSupport,
  type BrandTierIndexSummary,
  type BrandTierPriceObservation,
  type BudgetSummary,
  type ChainPriceIndexSummary,
  type ChainPriceObservation,
  type ExpiryDealRadar,
  type ExpiryDealReport,
  type LocalOfferBasketSummary,
  type MealDeal,
  type MealSuggestion,
  type PriceChartAdapterResult,
  type PriceChartObservation,
  type PriceHistoryConfidenceDisclosure,
  type PriceHistorySummary,
  type RecurringBasketCadence,
  type RecurringBasketDigest,
  type ReceiptReview,
  type HouseholdBasketItem,
  type HouseholdMember,
  type HouseholdSnapshot,
  type HouseholdSummary,
  type HouseholdWatchlistItem,
  type NutritionMetric,
  type NutritionProduct,
  type NutritionRank,
  type PantryInventoryItem,
  type PantryPlan,
  type SearchableProduct,
  type StorePrice,
  type WatchlistAlert,
  type WatchlistItem,
  type WatchlistPriceType
} from '@groceryview/core';
import {
  buildAdDeliveryComplianceReport,
  buildAdPlacementPlan,
  buildSubscriptionAccessPolicy,
  type AdDeliveryComplianceReport,
  type AdPlacementPlan,
  type AdSurface,
  type SubscriptionAccessPolicy,
  type SubscriptionEntitlementSnapshot,
  type SubscriptionPlan,
  type UserTier
} from '@groceryview/monetization';

export type Store = {
  id: string;
  name: string;
  chain: string;
  district: string;
  address: string;
  confidence: 'high' | 'medium' | 'low';
};

export type ProductDetail = SearchableProduct & {
  currentPrices: StorePrice[];
  dealScore: number;
  verdict: string;
  unitPrice: string;
  history: Array<{ date: string; price: number; verified: boolean }>;
  dealSignals: {
    currentCityPercentile: number;
    knownPromoHistoryPercentile: number;
    equivalentUnitPricePercentile: number;
    discountDepthPercent: number;
    sourceConfidence: number;
  };
};



export type BasketFulfillmentSlotsReport = BasketFulfillmentSlotsPlan & {
  userId: string;
  basketItemCount: number;
};

export type BasketImportExportRequest = {
  source: BasketImportExportSource;
  capturedLines: BasketImportExportCapturedLine[];
};

export type BasketImportExportReport = BasketImportExportPlan & {
  userId: string;
  importedItemCount: number;
  reviewItemCount: number;
  basketItemCount: number;
};

export type BasketImportReviewStatus = 'open' | 'accepted' | 'dismissed';

export type BasketImportReviewItem = BasketImportExportReviewItem & {
  reviewItemId: string;
  retailerId: string;
  sourceKind: BasketImportExportSource['sourceKind'];
  capturedAt: string;
  status: BasketImportReviewStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedProductId?: string;
};

export type BasketImportReviewQueue = {
  userId: string;
  openItemCount: number;
  items: BasketImportReviewItem[];
  guardrails: string[];
};

export type BasketImportReviewDecisionRequest = {
  decision: 'accept_as_product' | 'dismiss';
  productId?: string;
  quantity?: number;
};

export type ProductCheapestNowChainPrice = {
  chain: string;
  storeId: string;
  storeName: string;
  packagePrice: number;
  comparableUnitPrice: number;
  comparableUnit: string;
};

export type ProductCheapestNow = {
  productId: string;
  productName: string;
  category: string;
  currency: 'SEK';
  cheapest: ProductCheapestNowChainPrice | null;
  chainPrices: ProductCheapestNowChainPrice[];
  chainCount: number;
  observedPriceCount: number;
  lastObservedAt: string | null;
  guardrails: string[];
};

export type ProductLatestPriceConfidence = 'high' | 'medium' | 'low';

export type ProductLatestPriceInput = {
  observationId?: string;
  productId: string;
  productSlug: string;
  productName: string;
  storeSlug?: string;
  storeName?: string;
  chainSlug?: string;
  chainName?: string;
  price?: number;
  unitPrice?: number;
  currency?: string;
  priceType?: ProductPriceHistoryPriceType;
  confidence?: number;
  observedAt?: string;
  provenance?: Record<string, unknown>;
};

export type ProductLatestPrice = {
  observationId: string;
  productId: string;
  productSlug: string;
  productName: string;
  storeId: string;
  storeName: string;
  chain: string;
  chainName: string;
  price: number;
  unitPrice: number;
  currency: 'SEK';
  priceType: ProductPriceHistoryPriceType;
  confidence: ProductLatestPriceConfidence;
  confidenceScore: number;
  observedAt: string;
  sourceType: string;
  provenance: Record<string, unknown>;
};

export type ProductCheapestNowPriceRow = {
  productId: string;
  productSlug: string;
  productName: string;
  categoryPath: string[];
  comparableUnit: string;
  price?: number;
  unitPrice?: number;
  currency?: string;
  observedAt?: string;
  chainSlug?: string;
  chainName?: string;
  storeSlug?: string;
  storeName?: string;
};

export type CategoryPriceIndex = {
  id: string;
  category: string;
  label: string;
  value: number;
  movementPercent: number;
  productCount: number;
  baseDate: string;
  currentDate: string;
};

export type CategoryPriceIndexSummary = {
  currency: 'SEK';
  indices: CategoryPriceIndex[];
  generatedFrom: number;
  guardrails: string[];
};

export type BrandPriceIndexSummary = BrandTierIndexSummary & {
  currency: 'SEK';
  generatedFrom: number;
  guardrails: string[];
};

export type CanonicalPriceType =
  | 'online'
  | 'flyer'
  | 'member'
  | 'in_store'
  | 'receipt'
  | 'shelf_photo'
  | 'manual'
  | 'estimated';

export type PriceAvailability = 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';

export type PriceSourceSurface =
  | 'store_page'
  | 'offer_page'
  | 'flyer'
  | 'receipt'
  | 'shelf_photo'
  | 'manual_form'
  | 'official_index'
  | 'fixture'
  | 'estimate';

export type LegalReviewStatus = 'approved' | 'pending' | 'rejected' | 'stub_only';

export type PriceReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_human_review';

export type PriceConfidenceReason =
  | 'official_source'
  | 'receipt_confirmed'
  | 'ocr_low_confidence'
  | 'member_only'
  | 'stale_snapshot'
  | 'missing_validity_window'
  | 'estimated_price'
  | 'requires_human_review'
  | 'fixture_backed'
  | 'manual_entry';

const watchlistPriceTypes = ['shelf', 'member', 'promotion', 'estimated'] as const satisfies readonly WatchlistPriceType[];

export type ContentDigest = {
  algorithm: 'sha-256' | 'sha-384' | 'sha-512';
  value: string;
};

export type RawSnapshotRef = {
  uri: string;
  contentType?: string;
  retrievedAt: string;
  contentDigest: ContentDigest;
};

export type PriceObservationDto = {
  observationId: string;
  productId: string;
  retailerId: string;
  storeId?: string;
  priceType: CanonicalPriceType;
  packagePrice: number;
  unitPrice: number;
  currency: 'SEK';
  quantityBasis: string;
  observedAt: string;
  validFrom?: string;
  validThrough?: string;
  availability: PriceAvailability;
  membershipRequirement?: string;
  confidence: number;
  confidenceReasons: PriceConfidenceReason[];
  sourceSurface: PriceSourceSurface;
  sourceUrl?: string;
  rawSnapshotRef: RawSnapshotRef;
  captureActivityId: string;
  capturedBy: string;
  legalReviewStatus: LegalReviewStatus;
  reviewStatus: PriceReviewStatus;
};

export type PriceObservationContractIssue =
  | 'missing_observation_id'
  | 'missing_product_id'
  | 'missing_retailer_id'
  | 'missing_price_type'
  | 'missing_unit_or_package_price'
  | 'missing_observed_at'
  | 'invalid_confidence'
  | 'missing_confidence_reasons'
  | 'missing_source_surface'
  | 'missing_raw_snapshot_ref'
  | 'missing_content_digest'
  | 'missing_capture_activity'
  | 'missing_legal_review_status'
  | 'missing_membership_requirement'
  | 'estimated_marked_observed';

const canonicalPriceTypes: CanonicalPriceType[] = [
  'online',
  'flyer',
  'member',
  'in_store',
  'receipt',
  'shelf_photo',
  'manual',
  'estimated'
];

const sourceSurfaces: PriceSourceSurface[] = [
  'store_page',
  'offer_page',
  'flyer',
  'receipt',
  'shelf_photo',
  'manual_form',
  'official_index',
  'fixture',
  'estimate'
];

const legalReviewStatuses: LegalReviewStatus[] = ['approved', 'pending', 'rejected', 'stub_only'];

export function validatePriceObservationDto(input: Partial<PriceObservationDto>): PriceObservationContractIssue[] {
  const issues: PriceObservationContractIssue[] = [];
  if (!input.observationId) issues.push('missing_observation_id');
  if (!input.productId) issues.push('missing_product_id');
  if (!input.retailerId) issues.push('missing_retailer_id');
  if (!input.priceType || !canonicalPriceTypes.includes(input.priceType)) issues.push('missing_price_type');
  if (typeof input.unitPrice !== 'number' || typeof input.packagePrice !== 'number') issues.push('missing_unit_or_package_price');
  if (!input.observedAt || Number.isNaN(Date.parse(input.observedAt))) issues.push('missing_observed_at');
  if (typeof input.confidence !== 'number' || input.confidence < 0 || input.confidence > 1) issues.push('invalid_confidence');
  if (!input.confidenceReasons || input.confidenceReasons.length === 0) issues.push('missing_confidence_reasons');
  if (!input.sourceSurface || !sourceSurfaces.includes(input.sourceSurface)) issues.push('missing_source_surface');
  if (!input.rawSnapshotRef?.uri || !input.rawSnapshotRef.retrievedAt) issues.push('missing_raw_snapshot_ref');
  if (!input.rawSnapshotRef?.contentDigest?.algorithm || !input.rawSnapshotRef.contentDigest.value) issues.push('missing_content_digest');
  if (!input.captureActivityId || !input.capturedBy) issues.push('missing_capture_activity');
  if (!input.legalReviewStatus || !legalReviewStatuses.includes(input.legalReviewStatus)) issues.push('missing_legal_review_status');
  if (input.priceType === 'member' && !input.membershipRequirement) issues.push('missing_membership_requirement');
  if (input.priceType === 'estimated' && input.reviewStatus === 'approved') issues.push('estimated_marked_observed');
  return issues;
}

export function assertPriceObservationDto(input: Partial<PriceObservationDto>): PriceObservationDto {
  const issues = validatePriceObservationDto(input);
  if (issues.length > 0) throw new Error(`Invalid price observation DTO: ${issues.join(', ')}`);
  return input as PriceObservationDto;
}

export type DealScoreReport = {
  productId: string;
  score: number;
  band: ReturnType<typeof scoreBand>;
  verdict: ReturnType<typeof scoreBand>['verdict'];
  discountVsMedianPercent: number;
  historicalPercentile: number;
  confidence: number;
  reasons: string[];
};

export type BasketComparisonReportAssignment = {
  productId: string;
  productName: string;
  quantity: number;
  storeId: string;
  storeName: string;
  unitPrice: number;
  lineTotal: number;
  priceLabel: 'verified_shelf' | 'missing_price' | 'estimated';
  substitutionForProductId?: string;
  substitutionForProductName?: string;
};

export type BasketComparisonReportStrategy = {
  id: 'cheapest_across_selected' | 'all_at_one_store' | 'favorite_only' | 'private_label_substitution';
  label: string;
  total: number | null;
  savingsVsBestSingleStore: number;
  storeCount: number;
  assignments: BasketComparisonReportAssignment[];
  missingProductIds: string[];
  estimatedProductIds: string[];
  warnings: string[];
};

export type BasketComparisonReport = {
  userId: string;
  currency: 'SEK';
  favoriteStoreIds: string[];
  itemCount: number;
  strategies: BasketComparisonReportStrategy[];
  missingProductIds: string[];
  estimatedProductIds: string[];
};

export type LocalOfferBasketReport = LocalOfferBasketSummary & {
  userId: string;
  storeIds: string[];
  basketItemCount: number;
  guardrails: string[];
};

export type RecurringBasketDigestRequest = {
  templateId: string;
  templateName: string;
  cadence: RecurringBasketCadence;
  asOf: string;
  lastPurchasedAt?: string;
};


export type BasketTripCostRequest = {
  travelMode: BasketTripCostTravelMode;
  valueOfTimePerHour?: number;
  carCostPerKm?: number;
  transitFare?: number;
  splitTripPenalty?: number;
};

export type BasketTripCostReport = BasketTripCostPlan & {
  userId: string;
  itemCount: number;
  favoriteStoreIds: string[];
};

export type RetailerHandoffReport = RetailerHandoffPlan & {
  userId: string;
  itemCount: number;
};

export type RetailerBasketTransferSessionReport = RetailerBasketTransferSession & {
  userId: string;
  itemCount: number;
};

export type StoreBasketQuoteLine = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
  priceLabel: 'verified_shelf' | 'missing_price';
};

export type StoreBasketQuote = {
  userId: string;
  storeId: string;
  storeName: string;
  currency: 'SEK';
  itemCount: number;
  pricedItemCount: number;
  total: number | null;
  priceGapVsCheapestComplete: number | null;
  lines: StoreBasketQuoteLine[];
  missingProductIds: string[];
  warnings: string[];
};

export type StorePriceCoverageLine = {
  productId: string;
  productName: string;
  category: string;
  price: number | null;
  unitPrice: string;
  priceLabel: 'verified_shelf' | 'missing_price';
  dealScore: number;
  band: ReturnType<typeof scoreBand>;
};

export type StorePriceCoverageReport = {
  storeId: string;
  storeName: string;
  currency: 'SEK';
  productCount: number;
  pricedProductCount: number;
  coveragePercent: number;
  totalKnownPrice: number;
  missingProductIds: string[];
  lines: StorePriceCoverageLine[];
  guardrails: string[];
};

export type StoreCategoryCoverageRow = {
  category: string;
  productCount: number;
  pricedProductCount: number;
  coveragePercent: number;
  totalKnownPrice: number;
  missingProductIds: string[];
  bestDealProductId: string | null;
  bestDealScore: number | null;
};

export type StoreCategoryCoverageReport = {
  storeId: string;
  storeName: string;
  currency: 'SEK';
  categoryCount: number;
  fullyPricedCategoryCount: number;
  categories: StoreCategoryCoverageRow[];
  guardrails: string[];
};

export type ProductEquivalent = {
  productId: string;
  productName: string;
  category: string;
  bestPrice: number | null;
  bestStoreId: string | null;
  dealScore: number;
  reason: string;
};

export type PriceFreshnessStatus = 'fresh' | 'aging' | 'stale';

export type ProductPriceFreshness = {
  productId: string;
  productName: string;
  category: string;
  latestVerifiedPriceDate: string | null;
  ageDays: number | null;
  status: PriceFreshnessStatus;
  action: 'none' | 'schedule_price_check' | 'prioritize_manual_or_feed_refresh';
};

export type PriceFreshnessReport = {
  asOf: string;
  thresholds: {
    agingAfterDays: number;
    staleAfterDays: number;
  };
  summary: Record<PriceFreshnessStatus, number>;
  products: ProductPriceFreshness[];
  backfillProductIds: string[];
};

export type ProductPriceDistributionScope = 'stockholm' | 'local_area';

export type ProductPriceDistribution = {
  scope: ProductPriceDistributionScope;
  label: string;
  sampleSize: number;
  currentPrice: number;
  currentPercentile: number;
  cheaperThanPercent: number;
  min: number;
  p05: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
  max: number;
  customerRead: string;
};

export type ProductPriceTerminalReport = {
  productId: string;
  ticker: string;
  productName: string;
  asOf: string;
  quote: {
    bestPrice: number | null;
    bestStoreId: string | null;
    bestStoreName: string | null;
    unitPrice: string;
    dealScore: number;
    band: ReturnType<typeof scoreBand>;
    oneMonthMovePercent: number | null;
    range52Week: { low: number; high: number } | null;
    evidenceVolume: { currentPrices: number; historyPoints: number; verifiedHistoryPoints: number };
  };
  distributions: ProductPriceDistribution[];
  chart: PriceChartAdapterResult;
  historySummary: PriceHistorySummary | null;
  evidenceGuardrails: string[];
};

export type ProductPriceSpreadRow = {
  storeId: string;
  storeName: string;
  price: number;
  rank: number;
  deltaFromBest: number;
  deltaFromBestPercent: number;
  priceLabel: 'best' | 'above_best';
};

export type ProductPriceSpreadReport = {
  productId: string;
  ticker: string;
  productName: string;
  currency: 'SEK';
  sampleSize: number;
  bestStoreId: string | null;
  bestStoreName: string | null;
  bestPrice: number | null;
  highestStoreId: string | null;
  highestStoreName: string | null;
  highestPrice: number | null;
  spread: number;
  spreadPercent: number;
  rows: ProductPriceSpreadRow[];
  customerRead: string;
  guardrails: string[];
};

export type ProductHistorySummaryReport = {
  productId: string;
  ticker: string;
  productName: string;
  summary: PriceHistorySummary;
  trend: 'new_low' | 'down' | 'up' | 'flat';
  guardrails: string[];
};

export type ProductHistoryConfidenceReport = {
  productId: string;
  ticker: string;
  productName: string;
  disclosure: PriceHistoryConfidenceDisclosure;
  guardrails: string[];
};

export type ProductPriceHistoryPriceType = 'shelf' | 'online' | 'member' | 'promotion' | 'receipt' | 'community' | 'estimated';

export const productPriceHistoryPriceTypes = ['shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'estimated'] as const satisfies readonly ProductPriceHistoryPriceType[];

export type ProductPriceHistoryObservationInput = {
  observationId: string;
  productId: string;
  productSlug: string;
  productName: string;
  chainId: string;
  chainSlug?: string;
  chainName?: string;
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
  sourceRunId?: string;
  rawRecordId?: string;
  retailerProductRef?: string;
  priceType: ProductPriceHistoryPriceType;
  price: number;
  regularPrice?: number;
  unitPrice: number;
  currency: 'SEK';
  quantity?: number;
  quantityUnit?: string;
  promotionText?: string;
  promotionStartsOn?: string;
  promotionEndsOn?: string;
  memberRequired: boolean;
  observedAt: string;
  validFrom?: string;
  validUntil?: string;
  confidence: number;
  provenance: Record<string, unknown>;
};

export type ProductPriceHistoryProductInput = {
  productId: string;
  productSlug: string;
  productName: string;
};

export type ProductPriceHistoryAppliedFilters = {
  priceType?: ProductPriceHistoryPriceType;
  chain?: string;
  store?: string;
  sourceRun?: string;
  observedFrom?: string;
  observedTo?: string;
  limit?: number;
};

export type ProductPriceHistoryPoint = ProductPriceHistoryObservationInput;

export type ProductPriceHistoryReport = {
  productId: string;
  productSlug: string;
  productName: string;
  currency: 'SEK';
  filters: ProductPriceHistoryAppliedFilters;
  pointCount: number;
  observedFrom: string | null;
  observedTo: string | null;
  priceTypes: ProductPriceHistoryPriceType[];
  points: ProductPriceHistoryPoint[];
  summary: PriceHistorySummary | null;
  guardrails: string[];
};

export type ProductStoreSavingsRow = {
  storeId: string;
  storeName: string;
  price: number;
  rank: number;
  savingsVsHighest: number;
  savingsVsHighestPercent: number;
  priceLabel: 'best_savings' | 'saves_vs_highest' | 'highest_price';
};

export type ProductStoreSavingsReport = {
  productId: string;
  ticker: string;
  productName: string;
  currency: 'SEK';
  sampleSize: number;
  bestStoreId: string | null;
  bestStoreName: string | null;
  bestPrice: number | null;
  highestStoreId: string | null;
  highestStoreName: string | null;
  highestPrice: number | null;
  maxSavings: number;
  maxSavingsPercent: number;
  rows: ProductStoreSavingsRow[];
  customerRead: string;
  guardrails: string[];
};

export type MarketMover = {
  productId: string;
  ticker: string;
  productName: string;
  currentPrice: number | null;
  bestStoreId: string | null;
  bestStoreName: string | null;
  oneMonthMovePercent: number | null;
  range52Week: { low: number; high: number } | null;
  range52WeekPositionPercent: number | null;
  stockholmMedianGap: number | null;
  historyPoints: number;
  verifiedHistoryPoints: number;
};

export type CategoryMarketRow = MarketMover & {
  category: string;
  unitPrice: string;
  dealScore: number;
  band: ReturnType<typeof scoreBand>;
  customerRead: string;
};

export type CategoryMarketReport = {
  category: string;
  city: string;
  productCount: number;
  topDeal: { productId: string; currentPrice: number | null; dealScore: number } | null;
  rows: CategoryMarketRow[];
  guardrails: string[];
};

export type StoreDeal = {
  productId: string;
  ticker: string;
  productName: string;
  category: string;
  storeId: string;
  storeName: string;
  price: number;
  dealScore: number;
  band: ReturnType<typeof scoreBand>;
  unitPrice: string;
};

export type StoreDealSummaryCategory = {
  category: string;
  dealCount: number;
  averageDealScore: number;
  topProductId: string;
  topDealScore: number;
};

export type StoreDealSummaryReport = {
  storeId: string;
  storeName: string;
  dealCount: number;
  buyVerdictCount: number;
  averageDealScore: number;
  topDeal: StoreDeal | null;
  categories: StoreDealSummaryCategory[];
  guardrails: string[];
};

export type FlyerOfferPriceType = 'flyer' | 'member_flyer';

export type FlyerOffer = {
  offerId: string;
  flyerId: string;
  chain: string;
  storeId: string;
  storeName: string;
  branchDistrict: string;
  productId: string;
  productName: string;
  category: string;
  regularPrice: number;
  offerPrice: number;
  savings: number;
  discountPercent: number;
  currency: 'SEK';
  priceType: FlyerOfferPriceType;
  validFrom: string;
  validThrough: string;
  observedAt: string;
  sourceType: 'weekly_flyer';
  sourceUrl: string;
  sourceRunId: string;
  confidence: number;
  dealScore: number;
  band: ReturnType<typeof scoreBand>;
};

export type FlyerOfferObservationInput = {
  observationId: string;
  sourceRunId?: string;
  rawRecordId?: string;
  priceType: 'promotion' | 'member';
  price: number;
  regularPrice: number;
  currency: 'SEK';
  promotionText?: string;
  promotionStartsOn?: string;
  promotionEndsOn?: string;
  memberRequired: boolean;
  observedAt: string;
  validFrom?: string;
  validUntil?: string;
  confidence: number;
  provenance: Record<string, unknown>;
  productId: string;
  productSlug: string;
  productName: string;
  categoryPath: string[];
  chainId: string;
  chainSlug: string;
  chainName: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeCity?: string;
};

export type FlyerOfferStoreSummary = {
  storeId: string;
  storeName: string;
  chain: string;
  offerCount: number;
  totalOneEachSavings: number;
  topOfferId: string;
  topDealScore: number;
};

export type FlyerOfferReport = {
  asOf: string;
  filters: {
    storeId?: string;
    chain?: string;
    category?: string;
    productId?: string;
  };
  offerCount: number;
  stores: FlyerOfferStoreSummary[];
  offers: FlyerOffer[];
  guardrails: string[];
};

export type StoreFlyerOfferReport = {
  storeId: string;
  storeName: string;
  chain: string;
  asOf: string;
  offerCount: number;
  categoryCount: number;
  totalOneEachSavings: number;
  bestOffer: FlyerOffer | null;
  offers: FlyerOffer[];
  guardrails: string[];
};

export type BasketItemRequest = {
  productId: string;
  quantity: number;
};

export type WatchlistPriceAlertRequest = {
  productId: string;
  targetPrice: number;
  favoriteStoresOnly?: boolean;
  allowedPriceTypes?: WatchlistPriceType[];
};

export type WatchlistPriceAlertReport = {
  userId: string;
  trackedItemCount: number;
  alertCount: number;
  alerts: WatchlistAlert[];
  guardrails: string[];
};

export type UserBudgetPatch = {
  weeklyBudget: number;
  monthlyBudget: number;
};

export type CategoryBudgetPatch = {
  category: string;
  weeklyBudget: number;
};

export type CategoryBudgetLine = {
  category: string;
  weeklyBudget: number;
  estimatedSpend: number;
  remaining: number;
  status: 'under' | 'over';
  productIds: string[];
};

export type CategoryBudgetSummary = {
  userId: string;
  categories: CategoryBudgetLine[];
  unbudgetedCategories: Array<{
    category: string;
    estimatedSpend: number;
    productIds: string[];
  }>;
};

export type HouseholdPlanRequest = {
  householdId: string;
  name: string;
  weeklyBudget: number;
  approvalLimit: number;
  reviewer: string;
  members: HouseholdMember[];
  basketItems?: HouseholdBasketItem[];
  watchlistItems?: HouseholdWatchlistItem[];
  sharedFavoriteStoreIds?: string[];
};

export type HouseholdApprovalPolicy = {
  approvalLimit: number;
  reviewer: string;
  requiresOwnerApproval: boolean;
};

export type HouseholdPlan = {
  household: HouseholdSnapshot;
  summary: HouseholdSummary;
  approvalPolicy: HouseholdApprovalPolicy;
};

export type NutritionValueReport = {
  metric: NutritionMetric;
  currency: 'SEK';
  rows: NutritionRank[];
  leader: {
    productId: string;
    name: string;
    valuePer10Sek: number;
    saltWarning: boolean;
  } | null;
  guardrails: string[];
};

export type MealPlanSuggestionsReport = {
  userId: string;
  currency: 'SEK';
  servings: number;
  maxMealCost: number;
  suggestions: MealSuggestion[];
  dealCount: number;
  ingredientProductIds: string[];
  guardrails: string[];
};

export type ExpiryDealRadarReport = ExpiryDealRadar & {
  userId: string;
  now: string;
  favoriteStoreIds: string[];
  categoryFilter: string[];
  maxDistanceKm?: number;
  reportCount: number;
  guardrails: string[];
};

export type LoyaltyOfferStatus = 'eligible' | 'needs_coupon' | 'needs_membership';

export type LoyaltyOffer = {
  productId: string;
  productName: string;
  chain: string;
  publicShelfPrice: number;
  memberPrice: number;
  savings: number;
  requirement: string;
  status: LoyaltyOfferStatus;
  actionRequired: boolean;
};

export type LoyaltyOfferReport = {
  userId: string;
  offers: LoyaltyOffer[];
  totalEligibleSavings: number;
  requiresActionCount: number;
  membershipRequiredCount: number;
  guardrails: string[];
};

export type ReceiptReviewReport = {
  userId: string;
  review: ReceiptReview;
  lineCount: number;
  matchedCount: number;
  needsReviewCount: number;
  guardrails: string[];
};

export type AdDisclosureReport = {
  userId: string;
  userTier: UserTier;
  placementPlan: AdPlacementPlan;
  compliance: AdDeliveryComplianceReport;
  allowedCount: number;
  blockedCount: number;
  excludedSurfaces: AdSurface[];
  premiumAdsRemoved: boolean;
  affectsDealScore: false;
  guardrails: string[];
};

export type NotificationInboxQueueItem = {
  id: string;
  title: string;
  channel: 'push' | 'email';
  status: 'delivered' | 'held' | 'suppressed';
  reason: string;
  action: string;
  priority: 'normal' | 'high';
  productId?: string;
};

export type NotificationInboxReport = {
  userId: string;
  trackedItemCount: number;
  activeAlertCount: number;
  deliveredCount: number;
  heldCount: number;
  suppressedCount: number;
  summary: {
    delivered: number;
    held: number;
    suppressed: number;
    total: number;
  };
  queue: NotificationInboxQueueItem[];
  quietHoursWindow: string;
  guardrails: string[];
};

export type RealCatalogPriceType = 'shelf' | 'online' | 'member' | 'promotion' | 'receipt' | 'community' | 'estimated';

export type RealCatalogSearchPriceRow = {
  productId: string;
  slug: string;
  canonicalName: string;
  brand?: string;
  categoryPath: string[];
  packageSize?: number;
  packageUnit?: string;
  comparableUnit: string;
  imageUrl?: string;
  observationId?: string;
  price?: number;
  unitPrice?: number;
  currency?: string;
  priceType?: RealCatalogPriceType;
  confidence?: number;
  observedAt?: string;
  chainId?: string;
  chainSlug?: string;
  chainName?: string;
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
};

export type FacetedProductSearchFilters = {
  query?: string;
  categories?: string[];
  brands?: string[];
  chains?: string[];
  stores?: string[];
  priceTypes?: RealCatalogPriceType[];
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
};

export type FacetedProductSearchResult = {
  query: string;
  filters: Required<Pick<FacetedProductSearchFilters, 'categories' | 'brands' | 'chains' | 'stores' | 'priceTypes'>> & {
    minPrice: number | null;
    maxPrice: number | null;
    limit: number;
  };
  count: number;
  products: Array<{
    productId: string;
    slug: string;
    canonicalName: string;
    brand: string | null;
    categoryPath: string[];
    packageSize: number | null;
    packageUnit: string | null;
    comparableUnit: string;
    imageUrl: string | null;
    cheapestPrice: number | null;
    currency: string;
    currentPrices: Array<{
      observationId: string;
      price: number;
      unitPrice: number;
      currency: string;
      priceType: RealCatalogPriceType;
      confidence: number;
      observedAt: string;
      chainId: string;
      chainSlug: string;
      chainName: string;
      storeId: string | null;
      storeSlug: string | null;
      storeName: string | null;
    }>;
  }>;
  facets: {
    categories: Array<{ value: string; count: number }>;
    brands: Array<{ value: string; count: number }>;
    chains: Array<{ value: string; label: string; count: number }>;
    stores: Array<{ value: string; label: string; count: number }>;
    priceTypes: Array<{ value: RealCatalogPriceType; count: number }>;
    priceRange: { min: number | null; max: number | null };
  };
  evidence: {
    pricedProductCount: number;
    latestPriceCount: number;
    sourceTables: ['products', 'latest_prices', 'chains', 'stores'];
  };
};

export type RealBasketCompareItem = {
  productId: string;
  quantity: number;
};

export type RealBasketCompareInput = {
  userId?: string;
  items: RealBasketCompareItem[];
  selectedStoreSlugs?: string[];
  latestPrices: RealCatalogSearchPriceRow[];
};

export type RealBasketCompareResult = {
  userId: string | null;
  currency: 'SEK';
  itemCount: number;
  selectedStoreSlugs: string[];
  strategies: Array<{
    id: 'cheapest_across_selected' | 'all_at_one_store';
    label: string;
    total: number | null;
    storeCount: number;
    assignments: Array<{
      productId: string;
      slug: string;
      productName: string;
      quantity: number;
      storeSlug: string | null;
      storeName: string | null;
      unitPrice: number | null;
      lineTotal: number | null;
      priceLabel: 'verified_latest_price' | 'missing_price';
      observationId?: string;
      observedAt?: string;
      confidence?: number;
    }>;
    missingProductIds: string[];
    warnings: string[];
  }>;
  missingProductIds: string[];
  evidence: {
    latestPriceCount: number;
    sourceTables: ['basket_items', 'weekly_baskets', 'products', 'latest_prices', 'stores'];
  };
};

function normalizedList(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedFacet(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildFacetedProductSearch(input: {
  rows: RealCatalogSearchPriceRow[];
  filters?: FacetedProductSearchFilters;
}): FacetedProductSearchResult {
  const filters = input.filters ?? {};
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const productMap = new Map<string, FacetedProductSearchResult['products'][number]>();
  const categoryFacet = new Map<string, number>();
  const brandFacet = new Map<string, number>();
  const chainFacet = new Map<string, { label: string; count: number }>();
  const storeFacet = new Map<string, { label: string; count: number }>();
  const priceTypeFacet = new Map<RealCatalogPriceType, number>();
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let latestPriceCount = 0;

  for (const row of input.rows) {
    let product = productMap.get(row.productId);
    if (!product) {
      product = {
        productId: row.productId,
        slug: row.slug,
        canonicalName: row.canonicalName,
        brand: row.brand ?? null,
        categoryPath: [...row.categoryPath],
        packageSize: row.packageSize ?? null,
        packageUnit: row.packageUnit ?? null,
        comparableUnit: row.comparableUnit,
        imageUrl: row.imageUrl ?? null,
        cheapestPrice: null,
        currency: row.currency ?? 'SEK',
        currentPrices: []
      };
      productMap.set(row.productId, product);
      for (const category of row.categoryPath) increment(categoryFacet, category);
      if (row.brand) increment(brandFacet, row.brand);
    }

    if (
      row.observationId &&
      typeof row.price === 'number' &&
      typeof row.unitPrice === 'number' &&
      row.priceType &&
      row.confidence !== undefined &&
      row.observedAt &&
      row.chainId &&
      row.chainSlug &&
      row.chainName
    ) {
      latestPriceCount += 1;
      product.cheapestPrice = product.cheapestPrice === null ? row.price : Math.min(product.cheapestPrice, row.price);
      minPrice = minPrice === null ? row.price : Math.min(minPrice, row.price);
      maxPrice = maxPrice === null ? row.price : Math.max(maxPrice, row.price);
      product.currentPrices.push({
        observationId: row.observationId,
        price: row.price,
        unitPrice: row.unitPrice,
        currency: row.currency ?? 'SEK',
        priceType: row.priceType,
        confidence: row.confidence,
        observedAt: row.observedAt,
        chainId: row.chainId,
        chainSlug: row.chainSlug,
        chainName: row.chainName,
        storeId: row.storeId ?? null,
        storeSlug: row.storeSlug ?? null,
        storeName: row.storeName ?? null
      });
      const chain = chainFacet.get(row.chainSlug) ?? { label: row.chainName, count: 0 };
      chain.count += 1;
      chainFacet.set(row.chainSlug, chain);
      if (row.storeSlug && row.storeName) {
        const store = storeFacet.get(row.storeSlug) ?? { label: row.storeName, count: 0 };
        store.count += 1;
        storeFacet.set(row.storeSlug, store);
      }
      increment(priceTypeFacet, row.priceType);
    }
  }

  const products = [...productMap.values()]
    .map((product) => ({
      ...product,
      currentPrices: product.currentPrices.sort((a, b) => a.price - b.price || b.observedAt.localeCompare(a.observedAt))
    }))
    .sort((a, b) => {
      if (a.cheapestPrice === null && b.cheapestPrice !== null) return 1;
      if (a.cheapestPrice !== null && b.cheapestPrice === null) return -1;
      if (a.cheapestPrice !== null && b.cheapestPrice !== null && a.cheapestPrice !== b.cheapestPrice) return a.cheapestPrice - b.cheapestPrice;
      return a.canonicalName.localeCompare(b.canonicalName);
    })
    .slice(0, limit);

  return {
    query: filters.query?.trim() ?? '',
    filters: {
      categories: normalizedList(filters.categories),
      brands: normalizedList(filters.brands),
      chains: normalizedList(filters.chains),
      stores: normalizedList(filters.stores),
      priceTypes: [...(filters.priceTypes ?? [])].sort((a, b) => a.localeCompare(b)),
      minPrice: filters.minPrice ?? null,
      maxPrice: filters.maxPrice ?? null,
      limit
    },
    count: products.length,
    products,
    facets: {
      categories: sortedFacet(categoryFacet),
      brands: sortedFacet(brandFacet),
      chains: [...chainFacet.entries()]
        .map(([value, facet]) => ({ value, label: facet.label, count: facet.count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      stores: [...storeFacet.entries()]
        .map(([value, facet]) => ({ value, label: facet.label, count: facet.count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      priceTypes: [...priceTypeFacet.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      priceRange: { min: minPrice, max: maxPrice }
    },
    evidence: {
      pricedProductCount: products.filter((product) => product.currentPrices.length > 0).length,
      latestPriceCount,
      sourceTables: ['products', 'latest_prices', 'chains', 'stores']
    }
  };
}

export function buildRealBasketComparison(input: RealBasketCompareInput): RealBasketCompareResult {
  const selectedStoreSlugs = normalizedList(input.selectedStoreSlugs);
  const itemOrder = new Map(input.items.map((item, index) => [item.productId, index]));
  const rowsByProduct = new Map<string, RealCatalogSearchPriceRow[]>();
  const productNames = new Map<string, { slug: string; canonicalName: string }>();

  for (const row of input.latestPrices) {
    if (!itemOrder.has(row.productId)) continue;
    productNames.set(row.productId, { slug: row.slug, canonicalName: row.canonicalName });
    if (selectedStoreSlugs.length > 0 && (!row.storeSlug || !selectedStoreSlugs.includes(row.storeSlug))) continue;
    if (!row.observationId || typeof row.price !== 'number') continue;
    const rows = rowsByProduct.get(row.productId) ?? [];
    rows.push(row);
    rowsByProduct.set(row.productId, rows);
  }

  const missingProductIds = input.items.filter((item) => !rowsByProduct.has(item.productId)).map((item) => item.productId);
  const cheapestAssignments = input.items.map((item) => {
    const product = productNames.get(item.productId);
    const prices = [...(rowsByProduct.get(item.productId) ?? [])].sort(
      (a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY) || (a.storeName ?? '').localeCompare(b.storeName ?? '')
    );
    const best = prices[0];
    return {
      productId: item.productId,
      slug: product?.slug ?? item.productId,
      productName: product?.canonicalName ?? item.productId,
      quantity: item.quantity,
      storeSlug: best?.storeSlug ?? null,
      storeName: best?.storeName ?? null,
      unitPrice: best?.price ?? null,
      lineTotal: best?.price === undefined ? null : money(best.price * item.quantity),
      priceLabel: best ? ('verified_latest_price' as const) : ('missing_price' as const),
      ...(best?.observationId ? { observationId: best.observationId } : {}),
      ...(best?.observedAt ? { observedAt: best.observedAt } : {}),
      ...(best?.confidence !== undefined ? { confidence: best.confidence } : {})
    };
  });

  const storeSlugs = selectedStoreSlugs.length > 0 ? selectedStoreSlugs : normalizedList(input.latestPrices.map((row) => row.storeSlug ?? ''));
  const completeStoreQuotes = storeSlugs
    .map((storeSlug) => {
      const assignments = input.items.map((item) => {
        const product = productNames.get(item.productId);
        const best = [...(rowsByProduct.get(item.productId) ?? [])]
          .filter((row) => row.storeSlug === storeSlug)
          .sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY))[0];
        return {
          productId: item.productId,
          slug: product?.slug ?? item.productId,
          productName: product?.canonicalName ?? item.productId,
          quantity: item.quantity,
          storeSlug: best?.storeSlug ?? storeSlug,
          storeName: best?.storeName ?? null,
          unitPrice: best?.price ?? null,
          lineTotal: best?.price === undefined ? null : money(best.price * item.quantity),
          priceLabel: best ? ('verified_latest_price' as const) : ('missing_price' as const),
          ...(best?.observationId ? { observationId: best.observationId } : {}),
          ...(best?.observedAt ? { observedAt: best.observedAt } : {}),
          ...(best?.confidence !== undefined ? { confidence: best.confidence } : {})
        };
      });
      return {
        storeSlug,
        assignments,
        missingProductIds: assignments.filter((assignment) => assignment.priceLabel === 'missing_price').map((assignment) => assignment.productId),
        total: assignments.every((assignment) => assignment.lineTotal !== null)
          ? money(assignments.reduce((sum, assignment) => sum + (assignment.lineTotal ?? 0), 0))
          : null
      };
    })
    .filter((quote) => quote.total !== null)
    .sort((a, b) => (a.total ?? Number.POSITIVE_INFINITY) - (b.total ?? Number.POSITIVE_INFINITY));

  const cheapestTotal = cheapestAssignments.every((assignment) => assignment.lineTotal !== null)
    ? money(cheapestAssignments.reduce((sum, assignment) => sum + (assignment.lineTotal ?? 0), 0))
    : null;
  const bestSingleStore = completeStoreQuotes[0];

  return {
    userId: input.userId ?? null,
    currency: 'SEK',
    itemCount: input.items.length,
    selectedStoreSlugs,
    strategies: [
      {
        id: 'cheapest_across_selected',
        label: 'Cheapest across selected stores',
        total: cheapestTotal,
        storeCount: new Set(cheapestAssignments.map((assignment) => assignment.storeSlug).filter(Boolean)).size,
        assignments: cheapestAssignments,
        missingProductIds,
        warnings:
          missingProductIds.length === 0
            ? ['Basket totals use persisted latest_prices rows only.']
            : ['Some basket items are missing persisted latest_prices rows for the selected stores.']
      },
      {
        id: 'all_at_one_store',
        label: 'Best single store',
        total: bestSingleStore?.total ?? null,
        storeCount: bestSingleStore ? 1 : 0,
        assignments: bestSingleStore?.assignments ?? [],
        missingProductIds: bestSingleStore?.missingProductIds ?? input.items.map((item) => item.productId),
        warnings: bestSingleStore
          ? ['Single-store quote uses persisted latest_prices rows only.']
          : ['No selected store has persisted prices for every basket item.']
      }
    ],
    missingProductIds,
    evidence: {
      latestPriceCount: input.latestPrices.filter((row) => row.observationId).length,
      sourceTables: ['basket_items', 'weekly_baskets', 'products', 'latest_prices', 'stores']
    }
  };
}

const stores: Store[] = [
  { id: 'willys-odenplan', name: 'Willys Odenplan', chain: 'willys', district: 'Odenplan', address: 'Odenplan, Stockholm', confidence: 'high' },
  { id: 'lidl-sveavagen', name: 'Lidl Sveavägen', chain: 'lidl', district: 'Norrmalm', address: 'Sveavägen, Stockholm', confidence: 'medium' },
  { id: 'coop-odenplan', name: 'Coop Odenplan', chain: 'coop', district: 'Odenplan', address: 'Odenplan, Stockholm', confidence: 'medium' }
];


const storeTravelProfiles: Record<string, { distanceKm: number; durationMinutes: number }> = {
  'willys-odenplan': { distanceKm: 0.5, durationMinutes: 5.29 },
  'lidl-sveavagen': { distanceKm: 0.8, durationMinutes: 7 },
  'coop-odenplan': { distanceKm: 0.4, durationMinutes: 4 }
};

const retailerHandoffSupport: Record<string, { retailerName: string; support: RetailerHandoffSupport; productUrlBase?: string }> = {
  willys: {
    retailerName: 'Willys',
    productUrlBase: 'https://www.willys.se/sok?q=',
    support: {
      productDeepLinks: 'supported',
      basketTransfer: 'unsupported',
      copyList: 'supported',
      retailerAppSearch: 'manual',
      checkoutConfirmation: 'unsupported'
    }
  },
  coop: {
    retailerName: 'Coop',
    productUrlBase: 'https://www.coop.se/sok/?q=',
    support: {
      productDeepLinks: 'supported',
      basketTransfer: 'unsupported',
      copyList: 'supported',
      retailerAppSearch: 'manual',
      checkoutConfirmation: 'unsupported'
    }
  },
  lidl: {
    retailerName: 'Lidl',
    support: {
      productDeepLinks: 'manual',
      basketTransfer: 'unsupported',
      copyList: 'supported',
      retailerAppSearch: 'manual',
      checkoutConfirmation: 'unsupported'
    }
  }
};

const products: ProductDetail[] = [
  {
    id: 'coffee',
    ticker: 'ZOEGAS-COFFEE-450G',
    name: 'Zoégas Coffee 450g',
    category: 'coffee',
    brandTier: 'national',
    availableChains: ['willys', 'lidl', 'coop'],
    currentPrices: [
      { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9 },
      { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 59.9 },
      { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', price: 64.9 }
    ],
    dealScore: calculateDealScore({ currentCityPercentile: 8, knownPromoHistoryPercentile: 12, equivalentUnitPricePercentile: 18, discountDepthPercent: 25, sourceConfidence: 0.9 }),
    verdict: 'Buy',
    unitPrice: '110.89 SEK/kg',
    dealSignals: { currentCityPercentile: 8, knownPromoHistoryPercentile: 12, equivalentUnitPricePercentile: 18, discountDepthPercent: 25, sourceConfidence: 0.9 },
    history: [
      { date: '2026-04-01', price: 69.9, verified: true },
      { date: '2026-05-01', price: 59.9, verified: true },
      { date: '2026-05-19', price: 49.9, verified: true }
    ]
  },
  {
    id: 'milk',
    ticker: 'ARLA-MILK-1L',
    name: 'Arla Milk 1L',
    category: 'dairy',
    brandTier: 'national',
    availableChains: ['ica', 'willys', 'lidl'],
    currentPrices: [
      { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9 },
      { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9 }
    ],
    dealScore: calculateDealScore({ currentCityPercentile: 18, knownPromoHistoryPercentile: 12, equivalentUnitPricePercentile: 35, discountDepthPercent: 8, sourceConfidence: 0.86 }),
    verdict: 'Buy',
    unitPrice: '14.90 SEK/l',
    dealSignals: { currentCityPercentile: 18, knownPromoHistoryPercentile: 12, equivalentUnitPricePercentile: 35, discountDepthPercent: 8, sourceConfidence: 0.86 },
    history: [
      { date: '2026-04-01', price: 16.9, verified: true },
      { date: '2026-05-19', price: 14.9, verified: true }
    ]
  }
,
  {
    id: 'private-label-milk',
    ticker: 'GARANT-MILK-1L',
    name: 'Garant Milk 1L',
    category: 'dairy',
    brandTier: 'standard_private_label',
    availableChains: ['willys'],
    currentPrices: [
      { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 12.9 }
    ],
    dealScore: calculateDealScore({ currentCityPercentile: 22, knownPromoHistoryPercentile: 25, equivalentUnitPricePercentile: 10, discountDepthPercent: 12, sourceConfidence: 0.82 }),
    verdict: 'Buy',
    unitPrice: '12.90 SEK/l',
    dealSignals: { currentCityPercentile: 22, knownPromoHistoryPercentile: 25, equivalentUnitPricePercentile: 10, discountDepthPercent: 12, sourceConfidence: 0.82 },
    history: [
      { date: '2026-05-01', price: 13.9, verified: true },
      { date: '2026-05-19', price: 12.9, verified: true }
    ]
  },
  {
    id: 'butter',
    ticker: 'BUTTER-600G',
    name: 'Butter 600g',
    category: 'dairy',
    brandTier: 'national',
    availableChains: ['willys', 'coop'],
    currentPrices: [
      { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', price: 54.9 },
      { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 56.9 }
    ],
    dealScore: calculateDealScore({ currentCityPercentile: 58, knownPromoHistoryPercentile: 61, equivalentUnitPricePercentile: 52, discountDepthPercent: 2, sourceConfidence: 0.72 }),
    verdict: 'Wait',
    unitPrice: '91.50 SEK/kg',
    dealSignals: { currentCityPercentile: 58, knownPromoHistoryPercentile: 61, equivalentUnitPricePercentile: 52, discountDepthPercent: 2, sourceConfidence: 0.72 },
    history: [
      { date: '2026-04-01', price: 52.9, verified: true },
      { date: '2026-05-19', price: 54.9, verified: true }
    ]
  }
];

const nutritionProducts: NutritionProduct[] = [
  { productId: 'chicken', name: 'Chicken thighs', price: 69.9, nutritionPerPackage: { proteinGrams: 160, calories: 900, fiberGrams: 0, sugarGrams: 0, saltGrams: 2.4 } },
  { productId: 'eggs', name: 'Eggs 12-pack', price: 34.9, nutritionPerPackage: { proteinGrams: 75, calories: 840, fiberGrams: 0, sugarGrams: 1, saltGrams: 1.8 } },
  { productId: 'yogurt', name: 'Greek yogurt', price: 34.9, nutritionPerPackage: { proteinGrams: 55, calories: 380, fiberGrams: 0, sugarGrams: 16, saltGrams: 0.5 } }
];

const mealDeals: MealDeal[] = [
  { productId: 'chicken', name: 'Chicken thighs', category: 'protein', price: 69.9, dealScore: 91 },
  { productId: 'pasta', name: 'Pasta', category: 'pantry', price: 14.9, dealScore: 82 },
  { productId: 'tomatoes', name: 'Tomatoes', category: 'vegetables', price: 19.9, dealScore: 79 },
  { productId: 'milk', name: 'Arla Milk 1L', category: 'dairy', price: 13.9, dealScore: 73 }
];

const expiryDealReports: ExpiryDealReport[] = [
  {
    id: 'expiry-chicken-hemkop',
    productId: 'chicken',
    productName: 'Chicken breast',
    storeId: 'hemkop-fridhemsplan',
    storeName: 'Hemkop Fridhemsplan',
    category: 'protein',
    originalPrice: 99.9,
    currentPrice: 49.9,
    markdownPercent: 50,
    expiresAt: '2026-05-20T20:00:00.000Z',
    reportedAt: '2026-05-20T08:00:00.000Z',
    distanceKm: 2.4,
    verificationCount: 2,
    photoCount: 1
  },
  {
    id: 'expiry-tomatoes-coop',
    productId: 'tomatoes',
    productName: 'Tomatoes',
    storeId: 'coop-odenplan',
    storeName: 'Coop Odenplan',
    category: 'vegetables',
    originalPrice: 39.9,
    currentPrice: 24.9,
    markdownPercent: 38,
    expiresAt: '2026-05-21T14:00:00.000Z',
    reportedAt: '2026-05-20T09:30:00.000Z',
    distanceKm: 0.8,
    verificationCount: 1,
    photoCount: 0
  },
  {
    id: 'expiry-yogurt-lidl',
    productId: 'yogurt',
    productName: 'Greek yogurt',
    storeId: 'lidl-sveavagen',
    storeName: 'Lidl Sveavägen',
    category: 'dairy',
    originalPrice: 34.9,
    currentPrice: 19.9,
    markdownPercent: 43,
    expiresAt: '2026-05-22T12:00:00.000Z',
    reportedAt: '2026-05-19T06:00:00.000Z',
    distanceKm: 1.1,
    verificationCount: 1,
    photoCount: 1
  }
];

const defaultPantry: PantryInventoryItem[] = [
  { productId: 'coffee', name: 'Zoégas Coffee 450g', category: 'pantry', quantity: 1, unit: 'pack', minimumQuantity: 1, targetQuantity: 3 },
  { productId: 'milk', name: 'Arla Milk 1L', category: 'dairy', quantity: 1, unit: 'l', minimumQuantity: 1, targetQuantity: 2, expiresAt: '2026-05-22T08:00:00.000Z' },
  { productId: 'butter', name: 'Butter 600g', category: 'dairy', quantity: 1, unit: 'pack', minimumQuantity: 0.5, targetQuantity: 2 }
];

const defaultPantryUsage = [
  { productId: 'coffee', quantityUsed: 0.5, usedAt: '2026-05-19T07:00:00.000Z' }
];

const loyaltyOffers: LoyaltyOffer[] = [
  {
    productId: 'coffee',
    productName: 'Zoégas Coffee 450g',
    chain: 'ica',
    publicShelfPrice: 56.9,
    memberPrice: 49.9,
    savings: 7,
    requirement: 'ICA Stammis linked',
    status: 'eligible',
    actionRequired: false
  },
  {
    productId: 'milk',
    productName: 'Arla Milk 1L',
    chain: 'coop',
    publicShelfPrice: 25.9,
    memberPrice: 13.9,
    savings: 12,
    requirement: 'Clip Coop Medmera coupon before checkout',
    status: 'needs_coupon',
    actionRequired: true
  },
  {
    productId: 'private-label-milk',
    productName: 'Garant Milk 1L',
    chain: 'willys',
    publicShelfPrice: 19.9,
    memberPrice: 12.9,
    savings: 7,
    requirement: 'Willys Plus member account verified',
    status: 'eligible',
    actionRequired: false
  }
];

const flyerOfferRows = [
  {
    offerId: 'flyer-willys-odenplan-coffee-2026w21',
    flyerId: 'willys-stockholm-2026w21',
    storeId: 'willys-odenplan',
    productId: 'coffee',
    regularPrice: 64.9,
    offerPrice: 49.9,
    priceType: 'flyer' as const,
    validFrom: '2026-05-19T00:00:00.000Z',
    validThrough: '2026-05-25T21:59:59.000Z',
    observedAt: '2026-05-19T06:30:00.000Z',
    sourceUrl: 'https://www.willys.se/erbjudanden/stockholm/vecka-21',
    sourceRunId: 'source-run-willys-flyer-2026-05-19',
    confidence: 0.92
  },
  {
    offerId: 'flyer-willys-odenplan-private-label-milk-2026w21',
    flyerId: 'willys-stockholm-2026w21',
    storeId: 'willys-odenplan',
    productId: 'private-label-milk',
    regularPrice: 19.9,
    offerPrice: 12.9,
    priceType: 'member_flyer' as const,
    validFrom: '2026-05-19T00:00:00.000Z',
    validThrough: '2026-05-25T21:59:59.000Z',
    observedAt: '2026-05-19T06:30:00.000Z',
    sourceUrl: 'https://www.willys.se/erbjudanden/stockholm/vecka-21',
    sourceRunId: 'source-run-willys-flyer-2026-05-19',
    confidence: 0.88
  },
  {
    offerId: 'flyer-lidl-sveavagen-milk-2026w21',
    flyerId: 'lidl-stockholm-2026w21',
    storeId: 'lidl-sveavagen',
    productId: 'milk',
    regularPrice: 16.9,
    offerPrice: 13.9,
    priceType: 'flyer' as const,
    validFrom: '2026-05-19T00:00:00.000Z',
    validThrough: '2026-05-25T20:59:59.000Z',
    observedAt: '2026-05-19T05:45:00.000Z',
    sourceUrl: 'https://www.lidl.se/c/erbjudanden-stockholm/s10025521',
    sourceRunId: 'source-run-lidl-flyer-2026-05-19',
    confidence: 0.9
  },
  {
    offerId: 'flyer-coop-odenplan-butter-2026w21',
    flyerId: 'coop-stockholm-2026w21',
    storeId: 'coop-odenplan',
    productId: 'butter',
    regularPrice: 59.9,
    offerPrice: 54.9,
    priceType: 'flyer' as const,
    validFrom: '2026-05-19T00:00:00.000Z',
    validThrough: '2026-05-25T21:59:59.000Z',
    observedAt: '2026-05-19T07:10:00.000Z',
    sourceUrl: 'https://www.coop.se/butiker-erbjudanden/coop/coop-odenplan/',
    sourceRunId: 'source-run-coop-flyer-2026-05-19',
    confidence: 0.84
  }
];

function requireNonEmptyId(value: string, label: string) {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
}

function requireKnownProduct(productId: string) {
  requireNonEmptyId(productId, 'productId');
  if (!products.some((product) => product.id === productId)) {
    throw new Error(`Unknown productId: ${productId}`);
  }
}

function requireKnownStore(storeId: string) {
  requireNonEmptyId(storeId, 'storeId');
  if (!stores.some((store) => store.id === storeId)) {
    throw new Error(`Unknown storeId: ${storeId}`);
  }
}

function requirePositiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be positive`);
  }
}

function requireOptionalPositiveFinite(value: number | undefined, label: string) {
  if (value === undefined) return;
  requirePositiveFinite(value, label);
}

function requireScoreThreshold(value: number | undefined) {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('alertDealScoreAt must be between 0 and 100');
  }
}

function requireAllowedPriceTypes(value: WatchlistPriceType[] | undefined) {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new Error('allowedPriceTypes must be an array');
  const allowed = new Set(watchlistPriceTypes);
  for (const priceType of value) {
    if (!allowed.has(priceType)) {
      throw new Error(`allowedPriceTypes must contain only: ${watchlistPriceTypes.join(', ')}`);
    }
  }
}

function requireArray<T>(value: T[] | undefined, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireZeroOrPositiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be zero or positive`);
  }
}

function requireOneOf<T extends string>(value: unknown, label: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

function optionalOneOf<T extends string>(value: unknown, label: string, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  return requireOneOf(value, label, allowed);
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function requireIsoTimestamp(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    value.trim() !== value ||
    !isoTimestampPattern.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw new Error(`${label} must be an ISO timestamp`);
  }
  return value;
}

function optionalIsoTimestamp(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return requireIsoTimestamp(value, label);
}

function requireIsoDateOrTimestamp(value: string, label: string): string {
  if (isoDatePattern.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))) return value;
  return requireIsoTimestamp(value, label);
}

function toUtcDay(value: string): number {
  const parsed = isoDatePattern.test(value) ? Date.parse(`${value}T00:00:00.000Z`) : Date.parse(value);
  return Math.floor(parsed / 86_400_000);
}

function normalizeSubscriptionEntitlement(input: SubscriptionEntitlementSnapshot): SubscriptionEntitlementSnapshot {
  const candidate = input as Record<string, unknown>;
  const tier = requireOneOf(candidate.tier, 'tier', ['free', 'premium'] as const);
  const status = requireOneOf(candidate.status, 'status', ['active', 'past_due', 'canceled'] as const);
  const plan = optionalOneOf(candidate.plan, 'plan', ['premium_monthly', 'premium_yearly'] as const);
  const currentPeriodEndsAt = optionalIsoTimestamp(candidate.currentPeriodEndsAt, 'currentPeriodEndsAt');
  const provider = optionalOneOf(candidate.provider, 'provider', ['stripe_compatible'] as const);
  const updatedAt = requireIsoTimestamp(candidate.updatedAt, 'updatedAt');

  return {
    tier,
    ...(plan ? { plan: plan as SubscriptionPlan } : {}),
    status,
    ...(currentPeriodEndsAt ? { currentPeriodEndsAt } : {}),
    ...(provider ? { provider } : {}),
    updatedAt
  };
}

function sortPricesByValue(prices: StorePrice[]) {
  return [...prices].sort((left, right) => left.price - right.price || left.storeName.localeCompare(right.storeName));
}

function bestPriceFor(product: ProductDetail) {
  return sortPricesByValue(product.currentPrices)[0] ?? null;
}

function medianPrice(prices: StorePrice[]): number | null {
  if (prices.length === 0) return null;
  const sorted = sortPricesByValue(prices).map((price) => price.price);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function roundPrice(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function storeForId(storeId: string): Store | undefined {
  return stores.find((store) => store.id === storeId);
}

function sortedHistory(product: ProductDetail) {
  return [...product.history].sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
}

function latestObservedAt(product: ProductDetail): string | null {
  const latest = sortedHistory(product).at(-1);
  return latest ? toIsoObservedAt(latest.date) : null;
}

function indexComponentFor(product: ProductDetail) {
  const history = sortedHistory(product).filter((point) => Number.isFinite(point.price) && point.price > 0);
  const first = history[0];
  const current = bestPriceFor(product);
  if (!first || !current) return null;
  return {
    productId: product.id,
    baseUnitPrice: first.price,
    currentUnitPrice: current.price,
    weight: 1
  };
}

function indexBaseDate(productsForIndex: ProductDetail[]): string {
  return productsForIndex
    .flatMap((product) => sortedHistory(product).map((point) => point.date))
    .sort()[0] ?? 'unavailable';
}

function indexCurrentDate(productsForIndex: ProductDetail[]): string {
  return productsForIndex
    .flatMap((product) => sortedHistory(product).map((point) => point.date))
    .sort()
    .at(-1) ?? 'unavailable';
}

function buildStockholmGroceryIndex() {
  const components = products
    .map(indexComponentFor)
    .filter((component): component is NonNullable<ReturnType<typeof indexComponentFor>> => component !== null);

  return calculateFixedBasketIndex({
    id: 'stockholm-grocery-index',
    label: 'Stockholm Grocery Index',
    baseDate: indexBaseDate(products),
    currentDate: indexCurrentDate(products),
    components
  });
}

function comparableUnitBasis(product: ProductDetail): { quantity: number; unit: string } {
  const match = product.unitPrice.match(/^(\d+(?:\.\d+)?)\s+SEK\/(.+)$/);
  const referencePrice = product.currentPrices[0]?.price;
  if (!match || referencePrice === undefined || referencePrice <= 0) {
    return { quantity: 1, unit: 'package' };
  }

  const referenceUnitPrice = Number(match[1]);
  if (!Number.isFinite(referenceUnitPrice) || referenceUnitPrice <= 0) {
    return { quantity: 1, unit: 'package' };
  }

  return { quantity: referencePrice / referenceUnitPrice, unit: match[2]! };
}

function comparableUnitPrice(product: ProductDetail, packagePrice: number): number {
  const { quantity } = comparableUnitBasis(product);
  return roundPrice(packagePrice / quantity);
}

function cheapestByChain(product: ProductDetail): ProductCheapestNowChainPrice[] {
  const byChain = new Map<string, ProductCheapestNowChainPrice>();
  const { unit } = comparableUnitBasis(product);
  for (const price of product.currentPrices) {
    const store = storeForId(price.storeId);
    if (!store) continue;
    const row: ProductCheapestNowChainPrice = {
      chain: store.chain,
      storeId: price.storeId,
      storeName: price.storeName,
      packagePrice: roundPrice(price.price),
      comparableUnitPrice: comparableUnitPrice(product, price.price),
      comparableUnit: unit
    };
    const current = byChain.get(store.chain);
    if (!current || row.packagePrice < current.packagePrice || (row.packagePrice === current.packagePrice && row.storeName.localeCompare(current.storeName) < 0)) {
      byChain.set(store.chain, row);
    }
  }
  return [...byChain.values()].sort((left, right) => left.packagePrice - right.packagePrice || left.chain.localeCompare(right.chain));
}

function confidenceLabel(confidence: number): ProductLatestPriceConfidence {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.75) return 'medium';
  return 'low';
}

export function buildProductLatestPrices(rows: ProductLatestPriceInput[]): ProductLatestPrice[] {
  return rows.flatMap((row): ProductLatestPrice[] => {
    if (
      !row.observationId ||
      !row.storeSlug ||
      !row.storeName ||
      !row.chainSlug ||
      !row.chainName ||
      row.price === undefined ||
      row.unitPrice === undefined ||
      !row.priceType ||
      row.confidence === undefined ||
      !row.observedAt
    ) {
      return [];
    }
    const provenance = row.provenance ?? {};
    return [{
      observationId: row.observationId,
      productId: row.productSlug,
      productSlug: row.productSlug,
      productName: row.productName,
      storeId: row.storeSlug,
      storeName: row.storeName,
      chain: row.chainSlug,
      chainName: row.chainName,
      price: roundPrice(row.price),
      unitPrice: roundPrice(row.unitPrice),
      currency: 'SEK',
      priceType: row.priceType,
      confidence: confidenceLabel(row.confidence),
      confidenceScore: row.confidence,
      observedAt: row.observedAt,
      sourceType: typeof provenance.sourceType === 'string' ? provenance.sourceType : 'latest_prices',
      provenance
    }];
  }).sort((left, right) => left.price - right.price || left.storeName.localeCompare(right.storeName) || left.priceType.localeCompare(right.priceType));
}

export function buildProductCheapestNowReport(rows: ProductCheapestNowPriceRow[]): ProductCheapestNow | null {
  const product = rows[0];
  if (!product) return null;

  const byChain = new Map<string, ProductCheapestNowChainPrice>();
  const observedAtValues: string[] = [];
  let observedPriceCount = 0;

  for (const row of rows) {
    if (row.observedAt) observedAtValues.push(row.observedAt);
    if (
      row.price === undefined ||
      row.unitPrice === undefined ||
      !row.chainSlug ||
      !row.storeSlug ||
      !row.storeName
    ) {
      continue;
    }

    observedPriceCount += 1;
    const candidate: ProductCheapestNowChainPrice = {
      chain: row.chainSlug,
      storeId: row.storeSlug,
      storeName: row.storeName,
      packagePrice: roundPrice(row.price),
      comparableUnitPrice: roundPrice(row.unitPrice),
      comparableUnit: row.comparableUnit
    };
    const current = byChain.get(row.chainSlug);
    if (
      !current ||
      candidate.packagePrice < current.packagePrice ||
      (candidate.packagePrice === current.packagePrice && candidate.storeName.localeCompare(current.storeName) < 0)
    ) {
      byChain.set(row.chainSlug, candidate);
    }
  }

  const chainPrices = [...byChain.values()].sort((left, right) => left.packagePrice - right.packagePrice || left.chain.localeCompare(right.chain));

  return {
    productId: product.productId,
    productName: product.productName,
    category: product.categoryPath[0] ?? 'uncategorized',
    currency: 'SEK',
    cheapest: chainPrices[0] ?? null,
    chainPrices,
    chainCount: chainPrices.length,
    observedPriceCount,
    lastObservedAt: observedAtValues.sort().at(-1) ?? null,
    guardrails: [
      'Cheapest-now rows are calculated only from persisted latest_prices observations for the requested product.',
      'Each chain contributes at most one current lowest package price, preserving the store that supplied it.',
      'No missing chain or product prices are filled with synthetic estimates.'
    ]
  };
}

function chainIndexObservations(): ChainPriceObservation[] {
  return products.flatMap((product) =>
    product.currentPrices.flatMap((price) => {
      const store = storeForId(price.storeId);
      if (!store) return [];
      return [{
        chainId: store.chain,
        category: product.category,
        unitPrice: comparableUnitPrice(product, price.price)
      }];
    })
  );
}

function buildCategoryPriceIndices(): CategoryPriceIndexSummary {
  const byCategory = new Map<string, ProductDetail[]>();
  for (const product of products) {
    const current = byCategory.get(product.category) ?? [];
    current.push(product);
    byCategory.set(product.category, current);
  }

  const indices = [...byCategory.entries()].flatMap(([category, categoryProducts]) => {
    const components = categoryProducts
      .map(indexComponentFor)
      .filter((component): component is NonNullable<ReturnType<typeof indexComponentFor>> => component !== null);
    if (components.length === 0) return [];
    const index = calculateFixedBasketIndex({
      id: `${category}-category-price-index`,
      label: `${category[0]?.toUpperCase() ?? ''}${category.slice(1)} Price Index`,
      baseDate: indexBaseDate(categoryProducts),
      currentDate: indexCurrentDate(categoryProducts),
      components
    });
    return [{
      id: index.id,
      category,
      label: index.label,
      value: index.value,
      movementPercent: index.movementPercent,
      productCount: components.length,
      baseDate: index.baseDate,
      currentDate: index.currentDate
    }];
  }).sort((left, right) => left.value - right.value || left.category.localeCompare(right.category));

  return {
    currency: 'SEK',
    indices,
    generatedFrom: indices.reduce((sum, row) => sum + row.productCount, 0),
    guardrails: [
      'Category indices are calculated from recorded product history and current observed store prices.',
      'Sparse categories remain product-count labeled instead of being expanded with synthetic rows.',
      'Current category values use the cheapest currently observed store price for each product.'
    ]
  };
}

function buildBrandPriceIndices(): BrandPriceIndexSummary {
  const observations = products.flatMap((product): BrandTierPriceObservation[] => {
    const component = indexComponentFor(product);
    if (!component) return [];
    return [{
      brandTier: product.brandTier,
      category: product.id,
      baseUnitPrice: component.baseUnitPrice,
      currentUnitPrice: component.currentUnitPrice
    }];
  });
  const summary = calculateBrandTierIndices(observations);
  return {
    ...summary,
    currency: 'SEK',
    generatedFrom: observations.length,
    guardrails: [
      'Brand indices are derived from product-level history and current observed store prices.',
      'Private-label savings are only reported where a comparable national-brand product exists in the same component key.',
      'No missing brand tiers are backfilled with estimated prices.'
    ]
  };
}

function range52WeekFrom(history: Array<{ price: number }>, bestPrice: StorePrice | null): { low: number; high: number } | null {
  const prices = history.map((point) => point.price);
  if (bestPrice) prices.push(bestPrice.price);
  return prices.length > 0
    ? { low: roundPrice(Math.min(...prices)), high: roundPrice(Math.max(...prices)) }
    : null;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return roundPrice(sorted[0]!);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;
  return roundPrice(sorted[lower]! * (1 - weight) + sorted[upper]! * weight);
}

function storeDistrict(storeId: string): string | null {
  return stores.find((store) => store.id === storeId)?.district ?? null;
}

function distributionFor(
  product: ProductDetail,
  scope: ProductPriceDistributionScope,
  label: string,
  prices: StorePrice[],
  currentPercentileOverride?: number
): ProductPriceDistribution | null {
  if (prices.length === 0) return null;
  const sortedPrices = sortPricesByValue(prices);
  const values = sortedPrices.map((price) => price.price).sort((left, right) => left - right);
  const current = sortedPrices[0]!;
  const currentPercentile = currentPercentileOverride ?? roundPercent(((values.filter((price) => price <= current.price).length) / values.length) * 100);
  const cheaperThanPercent = roundPercent(100 - currentPercentile);
  const scopeText = scope === 'stockholm' ? 'verified Stockholm observations' : `${label} observations`;
  return {
    scope,
    label,
    sampleSize: values.length,
    currentPrice: current.price,
    currentPercentile,
    cheaperThanPercent,
    min: roundPrice(values[0]!),
    p05: quantile(values, 0.05),
    p25: quantile(values, 0.25),
    median: quantile(values, 0.5),
    p75: quantile(values, 0.75),
    p95: quantile(values, 0.95),
    max: roundPrice(values.at(-1)!),
    customerRead: `${current.price.toFixed(2)} SEK at ${current.storeName} is cheaper than ${cheaperThanPercent}% of ${scopeText}.`
  };
}

function toIsoObservedAt(value: string): string {
  return isoDatePattern.test(value) ? `${value}T00:00:00.000Z` : value;
}

function chartObservationsFor(product: ProductDetail): PriceChartObservation[] {
  const bestPrice = bestPriceFor(product) ?? product.currentPrices[0];
  return product.history.map((point) => ({
    storeId: bestPrice?.storeId ?? 'unknown-store',
    storeName: bestPrice?.storeName ?? 'Unknown store',
    observedAt: toIsoObservedAt(point.date),
    price: point.price,
    sourceType: point.verified ? 'shelf' : 'estimated',
    confidence: point.verified ? product.dealSignals.sourceConfidence : 0.35,
    provenanceLabel: point.verified ? 'Verified price history' : 'Estimated history'
  }));
}

function productPriceTerminalFor(product: ProductDetail, asOf?: string): ProductPriceTerminalReport {
  const bestPrice = bestPriceFor(product);
  const sortedHistory = [...product.history].sort((left, right) => Date.parse(toIsoObservedAt(left.date)) - Date.parse(toIsoObservedAt(right.date)));
  const latestHistory = sortedHistory.at(-1);
  const previousHistory = sortedHistory.at(-2);
  const oneMonthMovePercent = latestHistory && previousHistory && previousHistory.price > 0
    ? roundPercent(((latestHistory.price - previousHistory.price) / previousHistory.price) * 100)
    : null;
  const range52Week = range52WeekFrom(sortedHistory, bestPrice);
  const localDistrict = bestPrice ? storeDistrict(bestPrice.storeId) : null;
  const localPrices = localDistrict
    ? product.currentPrices.filter((price) => storeDistrict(price.storeId) === localDistrict)
    : [];
  const distributions = [
    distributionFor(product, 'stockholm', 'Whole Stockholm', product.currentPrices, product.dealSignals.currentCityPercentile),
    distributionFor(product, 'local_area', `${localDistrict ?? 'Local'} local area`, localPrices)
  ].filter((row): row is ProductPriceDistribution => row !== null);
  const chartAsOf = asOf ?? (latestHistory ? toIsoObservedAt(latestHistory.date) : undefined);
  const chart = buildPriceChartSeries({
    observations: chartObservationsFor(product),
    ...(chartAsOf ? { asOf: chartAsOf } : {}),
    rangeDays: 365,
    markerLimitPerSeries: 8
  });
  return {
    productId: product.id,
    ticker: product.ticker,
    productName: product.name,
    asOf: chartAsOf ?? new Date().toISOString(),
    quote: {
      bestPrice: bestPrice?.price ?? null,
      bestStoreId: bestPrice?.storeId ?? null,
      bestStoreName: bestPrice?.storeName ?? null,
      unitPrice: product.unitPrice,
      dealScore: product.dealScore,
      band: scoreBand(product.dealScore),
      oneMonthMovePercent,
      range52Week,
      evidenceVolume: {
        currentPrices: product.currentPrices.length,
        historyPoints: product.history.length,
        verifiedHistoryPoints: product.history.filter((point) => point.verified).length
      }
    },
    distributions,
    chart,
    historySummary: product.history.length > 0
      ? summarizePriceHistory(product.history.map((point) => ({ observedAt: toIsoObservedAt(point.date), price: point.price })))
      : null,
    evidenceGuardrails: [
      'Verified shelf or retailer-page prices can power current quote, Deal Score, and basket totals.',
      'Member, promotion, estimated, and low-confidence rows must stay explicitly labeled before customer action.',
      'Distribution and chart samples include sample size and provenance-aware confidence styling.'
    ]
  };
}

function productPriceSpreadFor(product: ProductDetail): ProductPriceSpreadReport {
  const sortedPrices = sortPricesByValue(product.currentPrices);
  const bestPrice = sortedPrices[0] ?? null;
  const highestPrice = sortedPrices.at(-1) ?? null;
  const spread = bestPrice && highestPrice ? roundPrice(highestPrice.price - bestPrice.price) : 0;
  const spreadPercent = bestPrice && bestPrice.price > 0 ? roundPercent((spread / bestPrice.price) * 100) : 0;
  const rows = sortedPrices.map((price, index) => {
    const deltaFromBest = bestPrice ? roundPrice(price.price - bestPrice.price) : 0;
    return {
      storeId: price.storeId,
      storeName: price.storeName,
      price: price.price,
      rank: index + 1,
      deltaFromBest,
      deltaFromBestPercent: bestPrice && bestPrice.price > 0 ? roundPercent((deltaFromBest / bestPrice.price) * 100) : 0,
      priceLabel: index === 0 ? 'best' as const : 'above_best' as const
    };
  });

  return {
    productId: product.id,
    ticker: product.ticker,
    productName: product.name,
    currency: 'SEK',
    sampleSize: rows.length,
    bestStoreId: bestPrice?.storeId ?? null,
    bestStoreName: bestPrice?.storeName ?? null,
    bestPrice: bestPrice?.price ?? null,
    highestStoreId: highestPrice?.storeId ?? null,
    highestStoreName: highestPrice?.storeName ?? null,
    highestPrice: highestPrice?.price ?? null,
    spread,
    spreadPercent,
    rows,
    customerRead: bestPrice && highestPrice
      ? `${product.name} ranges ${spread.toFixed(2)} SEK across ${rows.length} verified store quotes; ${bestPrice.storeName} is cheapest at ${bestPrice.price.toFixed(2)} SEK.`
      : `${product.name} has no verified store spread yet.`,
    guardrails: [
      'Price spread compares only current verified store quotes for the selected product.',
      'Spread rankings do not change Deal Score or basket routing without the product-specific price evidence.',
      'Missing stores stay out of the spread sample until a current quote is verified.'
    ]
  };
}

function productHistorySummaryFor(product: ProductDetail): ProductHistorySummaryReport | null {
  if (product.history.length === 0) return null;
  const summary = summarizePriceHistory(product.history.map((point) => ({ observedAt: toIsoObservedAt(point.date), price: point.price })));
  const trend = summary.isNewLow
    ? 'new_low'
    : summary.changeFromPrevious < 0
      ? 'down'
      : summary.changeFromPrevious > 0
        ? 'up'
        : 'flat';

  return {
    productId: product.id,
    ticker: product.ticker,
    productName: product.name,
    summary,
    trend,
    guardrails: [
      'History summaries use recorded product history points only.',
      'New-low signals compare the latest observation against earlier observed prices.',
      'Missing history stays explicit instead of inferring movement from current store quotes.'
    ]
  };
}

function productHistoryConfidenceFor(product: ProductDetail): ProductHistoryConfidenceReport {
  const history = [...product.history].sort((left, right) => Date.parse(toIsoObservedAt(left.date)) - Date.parse(toIsoObservedAt(right.date)));
  const disclosure = summarizePriceHistoryConfidence({
    rangeDays: 90,
    firstObservedAt: history[0] ? toIsoObservedAt(history[0].date) : undefined,
    lastObservedAt: history.at(-1) ? toIsoObservedAt(history.at(-1)!.date) : undefined,
    observationCount: history.length,
    sourceTypesIncluded: history.some((point) => point.verified) ? ['shelf'] : ['estimated'],
    expectedSourceTypes: ['shelf'],
    hasEstimatedPoints: history.some((point) => !point.verified)
  });

  return {
    productId: product.id,
    ticker: product.ticker,
    productName: product.name,
    disclosure,
    guardrails: [
      'History confidence explains whether a lowest-price claim can be used.',
      'Estimated history points block deal-alert confidence until confirmed by a source.',
      'Sparse or short windows stay labeled instead of implying a complete price history.'
    ]
  };
}

function assertFinitePriceHistoryNumber(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid product price history ${field}.`);
}

function assertIsoDate(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) throw new Error(`Invalid product price history ${field}.`);
}

export function buildProductPriceHistoryReport(
  observations: readonly ProductPriceHistoryObservationInput[],
  filters: ProductPriceHistoryAppliedFilters = {}
): ProductPriceHistoryReport | null {
  if (observations.length === 0) return null;
  const productId = observations[0]!.productId;
  const productSlug = observations[0]!.productSlug;
  const productName = observations[0]!.productName;

  const points = observations.map((observation) => {
    if (observation.productId !== productId) throw new Error('Product price history observations must belong to one product.');
    if (observation.productSlug !== productSlug) throw new Error('Product price history observations must use one product slug.');
    assertFinitePriceHistoryNumber(observation.price, 'price');
    assertFinitePriceHistoryNumber(observation.unitPrice, 'unitPrice');
    assertFinitePriceHistoryNumber(observation.confidence, 'confidence');
    if (observation.regularPrice !== undefined) assertFinitePriceHistoryNumber(observation.regularPrice, 'regularPrice');
    if (observation.quantity !== undefined) assertFinitePriceHistoryNumber(observation.quantity, 'quantity');
    assertIsoDate(observation.observedAt, 'observedAt');
    if (observation.validFrom) assertIsoDate(observation.validFrom, 'validFrom');
    if (observation.validUntil) assertIsoDate(observation.validUntil, 'validUntil');
    return observation;
  }).sort((left, right) => {
    const observedDelta = Date.parse(left.observedAt) - Date.parse(right.observedAt);
    return observedDelta === 0 ? left.observationId.localeCompare(right.observationId) : observedDelta;
  });

  return {
    productId,
    productSlug,
    productName,
    currency: 'SEK',
    filters,
    pointCount: points.length,
    observedFrom: points[0]?.observedAt ?? null,
    observedTo: points.at(-1)?.observedAt ?? null,
    priceTypes: [...new Set(points.map((point) => point.priceType))].sort(),
    points,
    summary: summarizePriceHistory(points.map((point) => ({ observedAt: point.observedAt, price: point.price }))),
    guardrails: [
      'Price history is built only from persisted observation rows for the selected product.',
      'Member, promotion, estimated, receipt, and community rows remain explicitly labeled in the series.',
      'Provenance identifiers stay attached so UI and audit flows can trace each point back to ingestion evidence.'
    ]
  };
}

export function buildEmptyProductPriceHistoryReport(
  product: ProductPriceHistoryProductInput,
  filters: ProductPriceHistoryAppliedFilters = {}
): ProductPriceHistoryReport {
  return {
    productId: product.productId,
    productSlug: product.productSlug,
    productName: product.productName,
    currency: 'SEK',
    filters,
    pointCount: 0,
    observedFrom: null,
    observedTo: null,
    priceTypes: [],
    points: [],
    summary: null,
    guardrails: [
      'Price history is built only from persisted observation rows for the selected product.',
      'No observations are returned when ingestion has not produced rows for the selected filters.',
      'Missing history stays explicit instead of inferring movement from current store quotes.'
    ]
  };
}

function productStoreSavingsFor(product: ProductDetail): ProductStoreSavingsReport {
  const sortedPrices = sortPricesByValue(product.currentPrices);
  const bestPrice = sortedPrices[0] ?? null;
  const highestPrice = sortedPrices.at(-1) ?? null;
  const maxSavings = bestPrice && highestPrice ? roundPrice(highestPrice.price - bestPrice.price) : 0;
  const maxSavingsPercent = highestPrice && highestPrice.price > 0 ? roundPercent((maxSavings / highestPrice.price) * 100) : 0;
  const rows = sortedPrices.map((price, index) => {
    const savingsVsHighest = highestPrice ? roundPrice(highestPrice.price - price.price) : 0;
    const priceLabel = index === 0
      ? 'best_savings' as const
      : savingsVsHighest > 0
        ? 'saves_vs_highest' as const
        : 'highest_price' as const;

    return {
      storeId: price.storeId,
      storeName: price.storeName,
      price: price.price,
      rank: index + 1,
      savingsVsHighest,
      savingsVsHighestPercent: highestPrice && highestPrice.price > 0 ? roundPercent((savingsVsHighest / highestPrice.price) * 100) : 0,
      priceLabel
    };
  });

  return {
    productId: product.id,
    ticker: product.ticker,
    productName: product.name,
    currency: 'SEK',
    sampleSize: rows.length,
    bestStoreId: bestPrice?.storeId ?? null,
    bestStoreName: bestPrice?.storeName ?? null,
    bestPrice: bestPrice?.price ?? null,
    highestStoreId: highestPrice?.storeId ?? null,
    highestStoreName: highestPrice?.storeName ?? null,
    highestPrice: highestPrice?.price ?? null,
    maxSavings,
    maxSavingsPercent,
    rows,
    customerRead: bestPrice && highestPrice
      ? `Choosing ${bestPrice.storeName} saves up to ${maxSavings.toFixed(2)} SEK versus ${highestPrice.storeName} for ${product.name}.`
      : `${product.name} has no verified store savings sample yet.`,
    guardrails: [
      'Store savings compare only current verified quotes for the selected product.',
      'Savings rows do not hide the highest verified price from the comparison.',
      'Missing stores stay out of the savings sample until a current quote is verified.'
    ]
  };
}

function marketMoverFor(product: ProductDetail): MarketMover {
  const bestPrice = bestPriceFor(product);
  const sortedHistory = [...product.history].sort((left, right) => Date.parse(toIsoObservedAt(left.date)) - Date.parse(toIsoObservedAt(right.date)));
  const latestHistory = sortedHistory.at(-1);
  const previousHistory = sortedHistory.at(-2);
  const oneMonthMovePercent = latestHistory && previousHistory && previousHistory.price > 0
    ? roundPercent(((latestHistory.price - previousHistory.price) / previousHistory.price) * 100)
    : null;
  const range52Week = range52WeekFrom(sortedHistory, bestPrice);
  const rangeSpread = range52Week ? range52Week.high - range52Week.low : 0;
  const range52WeekPositionPercent = bestPrice && range52Week && rangeSpread > 0
    ? roundPercent(Math.max(0, Math.min(100, ((bestPrice.price - range52Week.low) / rangeSpread) * 100)))
    : null;
  const stockholmMedian = medianPrice(product.currentPrices);
  return {
    productId: product.id,
    ticker: product.ticker,
    productName: product.name,
    currentPrice: bestPrice?.price ?? null,
    bestStoreId: bestPrice?.storeId ?? null,
    bestStoreName: bestPrice?.storeName ?? null,
    oneMonthMovePercent,
    range52Week,
    range52WeekPositionPercent,
    stockholmMedianGap: bestPrice && stockholmMedian != null ? roundPrice(bestPrice.price - stockholmMedian) : null,
    historyPoints: product.history.length,
    verifiedHistoryPoints: product.history.filter((point) => point.verified).length
  };
}

function categoryMarketRowFor(product: ProductDetail): CategoryMarketRow {
  const mover = marketMoverFor(product);
  const priceText = mover.currentPrice == null ? 'No verified current price' : `${mover.currentPrice.toFixed(2)} SEK`;
  const storeText = mover.bestStoreName ?? 'unknown store';
  const medianText = mover.stockholmMedianGap == null
    ? 'without a Stockholm median comparison'
    : `${Math.abs(mover.stockholmMedianGap).toFixed(2)} SEK ${mover.stockholmMedianGap <= 0 ? 'below' : 'above'} Stockholm median`;
  const moveText = mover.oneMonthMovePercent == null
    ? 'with no 1M move yet'
    : `${mover.oneMonthMovePercent > 0 ? '+' : ''}${mover.oneMonthMovePercent.toFixed(1)}% over 1M`;
  return {
    ...mover,
    category: product.category,
    unitPrice: product.unitPrice,
    dealScore: product.dealScore,
    band: scoreBand(product.dealScore),
    customerRead: `${priceText} at ${storeText} is ${moveText} and ${medianText}; ${mover.verifiedHistoryPoints}/${mover.historyPoints} verified history points.`
  };
}

function categoryMarketFor(category: string): CategoryMarketReport | null {
  const normalizedCategory = category.trim().toLowerCase();
  if (!normalizedCategory) throw new Error('category is required');
  const rows = products
    .filter((product) => product.category.toLowerCase() === normalizedCategory)
    .map(categoryMarketRowFor)
    .sort((left, right) => right.dealScore - left.dealScore || Math.abs(right.oneMonthMovePercent ?? 0) - Math.abs(left.oneMonthMovePercent ?? 0) || left.productName.localeCompare(right.productName));
  if (rows.length === 0) return null;
  const leader = rows[0]!;
  return {
    category: normalizedCategory,
    city: 'Stockholm',
    productCount: rows.length,
    topDeal: { productId: leader.productId, currentPrice: leader.currentPrice, dealScore: leader.dealScore },
    rows,
    guardrails: [
      'Only verified category rows can lead the category market board.',
      '52-week ranges include the current quote so shoppers never see a price outside the displayed range.',
      'Same-category rows keep Deal Score, median gap, and verified-history evidence visible before customer action.'
    ]
  };
}

function buildDealScoreReasons(product: ProductDetail, bestPrice: StorePrice | null, band: ReturnType<typeof scoreBand>): string[] {
  const reasons = [
    `${product.name} is in the ${product.dealSignals.currentCityPercentile}th city price percentile.`,
    `Historical promo percentile is ${product.dealSignals.knownPromoHistoryPercentile}.`,
    `Equivalent unit-price percentile is ${product.dealSignals.equivalentUnitPricePercentile}.`,
    `Source confidence is ${Math.round(product.dealSignals.sourceConfidence * 100)}%.`,
    `Default verdict is ${band.verdict}.`
  ];
  if (bestPrice) reasons.unshift(`Best current quote is ${bestPrice.price.toFixed(2)} SEK at ${bestPrice.storeName}.`);
  return reasons;
}

function productEquivalentFor(product: ProductDetail): ProductEquivalent {
  const bestPrice = bestPriceFor(product);
  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    bestPrice: bestPrice?.price ?? null,
    bestStoreId: bestPrice?.storeId ?? null,
    dealScore: product.dealScore,
    reason: `Same ${product.category} category with comparable current price evidence.`
  };
}

function latestVerifiedPriceDate(product: ProductDetail): string | null {
  const verifiedDates = product.history.filter((point) => point.verified).map((point) => point.date);
  return verifiedDates.sort().at(-1) ?? null;
}

function priceFreshnessStatus(ageDays: number | null): PriceFreshnessStatus {
  if (ageDays === null || ageDays > 14) return 'stale';
  if (ageDays > 7) return 'aging';
  return 'fresh';
}

function cheapestPriceByProductId(productIds: string[]): Record<string, number> {
  const priceByProductId: Record<string, number> = {};
  for (const productId of new Set(productIds)) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) throw new Error(`Unknown productId: ${productId}`);
    priceByProductId[productId] = bestPriceFor(product)?.price ?? 0;
  }
  return priceByProductId;
}

function normalizeHouseholdPlan(userId: string, input: HouseholdPlanRequest): HouseholdPlan {
  requireNonEmptyId(userId, 'userId');
  requireNonEmptyId(input.householdId, 'householdId');
  requireNonEmptyId(input.name, 'name');
  requireZeroOrPositiveFinite(input.weeklyBudget, 'weeklyBudget');
  requireZeroOrPositiveFinite(input.approvalLimit, 'approvalLimit');
  requireNonEmptyId(input.reviewer, 'reviewer');

  const members = requireArray(input.members, 'members').map((member) => {
    requireNonEmptyId(member.userId, 'member.userId');
    requireNonEmptyId(member.displayName, 'member.displayName');
    return { userId: member.userId, displayName: member.displayName };
  });
  if (members.length === 0) throw new Error('members must include at least one household member');
  const memberIds = new Set(members.map((member) => member.userId));
  if (memberIds.size !== members.length) throw new Error('members must have unique userId values');
  if (!memberIds.has(userId)) throw new Error('signed-in user must be a household member');
  if (!memberIds.has(input.reviewer)) throw new Error(`Household member not found: ${input.reviewer}`);

  const household = createHouseholdState({
    id: input.householdId,
    name: input.name,
    weeklyBudget: input.weeklyBudget,
    members
  });

  for (const item of input.basketItems ?? []) {
    requireKnownProduct(item.productId);
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99) {
      throw new Error('quantity must be an integer between 1 and 99');
    }
    household.addBasketItem({ productId: item.productId, quantity: item.quantity, addedBy: item.addedBy });
  }

  for (const item of input.watchlistItems ?? []) {
    requireKnownProduct(item.productId);
    requireOptionalPositiveFinite(item.targetPrice, 'targetPrice');
    household.addWatchlistItem({
      productId: item.productId,
      addedBy: item.addedBy,
      ...(item.targetPrice === undefined ? {} : { targetPrice: item.targetPrice })
    });
  }

  const sharedFavoriteStoreIds = input.sharedFavoriteStoreIds ?? [];
  for (const storeId of sharedFavoriteStoreIds) requireKnownStore(storeId);
  household.setSharedFavoriteStores(sharedFavoriteStoreIds);

  const snapshot = household.snapshot();
  const summary = summarizeHousehold(
    snapshot,
    cheapestPriceByProductId(snapshot.basketItems.map((item) => item.productId))
  );

  return {
    household: snapshot,
    summary,
    approvalPolicy: {
      approvalLimit: input.approvalLimit,
      reviewer: input.reviewer,
      requiresOwnerApproval: summary.estimatedTotal > input.approvalLimit
    }
  };
}

function basketInputItems(userItems: BasketItemRequest[]) {
  return userItems.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return { productId: item.productId, quantity: item.quantity, prices: product?.currentPrices ?? [] };
  });
}

function localOfferBasketItems(userItems: BasketItemRequest[]) {
  return userItems.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const baselineUnitPrice = product ? medianPrice(product.currentPrices) ?? undefined : undefined;
    return {
      productId: item.productId,
      quantity: item.quantity,
      ...(baselineUnitPrice === undefined ? {} : { baselineUnitPrice })
    };
  });
}

function localOffersForBasket(userItems: BasketItemRequest[], storeIds: string[], asOf: string) {
  const selectedStoreIds = new Set(storeIds);
  const selectedProductIds = new Set(userItems.map((item) => item.productId));
  return products
    .filter((product) => selectedProductIds.has(product.id))
    .flatMap((product) => {
      const latestHistory = product.history.at(-1);
      const observedAt = latestHistory ? `${latestHistory.date}T08:00:00.000Z` : asOf;
      return product.currentPrices
        .filter((price) => selectedStoreIds.has(price.storeId))
        .map((price) => ({
          productId: product.id,
          storeId: price.storeId,
          storeName: price.storeName,
          unitPrice: price.price,
          observedAt,
          sourceType: 'online' as const,
          confidence: product.dealSignals.sourceConfidence,
          available: true
        }));
    });
}

function previousRecurringUnitPrice(product: ProductDetail): number | null {
  const verifiedHistory = [...product.history]
    .filter((point) => point.verified)
    .sort((left, right) => left.date.localeCompare(right.date));
  return verifiedHistory.at(-2)?.price ?? verifiedHistory.at(-1)?.price ?? null;
}

function recurringSubstituteName(product: ProductDetail, currentUnitPrice: number | null): string | undefined {
  if (currentUnitPrice === null) return undefined;
  const candidate = products
    .filter((other) =>
      other.id !== product.id &&
      other.category === product.category &&
      other.brandTier.includes('private_label') &&
      comparableUnit(other) === comparableUnit(product)
    )
    .flatMap((other) => other.currentPrices.map((price) => ({ product: other, price })))
    .filter((candidate) => candidate.price.price < currentUnitPrice)
    .sort((left, right) => left.price.price - right.price.price || left.product.name.localeCompare(right.product.name))[0];
  return candidate?.product.name;
}

function buildRecurringBasketDigest(
  userId: string,
  userItems: BasketItemRequest[],
  request: RecurringBasketDigestRequest
): RecurringBasketDigest {
  requireNonEmptyId(userId, 'userId');
  return planRecurringBasketDigest({
    ...request,
    lines: userItems.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) throw new Error(`Unknown productId: ${item.productId}`);
      const currentPrice = bestPriceFor(product);
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        currentUnitPrice: currentPrice?.price ?? null,
        previousUnitPrice: previousRecurringUnitPrice(product),
        ...(currentPrice?.storeName ? { currentStoreName: currentPrice.storeName } : {}),
        substituteProductName: recurringSubstituteName(product, currentPrice?.price ?? null),
        confidence: product.dealSignals.sourceConfidence
      };
    })
  });
}

function productName(productId: string): string {
  return products.find((product) => product.id === productId)?.name ?? productId;
}

function comparableUnit(product: ProductDetail): string {
  return product.unitPrice.split('/').at(-1)?.trim().toLowerCase() ?? '';
}

function reportAssignment(
  assignment: { productId: string; quantity: number; storeId: string; storeName: string; unitPrice: number; lineTotal: number },
  substitution?: ProductDetail
): BasketComparisonReportAssignment {
  const originalName = productName(assignment.productId);
  return {
    productId: substitution?.id ?? assignment.productId,
    productName: substitution?.name ?? originalName,
    quantity: assignment.quantity,
    storeId: assignment.storeId,
    storeName: assignment.storeName,
    unitPrice: assignment.unitPrice,
    lineTotal: assignment.lineTotal,
    priceLabel: 'verified_shelf',
    ...(substitution ? { substitutionForProductId: assignment.productId, substitutionForProductName: originalName } : {})
  };
}

function strategyWarnings(missingProductIds: string[], estimatedProductIds: string[]): string[] {
  const warnings: string[] = [];
  if (missingProductIds.length > 0) warnings.push('Some basket items are missing verified prices for this strategy.');
  if (estimatedProductIds.length > 0) warnings.push('Estimated prices are labeled and excluded from verified shelf totals.');
  if (warnings.length === 0) warnings.push('All included prices are verified shelf demo prices.');
  return warnings;
}

function privateLabelStrategy(
  userItems: BasketItemRequest[],
  favoriteStoreIds: string[],
  bestSingleStoreTotal: number | null
): BasketComparisonReportStrategy {
  const favoriteStores = new Set(favoriteStoreIds);
  const assignments: BasketComparisonReportAssignment[] = [];
  const missingProductIds: string[] = [];

  for (const item of userItems) {
    const source = products.find((product) => product.id === item.productId);
    if (!source) {
      missingProductIds.push(item.productId);
      continue;
    }
    const candidates = [
      source,
      ...products.filter((product) =>
        product.category === source.category &&
        product.brandTier.includes('private_label') &&
        comparableUnit(product) === comparableUnit(source)
      )
    ];
    const pricedCandidates = candidates
      .flatMap((product) => product.currentPrices
        .filter((price) => favoriteStores.has(price.storeId))
        .map((price) => ({ product, price })))
      .sort((left, right) => left.price.price - right.price.price || left.product.name.localeCompare(right.product.name));
    const best = pricedCandidates[0];
    if (!best) {
      missingProductIds.push(item.productId);
      continue;
    }
    assignments.push(reportAssignment({
      productId: source.id,
      quantity: item.quantity,
      storeId: best.price.storeId,
      storeName: best.price.storeName,
      unitPrice: best.price.price,
      lineTotal: roundPrice(best.price.price * item.quantity)
    }, best.product.id === source.id ? undefined : best.product));
  }

  const total = assignments.length > 0 ? roundPrice(assignments.reduce((sum, assignment) => sum + assignment.lineTotal, 0)) : null;
  return {
    id: 'private_label_substitution',
    label: 'Private-label substitution',
    total,
    savingsVsBestSingleStore: total !== null && bestSingleStoreTotal !== null ? roundPrice(bestSingleStoreTotal - total) : 0,
    storeCount: new Set(assignments.map((assignment) => assignment.storeId)).size,
    assignments,
    missingProductIds,
    estimatedProductIds: [],
    warnings: strategyWarnings(missingProductIds, [])
  };
}


function travelProfileForStores(storeIds: string[]): { distanceKm: number; durationMinutes: number } {
  return storeIds.reduce((total, storeId) => {
    const profile = storeTravelProfiles[storeId];
    if (!profile) return total;
    return {
      distanceKm: roundPrice(total.distanceKm + profile.distanceKm),
      durationMinutes: roundPrice(total.durationMinutes + profile.durationMinutes)
    };
  }, { distanceKm: 0, durationMinutes: 0 });
}

function strategyStoreIds(strategy: BasketComparisonReportStrategy): string[] {
  return [...new Set(strategy.assignments.map((assignment) => assignment.storeId))].sort();
}


function productUrlForRetailer(product: ProductDetail, retailerId: string): string | undefined {
  const support = retailerHandoffSupport[retailerId];
  if (!support?.productUrlBase) return undefined;
  return `${support.productUrlBase}${encodeURIComponent(product.name)}`;
}

function buildRetailerHandoffReport(userId: string, retailerId: string, userItems: BasketItemRequest[]): RetailerHandoffReport {
  requireNonEmptyId(userId, 'userId');
  const support = retailerHandoffSupport[retailerId];
  if (!support) throw new Error(`Unsupported retailerId: ${retailerId}`);
  const plan = planRetailerHandoff({
    retailerId,
    retailerName: support.retailerName,
    basketId: `${userId}:current-basket`,
    support: support.support,
    lines: userItems.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name ?? item.productId,
        quantity: item.quantity,
        matched: Boolean(product?.availableChains.includes(retailerId)),
        ...(product ? { productUrl: productUrlForRetailer(product, retailerId) } : {})
      };
    })
  });
  return { ...plan, userId, itemCount: userItems.length };
}

function buildRetailerBasketTransferSession(userId: string, retailerId: string, userItems: BasketItemRequest[]): RetailerBasketTransferSessionReport {
  requireNonEmptyId(userId, 'userId');
  const support = retailerHandoffSupport[retailerId];
  if (!support) throw new Error(`Unsupported retailerId: ${retailerId}`);
  const plan = planRetailerBasketTransferSession({
    retailerId,
    retailerName: support.retailerName,
    basketId: `${userId}:current-basket`,
    support: support.support,
    shopperSessionPresent: true,
    transferEndpoint: undefined,
    signedPayload: undefined,
    lines: userItems.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name ?? item.productId,
        quantity: item.quantity,
        matched: Boolean(product?.availableChains.includes(retailerId)),
        ...(product ? { productUrl: productUrlForRetailer(product, retailerId) } : {})
      };
    })
  });
  return { ...plan, userId, itemCount: userItems.length };
}

function buildBasketTripCostReport(userId: string, favoriteStoreIds: string[], userItems: BasketItemRequest[], request: BasketTripCostRequest): BasketTripCostReport {
  requireNonEmptyId(userId, 'userId');
  const comparisonStoreIds = favoriteStoreIds.length > 0 ? favoriteStoreIds : stores.map((store) => store.id);
  const comparison = buildBasketComparisonReport(userId, comparisonStoreIds, userItems);
  const plan = planBasketTripCost({
    currency: 'SEK',
    travelMode: request.travelMode,
    valueOfTimePerHour: request.valueOfTimePerHour,
    carCostPerKm: request.carCostPerKm,
    transitFare: request.transitFare,
    splitTripPenalty: request.splitTripPenalty,
    options: comparison.strategies.map((strategy) => {
      const storeIds = strategyStoreIds(strategy);
      const travel = travelProfileForStores(storeIds);
      return {
        strategyId: strategy.id,
        label: strategy.label,
        basketTotal: strategy.total,
        storeIds,
        distanceKm: travel.distanceKm,
        durationMinutes: travel.durationMinutes,
        missingProductIds: strategy.missingProductIds
      };
    })
  });
  return {
    ...plan,
    userId,
    itemCount: comparison.itemCount,
    favoriteStoreIds
  };
}

function buildBasketComparisonReport(userId: string, favoriteStoreIds: string[], userItems: BasketItemRequest[]): BasketComparisonReport {
  const comparison = compareBasketStrategies({ favoriteStoreIds, items: basketInputItems(userItems) });
  const cheapestAssignments = comparison.cheapestByProduct.assignments.map((assignment) => reportAssignment(assignment));
  const bestSingleStoreAssignments = comparison.bestSingleStore
    ? userItems.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      const price = product?.currentPrices.find((candidate) => candidate.storeId === comparison.bestSingleStore?.storeId);
      if (!price) return [];
      return [reportAssignment({
        productId: item.productId,
        quantity: item.quantity,
        storeId: price.storeId,
        storeName: price.storeName,
        unitPrice: price.price,
        lineTotal: roundPrice(price.price * item.quantity)
      })];
    })
    : [];
  const bestSingleStoreTotal = comparison.bestSingleStore?.total ?? null;
  const estimatedProductIds: string[] = [];

  return {
    userId,
    currency: 'SEK',
    favoriteStoreIds,
    itemCount: userItems.reduce((sum, item) => sum + item.quantity, 0),
    strategies: [
      {
        id: 'cheapest_across_selected',
        label: 'Cheapest across selected stores',
        total: comparison.cheapestByProduct.total,
        savingsVsBestSingleStore: comparison.savingsVsBestSingleStore,
        storeCount: comparison.splitStoreCount,
        assignments: cheapestAssignments,
        missingProductIds: comparison.missingProductIds,
        estimatedProductIds,
        warnings: strategyWarnings(comparison.missingProductIds, estimatedProductIds)
      },
      {
        id: 'all_at_one_store',
        label: 'All at one store',
        total: bestSingleStoreTotal,
        savingsVsBestSingleStore: 0,
        storeCount: bestSingleStoreAssignments.length > 0 ? 1 : 0,
        assignments: bestSingleStoreAssignments,
        missingProductIds: comparison.bestSingleStore ? [] : userItems.map((item) => item.productId),
        estimatedProductIds,
        warnings: strategyWarnings(comparison.bestSingleStore ? [] : userItems.map((item) => item.productId), estimatedProductIds)
      },
      {
        id: 'favorite_only',
        label: 'Favorite stores only',
        total: comparison.cheapestByProduct.total,
        savingsVsBestSingleStore: comparison.savingsVsBestSingleStore,
        storeCount: comparison.splitStoreCount,
        assignments: cheapestAssignments,
        missingProductIds: comparison.missingProductIds,
        estimatedProductIds,
        warnings: [
          `Restricted to favorite stores: ${favoriteStoreIds.join(', ') || 'none'}.`,
          ...strategyWarnings(comparison.missingProductIds, estimatedProductIds)
        ]
      },
      privateLabelStrategy(userItems, favoriteStoreIds, bestSingleStoreTotal)
    ],
    missingProductIds: comparison.missingProductIds,
    estimatedProductIds
  };
}

function buildStoreBasketQuote(userId: string, storeId: string, userItems: BasketItemRequest[]): StoreBasketQuote {
  requireKnownStore(storeId);
  const store = stores.find((candidate) => candidate.id === storeId);
  if (!store) throw new Error(`Unknown storeId: ${storeId}`);

  const lines = userItems.map((item): StoreBasketQuoteLine => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const price = product?.currentPrices.find((candidate) => candidate.storeId === storeId);
    if (!product || !price) {
      return {
        productId: item.productId,
        productName: productName(item.productId),
        quantity: item.quantity,
        unitPrice: null,
        lineTotal: null,
        priceLabel: 'missing_price'
      };
    }
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: price.price,
      lineTotal: roundPrice(price.price * item.quantity),
      priceLabel: 'verified_shelf'
    };
  });
  const missingProductIds = lines.filter((line) => line.lineTotal === null).map((line) => line.productId);
  const total = missingProductIds.length === 0
    ? roundPrice(lines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0))
    : null;
  const allStoreIds = stores.map((candidate) => candidate.id);
  const cheapestComplete = compareBasketStrategies({ favoriteStoreIds: allStoreIds, items: basketInputItems(userItems) }).cheapestByProduct.total;

  return {
    userId,
    storeId,
    storeName: store.name,
    currency: 'SEK',
    itemCount: userItems.reduce((sum, item) => sum + item.quantity, 0),
    pricedItemCount: lines.filter((line) => line.lineTotal !== null).reduce((sum, line) => sum + line.quantity, 0),
    total,
    priceGapVsCheapestComplete: total !== null ? roundPrice(total - cheapestComplete) : null,
    lines,
    missingProductIds,
    warnings: missingProductIds.length > 0
      ? ['Some basket items are missing verified shelf prices at this store.']
      : ['All basket items have verified shelf prices at this store.']
  };
}

function buildStorePriceCoverage(storeId: string): StorePriceCoverageReport {
  requireKnownStore(storeId);
  const store = stores.find((candidate) => candidate.id === storeId);
  if (!store) throw new Error(`Unknown storeId: ${storeId}`);

  const lines = products.map((product): StorePriceCoverageLine => {
    const price = product.currentPrices.find((candidate) => candidate.storeId === storeId);
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: price?.price ?? null,
      unitPrice: product.unitPrice,
      priceLabel: price ? 'verified_shelf' : 'missing_price',
      dealScore: product.dealScore,
      band: scoreBand(product.dealScore)
    };
  });
  const pricedLines = lines.filter((line) => line.price !== null);

  return {
    storeId,
    storeName: store.name,
    currency: 'SEK',
    productCount: lines.length,
    pricedProductCount: pricedLines.length,
    coveragePercent: roundPercent((pricedLines.length / lines.length) * 100),
    totalKnownPrice: roundPrice(pricedLines.reduce((sum, line) => sum + (line.price ?? 0), 0)),
    missingProductIds: lines.filter((line) => line.price === null).map((line) => line.productId),
    lines,
    guardrails: [
      'Store coverage counts only products with current verified shelf prices at the selected store.',
      'Missing products stay visible instead of being priced from another store.',
      'Coverage can guide store-page merchandising but does not change Deal Score or basket routing.'
    ]
  };
}

function buildStoreCategoryCoverage(storeId: string): StoreCategoryCoverageReport {
  const coverage = buildStorePriceCoverage(storeId);
  const grouped = new Map<string, StorePriceCoverageLine[]>();
  for (const line of coverage.lines) {
    grouped.set(line.category, [...(grouped.get(line.category) ?? []), line]);
  }

  const categories = [...grouped.entries()].map(([category, lines]): StoreCategoryCoverageRow => {
    const pricedLines = lines.filter((line) => line.price !== null);
    const bestDeal = [...pricedLines].sort((left, right) => right.dealScore - left.dealScore || left.productName.localeCompare(right.productName))[0];
    return {
      category,
      productCount: lines.length,
      pricedProductCount: pricedLines.length,
      coveragePercent: roundPercent((pricedLines.length / lines.length) * 100),
      totalKnownPrice: roundPrice(pricedLines.reduce((sum, line) => sum + (line.price ?? 0), 0)),
      missingProductIds: lines.filter((line) => line.price === null).map((line) => line.productId),
      bestDealProductId: bestDeal?.productId ?? null,
      bestDealScore: bestDeal?.dealScore ?? null
    };
  }).sort((left, right) => left.category.localeCompare(right.category));

  return {
    storeId: coverage.storeId,
    storeName: coverage.storeName,
    currency: coverage.currency,
    categoryCount: categories.length,
    fullyPricedCategoryCount: categories.filter((category) => category.coveragePercent === 100).length,
    categories,
    guardrails: [
      'Category coverage is grouped from the same verified store-price rows as product coverage.',
      'Missing products remain listed by category so store pages do not imply complete coverage.',
      'Category rollups can prioritize data collection but do not fill missing prices from other stores.'
    ]
  };
}

function storeDealsFor(storeId: string): StoreDeal[] {
  requireKnownStore(storeId);
  return products
    .flatMap((product) => {
      const price = product.currentPrices.find((candidate) => candidate.storeId === storeId);
      if (!price) return [];
      return [{
        productId: product.id,
        ticker: product.ticker,
        productName: product.name,
        category: product.category,
        storeId: price.storeId,
        storeName: price.storeName,
        price: price.price,
        dealScore: product.dealScore,
        band: scoreBand(product.dealScore),
        unitPrice: product.unitPrice
      }];
    })
    .sort((left, right) => right.dealScore - left.dealScore || left.price - right.price || left.productName.localeCompare(right.productName));
}

function storeDealSummaryFor(storeId: string): StoreDealSummaryReport {
  const deals = storeDealsFor(storeId);
  const store = stores.find((candidate) => candidate.id === storeId);
  if (!store) throw new Error(`Unknown storeId: ${storeId}`);
  const grouped = new Map<string, StoreDeal[]>();
  for (const deal of deals) {
    grouped.set(deal.category, [...(grouped.get(deal.category) ?? []), deal]);
  }

  return {
    storeId,
    storeName: store.name,
    dealCount: deals.length,
    buyVerdictCount: deals.filter((deal) => deal.band.verdict === 'Buy').length,
    averageDealScore: deals.length > 0
      ? roundPercent(deals.reduce((sum, deal) => sum + deal.dealScore, 0) / deals.length)
      : 0,
    topDeal: deals[0] ?? null,
    categories: [...grouped.entries()].map(([category, rows]) => {
      const topDeal = [...rows].sort((left, right) => right.dealScore - left.dealScore || left.price - right.price || left.productName.localeCompare(right.productName))[0]!;
      return {
        category,
        dealCount: rows.length,
        averageDealScore: roundPercent(rows.reduce((sum, deal) => sum + deal.dealScore, 0) / rows.length),
        topProductId: topDeal.productId,
        topDealScore: topDeal.dealScore
      };
    }).sort((left, right) => right.averageDealScore - left.averageDealScore || left.category.localeCompare(right.category)),
    guardrails: [
      'Store deal summaries are derived from verified in-store deal rows only.',
      'Average Deal Score is informational and does not hide lower-scoring products.',
      'Category leaders summarize current rows but cannot fill missing store prices.'
    ]
  };
}

function flyerOfferFromRow(row: (typeof flyerOfferRows)[number]): FlyerOffer {
  const product = products.find((candidate) => candidate.id === row.productId);
  const store = stores.find((candidate) => candidate.id === row.storeId);
  if (!product) throw new Error(`Unknown productId: ${row.productId}`);
  if (!store) throw new Error(`Unknown storeId: ${row.storeId}`);
  const savings = roundPrice(row.regularPrice - row.offerPrice);
  return {
    offerId: row.offerId,
    flyerId: row.flyerId,
    chain: store.chain,
    storeId: store.id,
    storeName: store.name,
    branchDistrict: store.district,
    productId: product.id,
    productName: product.name,
    category: product.category,
    regularPrice: row.regularPrice,
    offerPrice: row.offerPrice,
    savings,
    discountPercent: row.regularPrice > 0 ? roundPercent((savings / row.regularPrice) * 100) : 0,
    currency: 'SEK',
    priceType: row.priceType,
    validFrom: row.validFrom,
    validThrough: row.validThrough,
    observedAt: row.observedAt,
    sourceType: 'weekly_flyer',
    sourceUrl: row.sourceUrl,
    sourceRunId: row.sourceRunId,
    confidence: row.confidence,
    dealScore: product.dealScore,
    band: scoreBand(product.dealScore)
  };
}

function flyerOfferFromObservation(row: FlyerOfferObservationInput): FlyerOffer {
  const savings = roundPrice(row.regularPrice - row.price);
  const discountPercent = row.regularPrice > 0 ? roundPercent((savings / row.regularPrice) * 100) : 0;
  const dealScore = calculateDealScore({
    currentCityPercentile: Math.max(0, 100 - discountPercent * 3),
    knownPromoHistoryPercentile: Math.max(0, 100 - discountPercent * 2),
    equivalentUnitPricePercentile: Math.max(0, 100 - discountPercent * 2.5),
    discountDepthPercent: discountPercent,
    sourceConfidence: row.confidence
  });
  return {
    offerId: row.observationId,
    flyerId: row.sourceRunId ?? row.rawRecordId ?? row.observationId,
    chain: row.chainSlug,
    storeId: row.storeSlug,
    storeName: row.storeName,
    branchDistrict: row.storeCity ?? row.chainName,
    productId: row.productSlug,
    productName: row.productName,
    category: row.categoryPath[0] ?? 'uncategorized',
    regularPrice: row.regularPrice,
    offerPrice: row.price,
    savings,
    discountPercent,
    currency: row.currency,
    priceType: row.memberRequired || row.priceType === 'member' ? 'member_flyer' : 'flyer',
    validFrom: row.validFrom ?? row.promotionStartsOn ?? row.observedAt,
    validThrough: row.validUntil ?? row.promotionEndsOn ?? row.observedAt,
    observedAt: row.observedAt,
    sourceType: 'weekly_flyer',
    sourceUrl: typeof row.provenance.sourceUrl === 'string' ? row.provenance.sourceUrl : '',
    sourceRunId: row.sourceRunId ?? '',
    confidence: row.confidence,
    dealScore,
    band: scoreBand(dealScore)
  };
}

function activeFlyerOffers(asOf: string): FlyerOffer[] {
  const asOfMs = Date.parse(requireIsoTimestamp(asOf, 'asOf'));
  return flyerOfferRows
    .map(flyerOfferFromRow)
    .filter((offer) => Date.parse(offer.validFrom) <= asOfMs && asOfMs <= Date.parse(offer.validThrough));
}

function buildFlyerOfferReportFromOffers(asOf: string, options: {
  storeId?: string;
  chain?: string;
  category?: string;
  productId?: string;
}, sourceOffers: FlyerOffer[]): FlyerOfferReport {
  const chain = options.chain?.trim().toLowerCase();
  const category = options.category?.trim().toLowerCase();
  const offers = sourceOffers
    .filter((offer) => !options.storeId || offer.storeId === options.storeId)
    .filter((offer) => !chain || offer.chain === chain)
    .filter((offer) => !category || offer.category.toLowerCase() === category)
    .filter((offer) => !options.productId || offer.productId === options.productId)
    .sort((left, right) =>
      right.dealScore - left.dealScore ||
      right.discountPercent - left.discountPercent ||
      left.storeName.localeCompare(right.storeName) ||
      left.productName.localeCompare(right.productName)
    );
  const storesById = new Map<string, FlyerOffer[]>();
  for (const offer of offers) {
    storesById.set(offer.storeId, [...(storesById.get(offer.storeId) ?? []), offer]);
  }
  const storesSummary = [...storesById.entries()].map(([storeId, storeOffers]) => {
    const topOffer = storeOffers[0]!;
    return {
      storeId,
      storeName: topOffer.storeName,
      chain: topOffer.chain,
      offerCount: storeOffers.length,
      totalOneEachSavings: roundPrice(storeOffers.reduce((sum, offer) => sum + offer.savings, 0)),
      topOfferId: topOffer.offerId,
      topDealScore: topOffer.dealScore
    };
  }).sort((left, right) =>
    right.topDealScore - left.topDealScore ||
    right.totalOneEachSavings - left.totalOneEachSavings ||
    left.storeName.localeCompare(right.storeName)
  );

  return {
    asOf,
    filters: {
      ...(options.storeId ? { storeId: options.storeId } : {}),
      ...(chain ? { chain } : {}),
      ...(category ? { category } : {}),
      ...(options.productId ? { productId: options.productId } : {})
    },
    offerCount: offers.length,
    stores: storesSummary,
    offers,
    guardrails: [
      'Flyer offers are active only inside their captured validity window.',
      'Branch-level offers stay tied to a store, source run, and flyer URL before they can drive shopper action.',
      'Member flyer prices remain labeled and never overwrite public shelf price history.'
    ]
  };
}

export function buildFlyerOfferReport(input: {
  observations: FlyerOfferObservationInput[];
  asOf: string;
  filters?: {
    storeId?: string;
    chain?: string;
    category?: string;
    productId?: string;
  };
}): FlyerOfferReport {
  const asOf = requireIsoTimestamp(input.asOf, 'asOf');
  const asOfMs = Date.parse(asOf);
  const offers = input.observations
    .filter((row) => row.price < row.regularPrice)
    .map(flyerOfferFromObservation)
    .filter((offer) => Date.parse(offer.validFrom) <= asOfMs && asOfMs <= Date.parse(offer.validThrough));
  return buildFlyerOfferReportFromOffers(asOf, input.filters ?? {}, offers);
}

function flyerOfferReport(options: {
  asOf?: string;
  storeId?: string;
  chain?: string;
  category?: string;
  productId?: string;
} = {}): FlyerOfferReport {
  const asOf = options.asOf ?? '2026-05-20T12:00:00.000Z';
  if (options.storeId) requireKnownStore(options.storeId);
  if (options.productId) requireKnownProduct(options.productId);
  return buildFlyerOfferReportFromOffers(asOf, options, activeFlyerOffers(asOf));
}



const fulfillmentSlotEvidence: Record<string, BasketFulfillmentSlotInput[]> = {
  'willys-odenplan': [
    { slotId: 'willys-pickup-tomorrow-0900', mode: 'pickup', startsAt: '2026-05-23T09:00:00.000Z', endsAt: '2026-05-23T10:00:00.000Z', fee: 0, currency: 'SEK', available: true },
    { slotId: 'willys-delivery-tomorrow-1800', mode: 'delivery', startsAt: '2026-05-23T18:00:00.000Z', endsAt: '2026-05-23T20:00:00.000Z', fee: 59, currency: 'SEK', available: false }
  ]
};

function buildBasketFulfillmentSlotsReport(userId: string, retailerId: string, storeId: string, basketItems: BasketItemRequest[]): BasketFulfillmentSlotsReport {
  requireNonEmptyId(userId, 'userId');
  requireKnownStore(storeId);
  const store = stores.find((candidate) => candidate.id === storeId)!;
  const plan = planBasketFulfillmentSlots({
    retailerId,
    retailerName: retailerId.charAt(0).toUpperCase() + retailerId.slice(1),
    storeId,
    storeName: store.name,
    asOf: '2026-05-22T09:45:00.000Z',
    basketProductIds: basketItems.map((item) => item.productId),
    source: { access: 'manual_evidence', evidenceUrl: `https://www.${retailerId}.se/checkout/slots`, capturedAt: '2026-05-22T09:40:00.000Z', shopperConsent: true },
    slots: fulfillmentSlotEvidence[storeId] ?? []
  });
  return { userId, basketItemCount: basketItems.length, ...plan };
}

function basketImportKnownProducts() {
  return products.map((product) => ({
    productId: product.id,
    productName: product.name,
    aliases: [product.name, product.ticker]
  }));
}

export const basketImportReviewGuardrails = [
  'Retailer basket review rows are account-bound and never visible across signed-in users.',
  'Unmatched retailer rows stay out of the basket until a signed-in shopper accepts a verified GroceryView product match.',
  'Dismissed retailer rows remain auditable and are not silently converted into products.'
];

function basketImportReviewId(userId: string, source: BasketImportExportSource, rawName: string, index: number): string {
  const slug = rawName
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9åäö]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'retailer-row';
  return `basket-import-review-${userId}-${source.retailerId}-${Date.parse(source.capturedAt)}-${index}-${slug}`;
}

export function createBasketImportReviewItems(
  userId: string,
  source: BasketImportExportSource,
  reviewItems: BasketImportExportReviewItem[],
  existingCount = 0
): BasketImportReviewItem[] {
  return reviewItems.map((item, index): BasketImportReviewItem => ({
    ...item,
    reviewItemId: basketImportReviewId(userId, source, item.rawName, existingCount + index),
    retailerId: source.retailerId,
    sourceKind: source.sourceKind,
    capturedAt: source.capturedAt,
    status: 'open',
    createdAt: source.capturedAt
  }));
}

function storeFlyerOfferReport(storeId: string, asOf?: string): StoreFlyerOfferReport {
  requireKnownStore(storeId);
  const store = stores.find((candidate) => candidate.id === storeId)!;
  const report = flyerOfferReport({ storeId, asOf });
  return {
    storeId,
    storeName: store.name,
    chain: store.chain,
    asOf: report.asOf,
    offerCount: report.offerCount,
    categoryCount: new Set(report.offers.map((offer) => offer.category)).size,
    totalOneEachSavings: roundPrice(report.offers.reduce((sum, offer) => sum + offer.savings, 0)),
    bestOffer: report.offers[0] ?? null,
    offers: report.offers,
    guardrails: report.guardrails
  };
}

export function createGroceryViewApi() {
  const favoriteStores = new Map<string, Set<string>>();
  const watchlists = new Map<string, WatchlistItem[]>();
  const baskets = new Map<string, BasketItemRequest[]>();
  const budgets = new Map<string, UserBudgetPatch>();
  const categoryBudgets = new Map<string, CategoryBudgetPatch[]>();
  const subscriptionEntitlements = new Map<string, SubscriptionEntitlementSnapshot>();
  const householdPlans = new Map<string, HouseholdPlan>();
  const basketImportReviews = new Map<string, BasketImportReviewItem[]>();

  const productSnapshots = () =>
    products.map((product) => {
      const bestPrice = bestPriceFor(product);
      return {
        productId: product.id,
        productName: product.name,
        bestPrice: bestPrice?.price ?? 0,
        bestStoreId: bestPrice?.storeId ?? '',
        bestPriceType: bestPrice?.priceType ?? 'shelf' as const,
        prices: product.currentPrices.map((price) => ({
          storeId: price.storeId,
          storeName: price.storeName,
          price: price.price,
          priceType: price.priceType ?? 'shelf' as const
        })),
        dealScore: product.dealScore,
        isNew52WeekLow: product.id === 'coffee'
      };
    });

  return {
    getMarketOverview() {
      const movers = [...products]
        .map(marketMoverFor)
        .sort((left, right) => Math.abs(right.oneMonthMovePercent ?? 0) - Math.abs(left.oneMonthMovePercent ?? 0));
      const topDeals = [...products]
        .sort((a, b) => b.dealScore - a.dealScore)
        .map((product) => {
          const bestPrice = bestPriceFor(product);
          return {
            productId: product.id,
            ticker: product.ticker,
            bestPrice: bestPrice?.price ?? null,
            bestStoreId: bestPrice?.storeId ?? null,
            dealScore: product.dealScore,
            band: scoreBand(product.dealScore)
          };
        });
      return { city: 'Stockholm', indices: [buildStockholmGroceryIndex()], movers, topDeals };
    },

    getNutritionValueReport(metric: NutritionMetric = 'protein'): NutritionValueReport {
      const rows = rankNutritionPerKrona(nutritionProducts, metric);
      const leader = rows[0]
        ? {
            productId: rows[0].productId,
            name: rows[0].name,
            valuePer10Sek: rows[0].valuePer10Sek,
            saltWarning: rows[0].saltWarning
          }
        : null;
      return {
        metric,
        currency: 'SEK',
        rows,
        leader,
        guardrails: [
          'Verified nutrition labels cannot override allergen locks or household diet rules.',
          'Salt and sugar warnings remain visible even when a product has strong value per krona.',
          'Nutrition value is advisory and cannot rewrite basket or meal-plan decisions without user confirmation.'
        ]
      };
    },

    getMealPlanSuggestionsReport(userId: string, options: { maxMealCost?: number; servings?: number } = {}): MealPlanSuggestionsReport {
      requireNonEmptyId(userId, 'userId');
      const maxMealCost = options.maxMealCost ?? 120;
      const servings = options.servings ?? 4;
      requirePositiveFinite(maxMealCost, 'maxMealCost');
      requirePositiveFinite(servings, 'servings');
      const suggestions = suggestDealBasedMeals({ deals: mealDeals, maxMealCost, servings });
      return {
        userId,
        currency: 'SEK',
        servings,
        maxMealCost,
        suggestions,
        dealCount: mealDeals.length,
        ingredientProductIds: [...new Set(suggestions.flatMap((suggestion) => suggestion.ingredientProductIds))].sort(),
        guardrails: [
          'Meal suggestions use current high-scoring deals but never update a basket without user confirmation.',
          'Diet, allergen, and household rules must be checked before a suggested meal is saved.',
          'Per-serving cost is advisory and cannot hide stale or missing ingredient price evidence.'
        ]
      };
    },

    getExpiryDealRadarReport(userId: string, options: { now?: string; categoryFilter?: string[]; maxDistanceKm?: number } = {}): ExpiryDealRadarReport {
      requireNonEmptyId(userId, 'userId');
      const now = options.now ?? '2026-05-20T10:00:00.000Z';
      const favoriteStoreIds = this.getFavoriteStores(userId).map((store) => store.id);
      const categoryFilter = options.categoryFilter ?? [];
      if (options.maxDistanceKm !== undefined) requirePositiveFinite(options.maxDistanceKm, 'maxDistanceKm');
      const radar = buildExpiryDealRadar({
        now,
        reports: expiryDealReports,
        favoriteStoreIds,
        categoryFilter,
        ...(options.maxDistanceKm === undefined ? {} : { maxDistanceKm: options.maxDistanceKm })
      });
      return {
        userId,
        now,
        favoriteStoreIds,
        categoryFilter,
        ...(options.maxDistanceKm === undefined ? {} : { maxDistanceKm: options.maxDistanceKm }),
        reportCount: expiryDealReports.length,
        ...radar,
        guardrails: [
          'Expiry markdowns require recent reports and remain separate from public shelf-price history.',
          'Favorite-store and category filters narrow visibility without changing markdown scores.',
          'Needs-confirmation markdowns can inform planning but cannot trigger automatic basket updates.'
        ]
      };
    },

    getPantryReplenishment(userId: string, asOf = '2026-05-20T08:00:00.000Z'): PantryPlan {
      requireNonEmptyId(userId, 'userId');
      const basketItems = baskets.get(userId) ?? [];
      const household: HouseholdSnapshot = {
        id: userId,
        name: `${userId} pantry`,
        weeklyBudget: budgets.get(userId)?.weeklyBudget ?? 0,
        members: [{ userId, displayName: userId }],
        basketItems: basketItems.map((item) => ({ productId: item.productId, quantity: item.quantity, addedBy: userId })),
        watchlistItems: (watchlists.get(userId) ?? []).map((item) => ({ productId: item.productId, targetPrice: item.targetPrice, addedBy: userId })),
        sharedFavoriteStoreIds: this.getFavoriteStores(userId).map((store) => store.id)
      };
      const deals = products.flatMap((product) => {
        const bestPrice = bestPriceFor(product);
        return bestPrice
          ? [{ productId: product.id, storeId: bestPrice.storeId, storeName: bestPrice.storeName, price: bestPrice.price, dealScore: product.dealScore }]
          : [];
      });
      return planPantryReplenishment({
        now: asOf,
        household,
        pantry: defaultPantry,
        usage: defaultPantryUsage,
        deals
      });
    },

    getLoyaltyOfferReport(userId: string): LoyaltyOfferReport {
      requireNonEmptyId(userId, 'userId');
      return {
        userId,
        offers: loyaltyOffers.map((offer) => ({ ...offer })),
        totalEligibleSavings: loyaltyOffers
          .filter((offer) => offer.status !== 'needs_membership')
          .reduce((sum, offer) => roundPrice(sum + offer.savings), 0),
        requiresActionCount: loyaltyOffers.filter((offer) => offer.actionRequired).length,
        membershipRequiredCount: 1,
        guardrails: [
          'Member-only savings never overwrite verified public shelf evidence.',
          'Coupon-required offers need explicit action before checkout routing.',
          'Unlinked loyalty programs stay out of realized savings until the household confirms access.'
        ]
      };
    },

    getAdDisclosureReport(userId: string, entitlementOverride?: SubscriptionEntitlementSnapshot | null): AdDisclosureReport {
      requireNonEmptyId(userId, 'userId');
      const entitlement = entitlementOverride ?? subscriptionEntitlements.get(userId);
      const userTier: UserTier = entitlement?.tier === 'premium' && entitlement.status === 'active' ? 'premium' : 'free';
      const placementPlan = buildAdPlacementPlan({ userTier, configuredProviders: ['adsense', 'admob'] });
      const deliverySlots = buildAdPlacementPlan({ userTier: 'free', configuredProviders: ['adsense', 'admob'] }).slots;
      const candidateSlots = [
        ...deliverySlots.map((slot) => ({
          surface: slot.surface,
          provider: slot.provider,
          userTier,
          label: slot.label,
          organicRankingSeparated: slot.organicRankingSeparated,
          affectsDealScore: false
        })),
        {
          surface: 'deal_score' as const,
          provider: 'adsense' as const,
          userTier,
          label: 'Sponsored',
          organicRankingSeparated: true,
          affectsDealScore: true
        },
        {
          surface: 'checkout_decision' as const,
          provider: 'admob' as const,
          userTier,
          label: 'Sponsored',
          organicRankingSeparated: true,
          affectsDealScore: false
        }
      ];
      const compliance = buildAdDeliveryComplianceReport(candidateSlots);
      return {
        userId,
        userTier,
        placementPlan,
        compliance,
        allowedCount: compliance.allowed.length,
        blockedCount: compliance.blocked.length,
        excludedSurfaces: placementPlan.excludedSurfaces,
        premiumAdsRemoved: userTier === 'premium' && placementPlan.slots.length === 0,
        affectsDealScore: placementPlan.affectsDealScore,
        guardrails: [
          'Sponsored placements cannot change Deal Score, basket totals, or store ordering.',
          'Premium entitlements remove non-critical ads before delivery.',
          'Advertiser payloads stay aggregated and never include raw receipts.'
        ]
      };
    },

    getNotificationInboxReport(userId: string): NotificationInboxReport {
      requireNonEmptyId(userId, 'userId');
      const watchlist = this.getWatchlist(userId);
      const deliveredRows: NotificationInboxQueueItem[] = watchlist.alerts.map((alert, index) => ({
        id: `alert-${alert.productId}-${alert.type}-${index}`,
        title: alert.productName,
        channel: alert.severity === 'urgent' ? 'push' : 'email',
        status: 'delivered',
        reason: alert.trigger.metric === 'price_history' ? 'Verified 52-week low signal' : 'Verified shelf price or Deal Score trigger',
        action: alert.trigger.metric === 'deal_score' ? 'Open deal' : 'Open price history',
        priority: alert.severity === 'urgent' ? 'high' : 'normal',
        productId: alert.productId
      }));
      const queue: NotificationInboxQueueItem[] = [
        ...deliveredRows,
        {
          id: 'receipt-review-quiet-hours',
          title: 'Receipt review reminder',
          channel: 'push',
          status: 'held',
          reason: 'Quiet hours 21:00-07:00',
          action: 'Send in morning digest',
          priority: 'normal'
        },
        {
          id: 'butter-provider-suppression',
          title: 'Butter target price',
          channel: 'push',
          status: 'suppressed',
          reason: 'Provider token invalid',
          action: 'Request device refresh',
          priority: 'normal',
          productId: 'butter'
        }
      ];
      const deliveredCount = queue.filter((item) => item.status === 'delivered').length;
      const heldCount = queue.filter((item) => item.status === 'held').length;
      const suppressedCount = queue.filter((item) => item.status === 'suppressed').length;
      return {
        userId,
        trackedItemCount: watchlist.items.length,
        activeAlertCount: watchlist.alerts.length,
        deliveredCount,
        heldCount,
        suppressedCount,
        summary: {
          delivered: deliveredCount,
          held: heldCount,
          suppressed: suppressedCount,
          total: queue.length
        },
        queue,
        quietHoursWindow: '21:00-07:00',
        guardrails: [
          'Estimated prices never generate household alerts.',
          'Quiet-hours holds wait for the morning digest unless the alert is critical.',
          'Provider suppressions stop future sends until the device or email recipient refreshes.'
        ]
      };
    },

    getReceiptReviewReport(userId: string): ReceiptReviewReport {
      requireNonEmptyId(userId, 'userId');
      const review = reviewReceiptScan({
        receipt: {
          storeId: 'willys-odenplan',
          purchasedAt: '2026-05-19T16:00:00.000Z',
          totalAmount: 642,
          ocrConfidence: 0.82,
          rows: [
            { rawName: 'ZOEGA SKANEROST', quantity: 1, itemTotal: 49.9 },
            { rawName: 'CHEESE 500G', quantity: 1, itemTotal: 78 },
            { rawName: 'SMUDGED ITEM', quantity: 1, itemTotal: 18 }
          ]
        },
        aliases: [
          { rawName: 'ZOEGA SKANEROST', productId: 'coffee', canonicalName: 'Zoégas Coffee 450g', matchConfidence: 0.9 },
          { rawName: 'CHEESE 500G', productId: 'cheese', canonicalName: 'Cheese 500g', matchConfidence: 0.7 }
        ],
        localMedians: { coffee: 64.9, cheese: 60 },
        weeklyBudget: 800,
        weekSpendBeforeReceipt: 120
      });
      const matchedCount = review.matchedItems.filter((item) => item.productId !== null).length;
      const needsReviewCount = review.matchedItems.filter((item) => item.productId === null || item.matchConfidence < 0.8).length;
      return {
        userId,
        review,
        lineCount: review.matchedItems.length,
        matchedCount,
        needsReviewCount,
        guardrails: [
          'Low confidence receipt rows cannot update catalog or Deal Score.',
          'Loyalty discount lines affect receipt totals without overwriting public shelf prices.',
          'Only verified product matches can update household spend and product price history.'
        ]
      };
    },

    getCategoryMarket(category: string): CategoryMarketReport | null {
      return categoryMarketFor(category);
    },

    getStores() {
      return stores;
    },

    getStore(id: string) {
      return stores.find((store) => store.id === id) ?? null;
    },

    getStoreDeals(storeId: string) {
      return storeDealsFor(storeId);
    },

    getStoreDealSummary(storeId: string): StoreDealSummaryReport {
      return storeDealSummaryFor(storeId);
    },

    getFlyerOffers(options: { asOf?: string; storeId?: string; chain?: string; category?: string; productId?: string } = {}): FlyerOfferReport {
      return flyerOfferReport(options);
    },

    getStoreFlyerOffers(storeId: string, options: { asOf?: string } = {}): StoreFlyerOfferReport {
      return storeFlyerOfferReport(storeId, options.asOf);
    },

    getStorePriceCoverage(storeId: string): StorePriceCoverageReport {
      return buildStorePriceCoverage(storeId);
    },

    getStoreCategoryCoverage(storeId: string): StoreCategoryCoverageReport {
      return buildStoreCategoryCoverage(storeId);
    },

    searchProducts(query: string) {
      return searchProducts(products, query);
    },

    getProduct(id: string) {
      const product = products.find((candidate) => candidate.id === id);
      if (!product) return null;
      return { ...product, currentPrices: sortPricesByValue(product.currentPrices) };
    },

    getProductPrices(id: string) {
      return sortPricesByValue(this.getProduct(id)?.currentPrices ?? []);
    },

    getProductCheapestNow(id: string): ProductCheapestNow | null {
      const product = this.getProduct(id);
      if (!product) return null;
      const chainPrices = cheapestByChain(product);
      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        currency: 'SEK',
        cheapest: chainPrices[0] ?? null,
        chainPrices,
        chainCount: chainPrices.length,
        observedPriceCount: product.currentPrices.length,
        lastObservedAt: latestObservedAt(product),
        guardrails: [
          'Cheapest-now compares only current observed prices for this exact product.',
          'Each chain contributes at most its cheapest currently observed store row.',
          'Missing chains stay absent instead of being estimated from other chains or products.'
        ]
      };
    },

    getProductHistory(id: string) {
      return this.getProduct(id)?.history ?? [];
    },

    getProductHistorySummary(id: string): ProductHistorySummaryReport | null {
      const product = this.getProduct(id);
      if (!product) return null;
      return productHistorySummaryFor(product);
    },

    getProductHistoryConfidence(id: string): ProductHistoryConfidenceReport | null {
      const product = this.getProduct(id);
      if (!product) return null;
      return productHistoryConfidenceFor(product);
    },

    getProductPriceTerminal(id: string, options: { asOf?: string } = {}): ProductPriceTerminalReport | null {
      const product = this.getProduct(id);
      if (!product) return null;
      return productPriceTerminalFor(product, options.asOf);
    },

    getProductPriceSpread(id: string): ProductPriceSpreadReport | null {
      const product = this.getProduct(id);
      if (!product) return null;
      return productPriceSpreadFor(product);
    },

    getProductStoreSavings(id: string): ProductStoreSavingsReport | null {
      const product = this.getProduct(id);
      if (!product) return null;
      return productStoreSavingsFor(product);
    },

    getDealScore(productId: string, options: { distanceKm?: number } = {}): DealScoreReport | null {
      const product = this.getProduct(productId);
      if (!product) return null;
      void options.distanceKm;

      const bestPrice = bestPriceFor(product);
      const median = medianPrice(product.currentPrices);
      const band = scoreBand(product.dealScore);
      const discountVsMedianPercent =
        bestPrice && median && median > 0 ? roundPercent(((median - bestPrice.price) / median) * 100) : 0;

      return {
        productId: product.id,
        score: product.dealScore,
        band,
        verdict: band.verdict,
        discountVsMedianPercent,
        historicalPercentile: product.dealSignals.knownPromoHistoryPercentile,
        confidence: product.dealSignals.sourceConfidence,
        reasons: buildDealScoreReasons(product, bestPrice, band)
      };
    },

    getProductEquivalents(id: string): ProductEquivalent[] {
      const product = this.getProduct(id);
      if (!product) return [];
      return products
        .filter((candidate) => candidate.id !== product.id && candidate.category === product.category)
        .map(productEquivalentFor)
        .sort((left, right) => right.dealScore - left.dealScore || left.productName.localeCompare(right.productName));
    },

    getPriceFreshnessReport(asOf = new Date().toISOString()): PriceFreshnessReport {
      const normalizedAsOf = requireIsoDateOrTimestamp(asOf, 'asOf');
      const asOfDay = toUtcDay(normalizedAsOf);
      const rows = products.map((product) => {
        const latestDate = latestVerifiedPriceDate(product);
        const ageDays = latestDate ? Math.max(0, asOfDay - toUtcDay(latestDate)) : null;
        const status = priceFreshnessStatus(ageDays);
        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          latestVerifiedPriceDate: latestDate,
          ageDays,
          status,
          action:
            status === 'stale'
              ? 'prioritize_manual_or_feed_refresh'
              : status === 'aging'
                ? 'schedule_price_check'
                : 'none'
        } satisfies ProductPriceFreshness;
      });
      const summary = rows.reduce<Record<PriceFreshnessStatus, number>>(
        (counts, row) => ({ ...counts, [row.status]: counts[row.status] + 1 }),
        { fresh: 0, aging: 0, stale: 0 }
      );
      return {
        asOf: normalizedAsOf,
        thresholds: { agingAfterDays: 7, staleAfterDays: 14 },
        summary,
        products: rows.sort((left, right) => (right.ageDays ?? Number.MAX_SAFE_INTEGER) - (left.ageDays ?? Number.MAX_SAFE_INTEGER)),
        backfillProductIds: rows
          .filter((row) => row.status !== 'fresh')
          .map((row) => row.productId)
          .sort()
      };
    },

    addFavoriteStore(userId: string, storeId: string) {
      requireNonEmptyId(userId, 'userId');
      requireKnownStore(storeId);
      const set = favoriteStores.get(userId) ?? new Set<string>();
      set.add(storeId);
      favoriteStores.set(userId, set);
    },

    removeFavoriteStore(userId: string, storeId: string) {
      requireNonEmptyId(userId, 'userId');
      requireKnownStore(storeId);
      const set = favoriteStores.get(userId) ?? new Set<string>();
      set.delete(storeId);
      favoriteStores.set(userId, set);
    },

    getFavoriteStores(userId: string) {
      const ids = favoriteStores.get(userId) ?? new Set<string>();
      return stores.filter((store) => ids.has(store.id));
    },

    addWatchlistItem(userId: string, item: WatchlistItem) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(item.productId);
      requireOptionalPositiveFinite(item.targetPrice, 'targetPrice');
      requireScoreThreshold(item.alertDealScoreAt);
      requireAllowedPriceTypes(item.allowedPriceTypes);
      watchlists.set(userId, [...(watchlists.get(userId) ?? []), item]);
    },

    updateWatchlistItem(userId: string, productId: string, patch: Partial<Omit<WatchlistItem, 'productId'>>) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(productId);
      requireOptionalPositiveFinite(patch.targetPrice, 'targetPrice');
      requireScoreThreshold(patch.alertDealScoreAt);
      requireAllowedPriceTypes(patch.allowedPriceTypes);
      const items = watchlists.get(userId) ?? [];
      const index = items.findIndex((item) => item.productId === productId);
      if (index === -1) throw new Error(`Watchlist item not found: ${productId}`);
      const next = [...items];
      next[index] = {
        ...next[index],
        ...(patch.targetPrice === undefined ? {} : { targetPrice: patch.targetPrice }),
        ...(patch.alertDealScoreAt === undefined ? {} : { alertDealScoreAt: patch.alertDealScoreAt }),
        ...(patch.favoriteStoresOnly === undefined ? {} : { favoriteStoresOnly: patch.favoriteStoresOnly }),
        ...(patch.allowedPriceTypes === undefined ? {} : { allowedPriceTypes: patch.allowedPriceTypes }),
        productId
      };
      watchlists.set(userId, next);
    },

    removeWatchlistItem(userId: string, productId: string) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(productId);
      const items = watchlists.get(userId) ?? [];
      const next = items.filter((item) => item.productId !== productId);
      watchlists.set(userId, next);
      return { removed: next.length !== items.length };
    },

    getWatchlist(userId: string): { items: WatchlistItem[]; alerts: WatchlistAlert[] } {
      const items = watchlists.get(userId) ?? [];
      const favoriteStoreIds = this.getFavoriteStores(userId).map((store) => store.id);
      return { items, alerts: buildWatchlistAlerts({ watchlist: items, products: productSnapshots(), favoriteStoreIds }) };
    },

    addWatchlistPriceAlert(userId: string, alert: WatchlistPriceAlertRequest): WatchlistPriceAlertReport {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(alert.productId);
      requirePositiveFinite(alert.targetPrice, 'targetPrice');
      requireAllowedPriceTypes(alert.allowedPriceTypes);
      const current = watchlists.get(userId) ?? [];
      const existingIndex = current.findIndex((item) => item.productId === alert.productId);
      const nextItem: WatchlistItem = {
        ...(existingIndex >= 0 ? current[existingIndex]! : { productId: alert.productId }),
        productId: alert.productId,
        targetPrice: alert.targetPrice,
        favoriteStoresOnly: alert.favoriteStoresOnly ?? current[existingIndex]?.favoriteStoresOnly ?? true,
        ...(alert.allowedPriceTypes === undefined ? {} : { allowedPriceTypes: alert.allowedPriceTypes })
      };
      const next = existingIndex >= 0
        ? current.map((item, index) => index === existingIndex ? nextItem : item)
        : [...current, nextItem];
      watchlists.set(userId, next);
      return this.getWatchlistPriceAlerts(userId);
    },

    getWatchlistPriceAlerts(userId: string): WatchlistPriceAlertReport {
      requireNonEmptyId(userId, 'userId');
      const watchlist = this.getWatchlist(userId);
      const alerts = watchlist.alerts.filter((alert) => alert.type === 'target_price');
      return {
        userId,
        trackedItemCount: watchlist.items.filter((item) => item.targetPrice !== undefined).length,
        alertCount: alerts.length,
        alerts,
        guardrails: [
          'Price alerts require a user-defined target price and current eligible price evidence.',
          'Favorite-store and allowed-price-type filters are applied before an alert is emitted.',
          'Estimated prices are excluded unless the watcher explicitly allows estimated price types.'
        ]
      };
    },

    addBasketItem(userId: string, item: BasketItemRequest) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(item.productId);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99) {
        throw new Error('quantity must be an integer between 1 and 99');
      }
      const current = baskets.get(userId) ?? [];
      const existing = current.find((basketItem) => basketItem.productId === item.productId);
      if (existing) {
        const quantity = existing.quantity + item.quantity;
        if (quantity > 99) {
          throw new Error('quantity must be an integer between 1 and 99');
        }
        baskets.set(userId, current.map((basketItem) =>
          basketItem.productId === item.productId ? { ...basketItem, quantity } : basketItem
        ));
        return;
      }
      baskets.set(userId, [...current, item]);
    },

    updateBasketItem(userId: string, productId: string, quantity: number) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(productId);
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
        throw new Error('quantity must be an integer between 1 and 99');
      }
      const items = baskets.get(userId) ?? [];
      const index = items.findIndex((item) => item.productId === productId);
      if (index === -1) throw new Error(`Basket item not found: ${productId}`);
      const next = [...items];
      next[index] = { productId, quantity };
      baskets.set(userId, next);
    },

    removeBasketItem(userId: string, productId: string) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(productId);
      const items = baskets.get(userId) ?? [];
      const next = items.filter((item) => item.productId !== productId);
      if (next.length === items.length) throw new Error(`Basket item not found: ${productId}`);
      baskets.set(userId, next);
    },

    getBasket(userId: string) {
      return { items: baskets.get(userId) ?? [] };
    },

    compareBasket(userId: string): BasketComparisonResult {
      const favoriteStoreIds = this.getFavoriteStores(userId).map((store) => store.id);
      return compareBasketStrategies({ favoriteStoreIds, items: basketInputItems(baskets.get(userId) ?? []) });
    },

    compareBasketReport(userId: string): BasketComparisonReport {
      const favoriteStoreIds = this.getFavoriteStores(userId).map((store) => store.id);
      return buildBasketComparisonReport(userId, favoriteStoreIds, baskets.get(userId) ?? []);
    },


    getBasketFulfillmentSlots(userId: string, retailerId: string, storeId: string): BasketFulfillmentSlotsReport {
      return buildBasketFulfillmentSlotsReport(userId, retailerId, storeId, baskets.get(userId) ?? []);
    },

    getBasketTripCostReport(userId: string, request: BasketTripCostRequest): BasketTripCostReport {
      const favoriteStoreIds = this.getFavoriteStores(userId).map((store) => store.id);
      return buildBasketTripCostReport(userId, favoriteStoreIds, baskets.get(userId) ?? [], request);
    },


    getRetailerHandoffPlan(userId: string, retailerId: string): RetailerHandoffReport {
      return buildRetailerHandoffReport(userId, retailerId, baskets.get(userId) ?? []);
    },

    getRetailerBasketTransferSession(userId: string, retailerId: string): RetailerBasketTransferSessionReport {
      return buildRetailerBasketTransferSession(userId, retailerId, baskets.get(userId) ?? []);
    },

    importBasketFromRetailerPage(userId: string, request: BasketImportExportRequest): BasketImportExportReport {
      requireNonEmptyId(userId, 'userId');
      const plan = planBasketImportExport({
        source: request.source,
        capturedLines: request.capturedLines,
        knownProducts: basketImportKnownProducts()
      });
      for (const item of plan.acceptedItems) this.addBasketItem(userId, { productId: item.productId, quantity: item.quantity });
      if (plan.reviewItems.length > 0) {
        const existing = basketImportReviews.get(userId) ?? [];
        const created = createBasketImportReviewItems(userId, plan.source, plan.reviewItems, existing.length);
        basketImportReviews.set(userId, [...existing, ...created]);
      }
      return {
        userId,
        ...plan,
        importedItemCount: plan.acceptedItems.length,
        reviewItemCount: plan.reviewItems.length,
        basketItemCount: (baskets.get(userId) ?? []).length
      };
    },

    getBasketImportReviewQueue(userId: string): BasketImportReviewQueue {
      requireNonEmptyId(userId, 'userId');
      const items = basketImportReviews.get(userId) ?? [];
      const openItems = items.filter((item) => item.status === 'open');
      return {
        userId,
        openItemCount: openItems.length,
        items: openItems,
        guardrails: basketImportReviewGuardrails
      };
    },

    resolveBasketImportReviewItem(userId: string, reviewItemId: string, request: BasketImportReviewDecisionRequest): BasketImportReviewItem {
      requireNonEmptyId(userId, 'userId');
      requireNonEmptyId(reviewItemId, 'reviewItemId');
      const items = basketImportReviews.get(userId) ?? [];
      const index = items.findIndex((item) => item.reviewItemId === reviewItemId && item.status === 'open');
      if (index === -1) throw new Error(`Basket import review item not found: ${reviewItemId}`);
      const item = items[index]!;
      if (request.decision === 'accept_as_product') {
        if (!request.productId) throw new Error('productId is required when accepting an import review item.');
        requireKnownProduct(request.productId);
        const quantity = request.quantity ?? item.quantity;
        this.addBasketItem(userId, { productId: request.productId, quantity });
        const resolved = { ...item, quantity, status: 'accepted' as const, resolvedAt: new Date(Date.parse(item.capturedAt) + 1).toISOString(), resolvedProductId: request.productId };
        basketImportReviews.set(userId, items.map((candidate, candidateIndex) => candidateIndex === index ? resolved : candidate));
        return resolved;
      }
      if (request.decision === 'dismiss') {
        const resolved = { ...item, status: 'dismissed' as const, resolvedAt: new Date(Date.parse(item.capturedAt) + 1).toISOString() };
        basketImportReviews.set(userId, items.map((candidate, candidateIndex) => candidateIndex === index ? resolved : candidate));
        return resolved;
      }
      throw new Error('decision must be accept_as_product or dismiss.');
    },

    getLocalOfferBasketReport(userId: string, asOf = '2026-05-20T12:00:00.000Z'): LocalOfferBasketReport {
      requireNonEmptyId(userId, 'userId');
      const userItems = baskets.get(userId) ?? [];
      const favoriteStoreIds = this.getFavoriteStores(userId).map((store) => store.id);
      const storeIds = favoriteStoreIds.length > 0 ? favoriteStoreIds : stores.map((store) => store.id);
      const summary = summarizeLocalOfferBasket({
        asOf,
        storeIds,
        items: localOfferBasketItems(userItems),
        offers: localOffersForBasket(userItems, storeIds, asOf),
        staleAfterHours: 72
      });
      return {
        userId,
        storeIds,
        basketItemCount: userItems.length,
        ...summary,
        guardrails: [
          'Local offer baskets rank only selected favorite stores, falling back to all stores when none are selected.',
          'Distance is informational and never reduces savings; coverage and verified price evidence decide ranking.',
          'Stale or missing offer lines remain visible instead of being treated as available current prices.'
        ]
      };
    },

    getRecurringBasketDigest(userId: string, request: RecurringBasketDigestRequest): RecurringBasketDigest {
      return buildRecurringBasketDigest(userId, baskets.get(userId) ?? [], request);
    },

    quoteBasketAtStore(userId: string, storeId: string): StoreBasketQuote {
      requireNonEmptyId(userId, 'userId');
      return buildStoreBasketQuote(userId, storeId, baskets.get(userId) ?? []);
    },

    updateBudget(userId: string, patch: UserBudgetPatch) {
      requireNonEmptyId(userId, 'userId');
      if (!Number.isFinite(patch.weeklyBudget) || patch.weeklyBudget < 0) {
        throw new Error('weeklyBudget must be zero or positive');
      }
      if (!Number.isFinite(patch.monthlyBudget) || patch.monthlyBudget < 0) {
        throw new Error('monthlyBudget must be zero or positive');
      }
      budgets.set(userId, patch);
    },

    getBudgetSummary(userId: string): BudgetSummary {
      const budget = budgets.get(userId) ?? { weeklyBudget: 0, monthlyBudget: 0 };
      const favoriteStoreIds = this.getFavoriteStores(userId).map((store) => store.id);
      const comparisonStoreIds = favoriteStoreIds.length > 0 ? favoriteStoreIds : stores.map((store) => store.id);
      const comparison = compareBasketStrategies({
        favoriteStoreIds: comparisonStoreIds,
        items: basketInputItems(baskets.get(userId) ?? [])
      });
      return summarizeBudget({ ...budget, estimatedBasketTotal: comparison.cheapestByProduct.total, receiptTotalsThisWeek: [], receiptTotalsThisMonth: [] });
    },

    updateCategoryBudgets(userId: string, patches: CategoryBudgetPatch[]) {
      requireNonEmptyId(userId, 'userId');
      if (!Array.isArray(patches)) throw new Error('categories must be an array');
      const normalized = patches.map((patch) => {
        requireNonEmptyId(patch.category, 'category');
        requireZeroOrPositiveFinite(patch.weeklyBudget, 'weeklyBudget');
        return { category: patch.category.trim().toLowerCase(), weeklyBudget: patch.weeklyBudget };
      });
      const categories = new Set(normalized.map((patch) => patch.category));
      if (categories.size !== normalized.length) throw new Error('categories must be unique');
      categoryBudgets.set(userId, normalized.sort((left, right) => left.category.localeCompare(right.category)));
    },

    getCategoryBudgetSummary(userId: string): CategoryBudgetSummary {
      requireNonEmptyId(userId, 'userId');
      const spendByCategory = new Map<string, { estimatedSpend: number; productIds: Set<string> }>();
      for (const item of baskets.get(userId) ?? []) {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) continue;
        const current = spendByCategory.get(product.category) ?? { estimatedSpend: 0, productIds: new Set<string>() };
        current.estimatedSpend = Math.round((current.estimatedSpend + (bestPriceFor(product)?.price ?? 0) * item.quantity) * 100) / 100;
        current.productIds.add(product.id);
        spendByCategory.set(product.category, current);
      }
      const categories = (categoryBudgets.get(userId) ?? []).map((budget) => {
        const spend = spendByCategory.get(budget.category) ?? { estimatedSpend: 0, productIds: new Set<string>() };
        const remaining = Math.round((budget.weeklyBudget - spend.estimatedSpend) * 100) / 100;
        return {
          category: budget.category,
          weeklyBudget: budget.weeklyBudget,
          estimatedSpend: spend.estimatedSpend,
          remaining,
          status: remaining >= 0 ? 'under' : 'over',
          productIds: [...spend.productIds].sort()
        } satisfies CategoryBudgetLine;
      });
      const budgeted = new Set(categories.map((line) => line.category));
      return {
        userId,
        categories,
        unbudgetedCategories: [...spendByCategory.entries()]
          .filter(([category]) => !budgeted.has(category))
          .map(([category, spend]) => ({
            category,
            estimatedSpend: spend.estimatedSpend,
            productIds: [...spend.productIds].sort()
          }))
          .sort((left, right) => left.category.localeCompare(right.category))
      };
    },

    upsertHouseholdPlan(userId: string, input: HouseholdPlanRequest): HouseholdPlan {
      const plan = normalizeHouseholdPlan(userId, input);
      householdPlans.set(userId, plan);
      return plan;
    },

    getHouseholdPlan(userId: string): HouseholdPlan | null {
      requireNonEmptyId(userId, 'userId');
      return householdPlans.get(userId) ?? null;
    },

    upsertSubscriptionEntitlement(userId: string, entitlement: SubscriptionEntitlementSnapshot) {
      requireNonEmptyId(userId, 'userId');
      subscriptionEntitlements.set(userId, normalizeSubscriptionEntitlement(entitlement));
    },

    getSubscriptionEntitlement(userId: string): SubscriptionEntitlementSnapshot | null {
      requireNonEmptyId(userId, 'userId');
      return subscriptionEntitlements.get(userId) ?? null;
    },

    getSubscriptionAccess(userId: string, now = new Date().toISOString()): SubscriptionAccessPolicy {
      requireNonEmptyId(userId, 'userId');
      return buildSubscriptionAccessPolicy({
        entitlement: subscriptionEntitlements.get(userId) ?? null,
        now: requireIsoTimestamp(now, 'now')
      });
    },

    getChainPriceIndices(): ChainPriceIndexSummary {
      return calculateChainPriceIndex(chainIndexObservations());
    },

    getCategoryPriceIndices(): CategoryPriceIndexSummary {
      return buildCategoryPriceIndices();
    },

    getBrandPriceIndices(): BrandPriceIndexSummary {
      return buildBrandPriceIndices();
    },

    getIndices() {
      return [buildStockholmGroceryIndex()];
    },

    getIndex(id: string) {
      const index = buildStockholmGroceryIndex();
      return id === index.id ? index : null;
    }
  };
}
