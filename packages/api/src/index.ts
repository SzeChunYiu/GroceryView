import {
  buildPriceChartSeries,
  buildWatchlistAlerts,
  calculateDealScore,
  calculateFixedBasketIndex,
  compareBasketStrategies,
  createHouseholdState,
  scoreBand,
  searchProducts,
  summarizeBudget,
  summarizePriceHistory,
  summarizeHousehold,
  type BasketComparisonResult,
  type BudgetSummary,
  type PriceChartAdapterResult,
  type PriceChartObservation,
  type PriceHistorySummary,
  type HouseholdBasketItem,
  type HouseholdMember,
  type HouseholdSnapshot,
  type HouseholdSummary,
  type HouseholdWatchlistItem,
  type SearchableProduct,
  type StorePrice,
  type WatchlistAlert,
  type WatchlistItem
} from '@groceryview/core';
import {
  buildSubscriptionAccessPolicy,
  type SubscriptionAccessPolicy,
  type SubscriptionEntitlementSnapshot,
  type SubscriptionPlan
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

export type BasketItemRequest = {
  productId: string;
  quantity: number;
};

export type UserBudgetPatch = {
  weeklyBudget: number;
  monthlyBudget: number;
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

const stores: Store[] = [
  { id: 'willys-odenplan', name: 'Willys Odenplan', chain: 'willys', district: 'Odenplan', address: 'Odenplan, Stockholm', confidence: 'high' },
  { id: 'lidl-sveavagen', name: 'Lidl Sveavägen', chain: 'lidl', district: 'Norrmalm', address: 'Sveavägen, Stockholm', confidence: 'medium' },
  { id: 'coop-odenplan', name: 'Coop Odenplan', chain: 'coop', district: 'Odenplan', address: 'Odenplan, Stockholm', confidence: 'medium' }
];

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

const index = calculateFixedBasketIndex({
  id: 'stockholm-grocery-index',
  label: 'Stockholm Grocery Index',
  baseDate: '2026-01-01',
  currentDate: '2026-05-19',
  components: [
    { productId: 'coffee', baseUnitPrice: 100, currentUnitPrice: 91.6, weight: 1 },
    { productId: 'dairy', baseUnitPrice: 100, currentUnitPrice: 108.4, weight: 1 },
    { productId: 'protein', baseUnitPrice: 100, currentUnitPrice: 102.1, weight: 1 },
    { productId: 'budget-basket', baseUnitPrice: 100, currentUnitPrice: 96.8, weight: 1 },
    { productId: 'private-label', baseUnitPrice: 100, currentUnitPrice: 94.2, weight: 1 }
  ]
});

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

function requirePositiveFinite(value: number | undefined, label: string) {
  if (value === undefined) return;
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

export function createGroceryViewApi() {
  const favoriteStores = new Map<string, Set<string>>();
  const watchlists = new Map<string, WatchlistItem[]>();
  const baskets = new Map<string, BasketItemRequest[]>();
  const budgets = new Map<string, UserBudgetPatch>();
  const subscriptionEntitlements = new Map<string, SubscriptionEntitlementSnapshot>();
  const householdPlans = new Map<string, HouseholdPlan>();

  const productSnapshots = () =>
    products.map((product) => {
      const bestPrice = bestPriceFor(product);
      return {
        productId: product.id,
        productName: product.name,
        bestPrice: bestPrice?.price ?? 0,
        bestStoreId: bestPrice?.storeId ?? '',
        dealScore: product.dealScore,
        isNew52WeekLow: product.id === 'coffee'
      };
    });

  return {
    getMarketOverview() {
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
      return { city: 'Stockholm', indices: [index], topDeals };
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

    getProductHistory(id: string) {
      return this.getProduct(id)?.history ?? [];
    },

    getProductPriceTerminal(id: string, options: { asOf?: string } = {}): ProductPriceTerminalReport | null {
      const product = this.getProduct(id);
      if (!product) return null;
      return productPriceTerminalFor(product, options.asOf);
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

    getFavoriteStores(userId: string) {
      const ids = favoriteStores.get(userId) ?? new Set<string>();
      return stores.filter((store) => ids.has(store.id));
    },

    addWatchlistItem(userId: string, item: WatchlistItem) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(item.productId);
      requireOptionalPositiveFinite(item.targetPrice, 'targetPrice');
      requireScoreThreshold(item.alertDealScoreAt);
      watchlists.set(userId, [...(watchlists.get(userId) ?? []), item]);
    },

    updateWatchlistItem(userId: string, productId: string, patch: Partial<Omit<WatchlistItem, 'productId'>>) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(productId);
      requireOptionalPositiveFinite(patch.targetPrice, 'targetPrice');
      requireScoreThreshold(patch.alertDealScoreAt);
      const items = watchlists.get(userId) ?? [];
      const index = items.findIndex((item) => item.productId === productId);
      if (index === -1) throw new Error(`Watchlist item not found: ${productId}`);
      const next = [...items];
      next[index] = {
        ...next[index],
        ...(patch.targetPrice === undefined ? {} : { targetPrice: patch.targetPrice }),
        ...(patch.alertDealScoreAt === undefined ? {} : { alertDealScoreAt: patch.alertDealScoreAt }),
        ...(patch.favoriteStoresOnly === undefined ? {} : { favoriteStoresOnly: patch.favoriteStoresOnly }),
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

    addBasketItem(userId: string, item: BasketItemRequest) {
      requireNonEmptyId(userId, 'userId');
      requireKnownProduct(item.productId);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99) {
        throw new Error('quantity must be an integer between 1 and 99');
      }
      baskets.set(userId, [...(baskets.get(userId) ?? []), item]);
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
      const items = (baskets.get(userId) ?? []).map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return { productId: item.productId, quantity: item.quantity, prices: product?.currentPrices ?? [] };
      });
      return compareBasketStrategies({ favoriteStoreIds, items });
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
      return summarizeBudget({ ...budget, estimatedBasketTotal: this.compareBasket(userId).cheapestByProduct.total, receiptTotalsThisWeek: [], receiptTotalsThisMonth: [] });
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

    getIndices() {
      return [index];
    },

    getIndex(id: string) {
      return id === index.id ? index : null;
    }
  };
}
