import { createGroceryViewApi, type ProductDetail, type ProductPriceTerminalReport } from '@groceryview/api';
export {
  applyMobileMutationSyncResult,
  planMobileOfflineMutation,
  selectMobileMutationsForSync,
  summarizeMobileOfflineMutations
} from './offlineMutations.js';
export type {
  MobileMutationSyncResult,
  MobileOfflineMutation,
  MobileOfflineMutationInput,
  MobileOfflineMutationPayload,
  MobileOfflineMutationStatus,
  MobileOfflineMutationSummary,
  MobileOfflineMutationType
} from './offlineMutations.js';
export { buildMobileDeepLink, buildMobileRouteManifest, findMobileRoute } from './routeManifest.js';
export type { MobileMvpRoute, MobileMvpRouteId, MobileMvpRoutePath, MobileRouteManifest, MobileRouteParam } from './routeManifest.js';
export { buildMobilePermissionPlan, nextMobilePermissionPrompt, summarizeMobilePermissionPlan } from './permissions.js';
export type { MobilePermissionKind, MobilePermissionPlan, MobilePermissionPrompt, MobilePermissionSnapshot, MobilePermissionState, MobilePermissionSurface } from './permissions.js';
export { buildMobilePersistedCachePlan, buildMobileQueryKey, buildMobileQueryRegistry } from './queryCache.js';
export type { MobilePersistedCachePlan, MobileQueryDefinition, MobileQueryId, MobileQueryKeyInput, MobileScreenRoute } from './queryCache.js';

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

export type MobilePriceTerminalSummary = {
  quote: {
    bestPrice: number | null;
    bestStoreName: string | null;
    unitPrice: string;
    dealScore: number;
    range52Week: { low: number; high: number } | null;
    evidenceVolume: { currentPrices: number; historyPoints: number; verifiedHistoryPoints: number };
  };
  distributionSummaries: Array<{
    scope: string;
    label: string;
    median: number;
    currentPercentile: number;
    sampleSize: number;
    customerRead: string;
  }>;
  chartSummary: {
    seriesCount: number;
    markerCount: number;
    historyPointCount: number;
    windowStart?: string;
    windowEnd?: string;
    isNewLow: boolean;
  };
  guardrails: string[];
};

export type MobileProductTerminalLoadInput = {
  apiBase: string;
  productId: string;
  asOf?: string;
  bearerToken?: string;
  fetcher?: typeof fetch;
};

function mobilePriceTerminalSummaryFromReport(terminal: ProductPriceTerminalReport): MobilePriceTerminalSummary {
  return {
    quote: {
      bestPrice: terminal.quote.bestPrice,
      bestStoreName: terminal.quote.bestStoreName,
      unitPrice: terminal.quote.unitPrice,
      dealScore: terminal.quote.dealScore,
      range52Week: terminal.quote.range52Week,
      evidenceVolume: terminal.quote.evidenceVolume
    },
    distributionSummaries: terminal.distributions.map((distribution) => ({
      scope: distribution.scope,
      label: distribution.label,
      median: distribution.median,
      currentPercentile: distribution.currentPercentile,
      sampleSize: distribution.sampleSize,
      customerRead: distribution.customerRead
    })),
    chartSummary: {
      seriesCount: terminal.chart.series.length,
      markerCount: terminal.chart.series.reduce((total, series) => total + series.markers.length, 0),
      historyPointCount: terminal.quote.evidenceVolume.historyPoints,
      ...(terminal.chart.windowStart ? { windowStart: terminal.chart.windowStart } : {}),
      ...(terminal.chart.windowEnd ? { windowEnd: terminal.chart.windowEnd } : {}),
      isNewLow: Boolean(terminal.historySummary?.isNewLow)
    },
    guardrails: [...terminal.evidenceGuardrails]
  };
}

function buildMobilePriceTerminalSummary(product: ProductDetail, terminal: ProductPriceTerminalReport | null): MobilePriceTerminalSummary {
  if (!terminal) {
    return {
      quote: {
        bestPrice: product.currentPrices[0]?.price ?? null,
        bestStoreName: product.currentPrices[0]?.storeName ?? null,
        unitPrice: 'unknown',
        dealScore: product.dealScore,
        range52Week: null,
        evidenceVolume: { currentPrices: product.currentPrices.length, historyPoints: product.history.length, verifiedHistoryPoints: product.history.filter((point) => point.verified).length }
      },
      distributionSummaries: [],
      chartSummary: {
        seriesCount: 0,
        markerCount: 0,
        historyPointCount: product.history.length,
        isNewLow: false
      },
      guardrails: ['Product terminal report unavailable; use current prices as a fallback only.']
    };
  }

  return mobilePriceTerminalSummaryFromReport(terminal);
}

export async function loadMobileProductTerminal(input: MobileProductTerminalLoadInput): Promise<MobilePriceTerminalSummary> {
  const apiBase = input.apiBase.trim();
  const productId = input.productId.trim();
  if (!apiBase) throw new Error('apiBase is required.');
  if (!productId) throw new Error('productId is required.');
  const fetcher = input.fetcher ?? globalThis.fetch;
  if (!fetcher) throw new Error('fetch is required to load the product terminal.');

  const url = new URL(`/api/products/${encodeURIComponent(productId)}/terminal`, apiBase);
  if (input.asOf) url.searchParams.set('asOf', input.asOf);
  const response = await fetcher(url.toString(), {
    method: 'GET',
    headers: input.bearerToken ? { authorization: `Bearer ${input.bearerToken}` } : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && typeof payload.error === 'string' ? payload.error : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return mobilePriceTerminalSummaryFromReport(payload as ProductPriceTerminalReport);
}

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
    priceTerminal: MobilePriceTerminalSummary;
    actions: Array<'open_price_terminal' | 'add_to_weekly_basket' | 'add_to_watchlist' | 'compare_stores' | 'scan_receipt_to_verify'>;
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
          priceTerminal: buildMobilePriceTerminalSummary(selectedProduct, api.getProductPriceTerminal(selectedProduct.id)),
          actions: ['open_price_terminal', 'add_to_weekly_basket', 'add_to_watchlist', 'compare_stores', 'scan_receipt_to_verify']
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

export type MobileProductPriceTerminalViewModel = {
  productId: string;
  ticker: string;
  title: string;
  asOf: string;
  quote: {
    bestPriceLabel: string;
    bestStoreName: string | null;
    unitPrice: string;
    dealVerdict: string;
    dealScore: number;
    oneMonthMoveLabel: string;
    range52WeekLabel: string;
  };
  evidence: {
    currentPrices: number;
    historyPoints: number;
    verifiedHistoryPoints: number;
    latestObservedAt: string | null;
    isNewLow: boolean;
    guardrails: string[];
  };
  distributions: Array<{
    scope: ProductPriceTerminalReport['distributions'][number]['scope'];
    label: string;
    sampleSize: number;
    currentPercentile: number;
    cheaperThanPercent: number;
    medianPrice: number;
    customerRead: string;
  }>;
  chartSeries: Array<{
    id: string;
    storeName: string;
    lineStyle: ProductPriceTerminalReport['chart']['series'][number]['lineStyle'];
    pointCount: number;
    latestPrice: number | null;
    markerCount: number;
  }>;
  actions: Array<'add_to_watchlist' | 'add_to_weekly_basket' | 'compare_stores' | 'scan_receipt_to_verify'>;
};

function formatPriceLabel(price: number | null): string {
  return price === null ? 'No verified price' : `${price.toFixed(2)} SEK`;
}

function formatSignedPercent(value: number | null): string {
  if (value === null) return 'No movement yet';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

function formatRangeLabel(range: ProductPriceTerminalReport['quote']['range52Week']): string {
  return range ? `${range.low.toFixed(2)}-${range.high.toFixed(2)} SEK` : 'No range yet';
}

export function createMobileProductPriceTerminalViewModel(
  productId: string,
  api: MobileApi = createGroceryViewApi()
): MobileProductPriceTerminalViewModel | null {
  const terminal = api.getProductPriceTerminal(productId);
  if (!terminal) return null;

  return {
    productId: terminal.productId,
    ticker: terminal.ticker,
    title: terminal.productName,
    asOf: terminal.asOf,
    quote: {
      bestPriceLabel: formatPriceLabel(terminal.quote.bestPrice),
      bestStoreName: terminal.quote.bestStoreName,
      unitPrice: terminal.quote.unitPrice,
      dealVerdict: terminal.quote.band.verdict,
      dealScore: terminal.quote.dealScore,
      oneMonthMoveLabel: formatSignedPercent(terminal.quote.oneMonthMovePercent),
      range52WeekLabel: formatRangeLabel(terminal.quote.range52Week)
    },
    evidence: {
      currentPrices: terminal.quote.evidenceVolume.currentPrices,
      historyPoints: terminal.quote.evidenceVolume.historyPoints,
      verifiedHistoryPoints: terminal.quote.evidenceVolume.verifiedHistoryPoints,
      latestObservedAt: terminal.historySummary?.latestObservedAt ?? null,
      isNewLow: terminal.historySummary?.isNewLow ?? false,
      guardrails: terminal.evidenceGuardrails
    },
    distributions: terminal.distributions.map((distribution) => ({
      scope: distribution.scope,
      label: distribution.label,
      sampleSize: distribution.sampleSize,
      currentPercentile: distribution.currentPercentile,
      cheaperThanPercent: distribution.cheaperThanPercent,
      medianPrice: distribution.median,
      customerRead: distribution.customerRead
    })),
    chartSeries: terminal.chart.series.map((series) => ({
      id: series.id,
      storeName: series.storeName,
      lineStyle: series.lineStyle,
      pointCount: series.points.length,
      latestPrice: series.points.at(-1)?.value ?? null,
      markerCount: series.markers.length
    })),
    actions: ['add_to_watchlist', 'add_to_weekly_basket', 'compare_stores', 'scan_receipt_to_verify']
  };
}

export type MobileScreenComponent =
  | {
      type: 'screen';
      key: string;
      title: string;
      state: 'ready' | 'empty';
      children: MobileScreenComponent[];
    }
  | {
      type: 'section';
      key: string;
      title: string;
      children: MobileScreenComponent[];
    }
  | {
      type: 'metric';
      key: string;
      label: string;
      value: string;
      tone: 'neutral' | 'positive' | 'warning';
    }
  | {
      type: 'row';
      key: string;
      label: string;
      value: string;
    }
  | {
      type: 'action';
      key: string;
      action: MobileProductPriceTerminalViewModel['actions'][number];
      label: string;
      primary: boolean;
    }
  | {
      type: 'empty';
      key: string;
      message: string;
      action: 'search_product' | 'scan_barcode';
    };

function actionLabel(action: MobileProductPriceTerminalViewModel['actions'][number]): string {
  if (action === 'add_to_watchlist') return 'Watch price';
  if (action === 'add_to_weekly_basket') return 'Add to basket';
  if (action === 'compare_stores') return 'Compare stores';
  return 'Verify with receipt';
}

export function composeMobileProductTerminalScreen(
  productId: string,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const terminal = createMobileProductPriceTerminalViewModel(productId, api);
  if (!terminal) {
    return {
      type: 'screen',
      key: `product-terminal:${productId}`,
      title: 'Product terminal',
      state: 'empty',
      children: [
        {
          type: 'empty',
          key: 'missing-product',
          message: 'Product terminal data is unavailable for this product.',
          action: 'search_product'
        }
      ]
    };
  }

  return {
    type: 'screen',
    key: `product-terminal:${terminal.productId}`,
    title: terminal.title,
    state: 'ready',
    children: [
      {
        type: 'section',
        key: 'quote',
        title: 'Quote',
        children: [
          { type: 'metric', key: 'best-price', label: 'Best price', value: terminal.quote.bestPriceLabel, tone: 'positive' },
          { type: 'metric', key: 'deal-score', label: 'Deal Score', value: `${terminal.quote.dealScore} / ${terminal.quote.dealVerdict}`, tone: 'positive' },
          { type: 'metric', key: 'one-month-move', label: '1M move', value: terminal.quote.oneMonthMoveLabel, tone: terminal.quote.oneMonthMoveLabel.startsWith('+') ? 'warning' : 'positive' },
          { type: 'metric', key: 'range-52w', label: '52W range', value: terminal.quote.range52WeekLabel, tone: 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'evidence',
        title: 'Evidence',
        children: [
          { type: 'row', key: 'best-store', label: 'Best store', value: terminal.quote.bestStoreName ?? 'Unknown store' },
          { type: 'row', key: 'verified-history', label: 'Verified history', value: `${terminal.evidence.verifiedHistoryPoints} of ${terminal.evidence.historyPoints}` },
          { type: 'row', key: 'latest-observed', label: 'Latest observed', value: terminal.evidence.latestObservedAt ?? 'Not observed' },
          { type: 'row', key: 'guardrails', label: 'Guardrails', value: `${terminal.evidence.guardrails.length} active` }
        ]
      },
      {
        type: 'section',
        key: 'distribution',
        title: 'Distribution',
        children: terminal.distributions.map((distribution) => ({
          type: 'row',
          key: `distribution:${distribution.scope}`,
          label: distribution.label,
          value: `${distribution.medianPrice.toFixed(2)} SEK median, cheaper than ${distribution.cheaperThanPercent}%`
        }))
      },
      {
        type: 'section',
        key: 'chart',
        title: 'Chart',
        children: terminal.chartSeries.map((series) => ({
          type: 'row',
          key: `chart:${series.id}`,
          label: series.storeName,
          value: `${series.pointCount} points, latest ${series.latestPrice?.toFixed(2) ?? 'n/a'} SEK, ${series.markerCount} markers`
        }))
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: terminal.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: actionLabel(action),
          primary: index === 0
        }))
      }
    ]
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
    | '/products/[id]/terminal'
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
  | 'open_price_terminal'
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

export type MobileProviderStatus = 'available' | 'missing' | 'denied' | 'not_configured';

export type MobileProviderReadinessInput = {
  providers: Partial<Record<MobileScreenBlueprint['providerRequirements'][number], MobileProviderStatus>>;
};

export type MobileProviderReadinessReport = {
  status: 'ready' | 'blocked';
  screenStates: Array<{
    route: ExpoRoute['path'];
    screen: ExpoRoute['screen'];
    state: MobileScreenState;
    missingProviders: MobileScreenBlueprint['providerRequirements'];
    actions: MobileScreenAction[];
  }>;
  blockers: string[];
  summary: string;
};

function blockedMobileState(missingProviders: MobileScreenBlueprint['providerRequirements']): MobileScreenState {
  return missingProviders.includes('camera') ? 'needs_permission' : 'needs_provider';
}

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
      { path: '/products/[id]/terminal', screen: 'ProductPriceTerminalScreen', purpose: 'Stock-style product quote, distribution, and history terminal', requiresAuth: true },
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
      route: '/products/[id]/terminal',
      screen: 'ProductPriceTerminalScreen',
      primaryState: 'ready',
      emptyState: 'Open a product from search, scan, basket, or alerts to view its price terminal.',
      dataDependencies: ['product_terminal_report', 'price_chart_series', 'stockholm_distribution', 'local_distribution'],
      actions: ['open_price_terminal', 'open_product', 'compare_basket'],
      providerRequirements: ['secure-session'],
      offlineBehavior: 'Show cached terminal report with stale-data label and block new price claims until refreshed.'
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

export type MobilePrivacyRequestType = 'export_data' | 'delete_account' | 'ad_privacy' | 'receipt_retention';

export type MobilePrivacyRequestInput = {
  userId: string;
  requestType: MobilePrivacyRequestType;
  authenticated: boolean;
  networkOnline: boolean;
  confirmedDestructiveAction?: boolean;
  receiptImageRetentionDays?: number;
};

export type MobilePrivacyRequestPlan = {
  userId: string;
  route: '/privacy';
  requestType: MobilePrivacyRequestType;
  confirmationRequired: boolean;
  exportSections: Array<'profile' | 'favorite_stores' | 'watchlist' | 'receipts' | 'households'>;
  blockers: string[];
  actions: Array<'reauthenticate' | 'retry_online' | 'download_export' | 'confirm_account_deletion' | 'open_ad_privacy_controls' | 'schedule_receipt_image_cleanup'>;
};

export function buildMobilePrivacyRequestPlan(input: MobilePrivacyRequestInput): MobilePrivacyRequestPlan {
  if (!input.userId) throw new Error('userId is required.');
  if (input.receiptImageRetentionDays !== undefined && input.receiptImageRetentionDays < 0) {
    throw new Error('receiptImageRetentionDays must be zero or greater.');
  }

  const blockers: string[] = [];
  const actions: MobilePrivacyRequestPlan['actions'] = [];

  if (!input.authenticated) {
    blockers.push('mobile_reauthentication_required');
    actions.push('reauthenticate');
  }

  if (!input.networkOnline) {
    blockers.push('network_required_for_privacy_request');
    actions.push('retry_online');
  }

  const confirmationRequired = input.requestType === 'delete_account';
  if (confirmationRequired && !input.confirmedDestructiveAction) {
    blockers.push('account_deletion_confirmation_required');
    actions.push('confirm_account_deletion');
  }

  const exportSections: MobilePrivacyRequestPlan['exportSections'] =
    input.requestType === 'export_data' ? ['profile', 'favorite_stores', 'watchlist', 'receipts', 'households'] : [];

  if (blockers.length === 0) {
    if (input.requestType === 'export_data') actions.push('download_export');
    if (input.requestType === 'ad_privacy') actions.push('open_ad_privacy_controls');
    if (input.requestType === 'receipt_retention') actions.push('schedule_receipt_image_cleanup');
  }

  return {
    userId: input.userId,
    route: '/privacy',
    requestType: input.requestType,
    confirmationRequired,
    exportSections,
    blockers,
    actions
  };
}


export type MobileOfflineSyncMutation = {
  id: string;
  kind: 'add_to_basket' | 'remove_from_basket' | 'add_to_watchlist' | 'update_budget' | 'save_receipt_match';
  createdAt: string;
};

export type MobileOfflineSyncInput = {
  userId: string;
  offlineEnabled: boolean;
  secureStorageConfigured: boolean;
  pendingMutations: MobileOfflineSyncMutation[];
};

export type MobileOfflineSyncPlan = {
  userId: string;
  cachedScreens: Array<'today' | 'stores' | 'basket' | 'scan' | 'profile'>;
  mutationQueue: Array<MobileOfflineSyncMutation & { syncPriority: 'high' | 'normal' }>;
  blockers: string[];
  actions: Array<'cache_mobile_home' | 'queue_mutations' | 'sync_when_online' | 'prompt_enable_offline' | 'configure_secure_storage'>;
};

export function buildMobileOfflineSyncPlan(input: MobileOfflineSyncInput): MobileOfflineSyncPlan {
  if (!input.userId) throw new Error('userId is required.');

  const blockers: string[] = [];
  const actions: MobileOfflineSyncPlan['actions'] = [];
  const cachedScreens: MobileOfflineSyncPlan['cachedScreens'] = [];

  if (!input.offlineEnabled) {
    blockers.push('mobile_offline_mode_disabled');
    actions.push('prompt_enable_offline');
  }

  if (!input.secureStorageConfigured) {
    blockers.push('secure_storage_not_configured');
    actions.push('configure_secure_storage');
  }

  if (blockers.length === 0) {
    cachedScreens.push('today', 'stores', 'basket', 'scan', 'profile');
    actions.push('cache_mobile_home');
  }

  const mutationQueue: MobileOfflineSyncPlan['mutationQueue'] = input.pendingMutations.map((mutation) => ({
    ...mutation,
    syncPriority: mutation.kind === 'save_receipt_match' || mutation.kind === 'update_budget' ? 'high' : 'normal'
  }));

  if (mutationQueue.length > 0) {
    actions.push('queue_mutations', 'sync_when_online');
  }

  return {
    userId: input.userId,
    cachedScreens,
    mutationQueue,
    blockers,
    actions
  };
}
export function buildMobileProviderReadinessReport(input: MobileProviderReadinessInput): MobileProviderReadinessReport {
  const plan = buildMobileScreenBlueprints();
  const screenStates = plan.screens.map((screen) => {
    const missingProviders = screen.providerRequirements.filter((provider) => input.providers[provider] !== 'available');
    return {
      route: screen.route,
      screen: screen.screen,
      state: missingProviders.length === 0 ? 'ready' as const : blockedMobileState(missingProviders),
      missingProviders,
      actions: missingProviders.length === 0 ? screen.actions : screen.actions.filter((action) => action === 'open_product')
    };
  });
  const blockers = screenStates.flatMap((state) => state.missingProviders.map((provider) => `mobile_provider_missing:${state.route}:${provider}`));

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    screenStates,
    blockers,
    summary: blockers.length === 0 ? 'Mobile providers are ready.' : 'Mobile screens are blocked until required providers are available.'
  };
}
