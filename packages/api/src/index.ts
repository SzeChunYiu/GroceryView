import {
  buildWatchlistAlerts,
  calculateDealScore,
  calculateFixedBasketIndex,
  compareBasketStrategies,
  createHouseholdState,
  scoreBand,
  searchProducts,
  summarizeBudget,
  summarizeHousehold,
  type BasketComparisonResult,
  type BudgetSummary,
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
