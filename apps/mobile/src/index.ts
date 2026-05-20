import { createGroceryViewApi } from '@groceryview/api';

export type MobileTab = {
  id: 'today' | 'stores' | 'basket' | 'scan' | 'profile';
  label: string;
  purpose: string;
};

export type TodayModule =
  | 'weekly_budget'
  | 'favorite_store_deals'
  | 'watchlist_alerts'
  | 'weekly_basket'
  | 'recommended_actions'
  | 'recent_price_drops'
  | 'receipt_insights';

export function buildMobileShell(): { tabs: MobileTab[]; todayModules: TodayModule[] } {
  return {
    tabs: [
      { id: 'today', label: 'Today', purpose: 'Budget, deals, alerts, and recommendations' },
      { id: 'stores', label: 'Stores', purpose: 'Favorite and nearby supermarket profiles' },
      { id: 'basket', label: 'Basket', purpose: 'Weekly grocery planning and comparison' },
      { id: 'scan', label: 'Scan', purpose: 'Barcode and receipt capture' },
      { id: 'profile', label: 'Profile', purpose: 'Budget, household, privacy, and notification settings' }
    ],
    todayModules: ['weekly_budget', 'favorite_store_deals', 'watchlist_alerts', 'weekly_basket', 'recommended_actions', 'recent_price_drops', 'receipt_insights']
  };
}

export type MobileViewModel = {
  userId: string;
  today: {
    marketCity: string;
    topDeals: Array<{ ticker: string; dealScore: number; bestPrice: number | null }>;
  };
  stores: {
    favoriteStores: Array<{ id: string; name: string }>;
  };
  basket: {
    emptyStateAction: string;
  };
  scan: {
    supportedModes: Array<'barcode' | 'receipt'>;
  };
};

type MobileApi = ReturnType<typeof createGroceryViewApi>;

export function createMobileViewModel(userId: string, api: MobileApi = createGroceryViewApi()): MobileViewModel {
  const market = api.getMarketOverview();
  return {
    userId,
    today: {
      marketCity: market.city,
      topDeals: market.topDeals.map((deal) => ({ ticker: deal.ticker, dealScore: deal.dealScore, bestPrice: deal.bestPrice }))
    },
    stores: {
      favoriteStores: api.getFavoriteStores(userId).map((store) => ({ id: store.id, name: store.name }))
    },
    basket: {
      emptyStateAction: 'Add from deals or scan a barcode'
    },
    scan: {
      supportedModes: ['barcode', 'receipt']
    }
  };
}

export type MobileDiscoveryViewModel = {
  userId: string;
  query: string;
  favoriteStores: Array<{ id: string; name: string }>;
  searchResults: Array<{
    id: string;
    ticker: string;
    name: string;
    category: string;
    dealScore: number;
    bestPrice: number | null;
    primaryAction: 'open_product' | 'scan_to_match';
  }>;
  selectedProduct: {
    id: string;
    ticker: string;
    name: string;
    category: string;
    verdict: string;
    dealScore: number;
    currentPrices: Array<{ storeId: string; storeName: string; price: number }>;
    priceHistory: Array<{ date: string; price: number; lineStyle: 'solid' | 'dotted' }>;
    actions: Array<'add_to_weekly_basket' | 'add_to_watchlist' | 'compare_stores' | 'scan_receipt_to_verify'>;
  } | null;
  weeklyBasket: {
    itemCount: number;
    cheapestTotal: number;
    bestSingleStore: { storeId: string; storeName: string; total: number } | null;
    savingsVsBestSingleStore: number;
    missingProductIds: string[];
  };
  budget: {
    weeklyBudget: number;
    estimatedBasketTotal: number;
    weeklyRemainingAfterEstimate: number;
    weeklyStatus: 'under' | 'over';
  };
  watchlist: {
    itemCount: number;
    alertCount: number;
    alertTypes: string[];
  };
};

export function createMobileDiscoveryViewModel(
  input: { userId: string; query: string; selectedProductId?: string },
  api: MobileApi = createGroceryViewApi()
): MobileDiscoveryViewModel {
  const favoriteStores = api.getFavoriteStores(input.userId).map((store) => ({ id: store.id, name: store.name }));
  const basket = api.getBasket(input.userId);
  const basketComparison = api.compareBasket(input.userId);
  const budget = api.getBudgetSummary(input.userId);
  const watchlist = api.getWatchlist(input.userId);
  const bestSingleStore = basketComparison.singleStoreOptions[0] ?? null;
  const selectedProduct = input.selectedProductId ? api.getProduct(input.selectedProductId) : null;

  return {
    userId: input.userId,
    query: input.query,
    favoriteStores,
    searchResults: api.searchProducts(input.query).map((result) => {
      const product = api.getProduct(result.id);
      return {
        id: result.id,
        ticker: result.ticker,
        name: result.name,
        category: result.category,
        dealScore: product?.dealScore ?? 0,
        bestPrice: product?.currentPrices[0]?.price ?? null,
        primaryAction: product ? 'open_product' : 'scan_to_match'
      };
    }),
    selectedProduct: selectedProduct
      ? {
          id: selectedProduct.id,
          ticker: selectedProduct.ticker,
          name: selectedProduct.name,
          category: selectedProduct.category,
          verdict: selectedProduct.verdict,
          dealScore: selectedProduct.dealScore,
          currentPrices: api.getProductPrices(selectedProduct.id),
          priceHistory: api.getProductHistory(selectedProduct.id).map((point) => ({
            date: point.date,
            price: point.price,
            lineStyle: point.verified ? 'solid' : 'dotted'
          })),
          actions: ['add_to_weekly_basket', 'add_to_watchlist', 'compare_stores', 'scan_receipt_to_verify']
        }
      : null,
    weeklyBasket: {
      itemCount: basket.items.reduce((total, item) => total + item.quantity, 0),
      cheapestTotal: basketComparison.cheapestByProduct.total,
      bestSingleStore,
      savingsVsBestSingleStore: bestSingleStore ? Math.round((bestSingleStore.total - basketComparison.cheapestByProduct.total) * 100) / 100 : 0,
      missingProductIds: basketComparison.missingProductIds
    },
    budget: {
      weeklyBudget: budget.weeklyBudget,
      estimatedBasketTotal: budget.estimatedBasketTotal,
      weeklyRemainingAfterEstimate: budget.weeklyRemainingAfterEstimate,
      weeklyStatus: budget.weeklyStatus
    },
    watchlist: {
      itemCount: watchlist.items.length,
      alertCount: watchlist.alerts.length,
      alertTypes: [...new Set(watchlist.alerts.map((alert) => alert.type))].sort()
    }
  };
}

export type ScanRequest = {
  mode: 'barcode' | 'receipt';
  code: string;
  productId?: string;
};

export type ScanResult = {
  mode: 'barcode' | 'receipt';
  code: string;
  product: { id: string; ticker: string; name: string; currentBestPrice: number | null; dealScore: number } | null;
  verdict: string;
  confidenceLabel: string;
  equivalentProducts: string[];
  actions: string[];
};

export function buildScanResult(request: ScanRequest, api: MobileApi = createGroceryViewApi()): ScanResult {
  if (request.mode === 'receipt') {
    return {
      mode: request.mode,
      code: request.code,
      product: null,
      verdict: 'Review receipt matches before saving',
      confidenceLabel: 'medium-high after OCR review',
      equivalentProducts: [],
      actions: ['extract_receipt_items', 'review_budget_impact', 'confirm_matches']
    };
  }

  const product = api.getProduct(request.productId ?? '');
  return {
    mode: request.mode,
    code: request.code,
    product: product
      ? {
          id: product.id,
          ticker: product.ticker,
          name: product.name,
          currentBestPrice: product.currentPrices[0]?.price ?? null,
          dealScore: product.dealScore
        }
      : null,
    verdict: product?.verdict ?? 'Compare',
    confidenceLabel: product ? 'verified observed price' : 'unknown barcode',
    equivalentProducts: product ? ['same_category_equivalents', 'private_label_swaps'] : [],
    actions: product ? ['add_to_weekly_basket', 'add_to_watchlist', 'compare_stores'] : ['search_product', 'report_unknown_barcode']
  };
}

export type ExpoRoute = {
  path:
    | '/today'
    | '/stores'
    | '/basket'
    | '/scan/barcode'
    | '/scan/receipt'
    | '/profile'
    | '/household'
    | '/privacy'
    | '/review-queue';
  screen: string;
  purpose: string;
  requiresAuth: boolean;
};

export type MobileScreenState =
  | 'loading'
  | 'ready'
  | 'empty'
  | 'needs_permission'
  | 'needs_provider'
  | 'needs_human_review'
  | 'error';

export type MobileScreenAction =
  | 'open_product'
  | 'compare_basket'
  | 'scan_barcode'
  | 'scan_receipt'
  | 'review_assignment'
  | 'submit_review_decision'
  | 'update_privacy'
  | 'invite_household_member'
  | 'configure_notifications';

export type MobileScreenBlueprint = {
  route: ExpoRoute['path'];
  screen: ExpoRoute['screen'];
  primaryState: MobileScreenState;
  emptyState: string;
  dataDependencies: string[];
  actions: MobileScreenAction[];
  providerRequirements: Array<'camera' | 'ocr' | 'barcode-lookup' | 'push-notifications' | 'secure-session'>;
  offlineBehavior: string;
};

export type MobileScreenBlueprintPlan = {
  authRequiredByDefault: true;
  screens: MobileScreenBlueprint[];
  blockedWithoutProviders: Array<{ route: ExpoRoute['path']; providers: MobileScreenBlueprint['providerRequirements'] }>;
};

export type ExpoBuildProfile = {
  distribution: 'internal' | 'store';
  channel: string;
};

export type ExpoReadinessPlan = {
  appName: string;
  slug: string;
  scheme: string;
  routes: ExpoRoute[];
  requiredDeviceCapabilities: Array<'camera' | 'secure-storage' | 'push-notifications'>;
  buildProfiles: {
    preview: ExpoBuildProfile;
    production: ExpoBuildProfile;
  };
  failClosedWithoutProviders: boolean;
};

export function buildExpoReadinessPlan(): ExpoReadinessPlan {
  return {
    appName: 'GroceryView',
    slug: 'groceryview',
    scheme: 'groceryview',
    routes: [
      { path: '/today', screen: 'TodayScreen', purpose: 'Daily market overview, deals, budget, alerts, and recommendations', requiresAuth: true },
      { path: '/stores', screen: 'StoresScreen', purpose: 'Favorite and selected supermarket profiles', requiresAuth: true },
      { path: '/basket', screen: 'BasketScreen', purpose: 'Weekly basket planning and smart swaps', requiresAuth: true },
      { path: '/scan/barcode', screen: 'BarcodeScanScreen', purpose: 'Barcode lookup and product comparison', requiresAuth: true },
      { path: '/scan/receipt', screen: 'ReceiptScanScreen', purpose: 'Receipt OCR review and budget impact', requiresAuth: true },
      { path: '/profile', screen: 'ProfileScreen', purpose: 'Account, budget, notification, and favorite-store settings', requiresAuth: true },
      { path: '/household', screen: 'HouseholdScreen', purpose: 'Shared basket and household member controls', requiresAuth: true },
      { path: '/privacy', screen: 'PrivacyScreen', purpose: 'Data export, deletion, and ad privacy controls', requiresAuth: true },
      { path: '/review-queue', screen: 'HumanReviewQueueScreen', purpose: 'Human review assignments, SLA status, and decision writebacks', requiresAuth: true }
    ],
    requiredDeviceCapabilities: ['camera', 'secure-storage', 'push-notifications'],
    buildProfiles: {
      preview: { distribution: 'internal', channel: 'preview' },
      production: { distribution: 'store', channel: 'production' }
    },
    failClosedWithoutProviders: true
  };
}

export function buildMobileScreenBlueprints(): MobileScreenBlueprintPlan {
  const screens: MobileScreenBlueprint[] = [
    {
      route: '/today',
      screen: 'TodayScreen',
      primaryState: 'ready',
      emptyState: 'Add favorite stores or scan a product to personalize Today.',
      dataDependencies: ['market_overview', 'favorite_stores', 'watchlist_alerts', 'weekly_budget'],
      actions: ['open_product', 'compare_basket', 'scan_barcode'],
      providerRequirements: ['secure-session'],
      offlineBehavior: 'Show cached market snapshot with stale-data label.'
    },
    {
      route: '/basket',
      screen: 'BasketScreen',
      primaryState: 'ready',
      emptyState: 'Start a basket from a deal, search result, or barcode scan.',
      dataDependencies: ['weekly_basket', 'favorite_store_prices', 'smart_swaps', 'budget_summary'],
      actions: ['compare_basket', 'open_product', 'scan_barcode'],
      providerRequirements: ['secure-session'],
      offlineBehavior: 'Allow local quantity edits and require sync before checkout decisions.'
    },
    {
      route: '/scan/barcode',
      screen: 'BarcodeScanScreen',
      primaryState: 'needs_permission',
      emptyState: 'Grant camera access to scan grocery barcodes.',
      dataDependencies: ['barcode_lookup_provider', 'product_detail', 'equivalent_products'],
      actions: ['scan_barcode', 'open_product', 'review_assignment'],
      providerRequirements: ['camera', 'barcode-lookup', 'secure-session'],
      offlineBehavior: 'Queue unknown barcode reports until the lookup provider is reachable.'
    },
    {
      route: '/scan/receipt',
      screen: 'ReceiptScanScreen',
      primaryState: 'needs_provider',
      emptyState: 'Connect OCR before receipt lines can update budgets.',
      dataDependencies: ['ocr_provider', 'receipt_review', 'budget_summary'],
      actions: ['scan_receipt', 'review_assignment'],
      providerRequirements: ['camera', 'ocr', 'secure-session'],
      offlineBehavior: 'Keep receipt image local and block budget writeback until OCR completes.'
    },
    {
      route: '/review-queue',
      screen: 'HumanReviewQueueScreen',
      primaryState: 'needs_human_review',
      emptyState: 'No low-confidence product matches or community reports need review.',
      dataDependencies: ['human_review_assignments', 'human_review_sla', 'reviewer_permissions'],
      actions: ['review_assignment', 'submit_review_decision'],
      providerRequirements: ['secure-session'],
      offlineBehavior: 'Read-only cached queue; decision submission requires a fresh session.'
    },
    {
      route: '/profile',
      screen: 'ProfileScreen',
      primaryState: 'ready',
      emptyState: 'Finish account setup to enable alerts, privacy controls, and household sharing.',
      dataDependencies: ['notification_preferences', 'privacy_controls', 'household_members'],
      actions: ['configure_notifications', 'update_privacy', 'invite_household_member'],
      providerRequirements: ['push-notifications', 'secure-session'],
      offlineBehavior: 'Show cached settings and require network before saving changes.'
    }
  ];

  return {
    authRequiredByDefault: true,
    screens,
    blockedWithoutProviders: screens
      .filter((screen) => screen.providerRequirements.some((provider) => provider !== 'secure-session'))
      .map((screen) => ({ route: screen.route, providers: screen.providerRequirements }))
  };
}
