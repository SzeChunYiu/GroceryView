import { createGroceryViewApi, type ProductDetail, type ProductPriceTerminalReport } from '@groceryview/api';
import { buildMobileReceiptReviewPlan, selectMobileReceiptReviewRows } from './receipts.js';
import type { MobileReceiptReview, MobileReceiptReviewInput } from './receipts.js';
export { buildMobileReceiptReviewPlan, selectMobileReceiptReviewRows };
export { buildMobileAppSessionPlan } from './appSession.js';
export type { MobileAppSessionInput, MobileAppSessionPlan, MobileConnectivityState } from './appSession.js';
export { buildMobileBudgetReviewPlan, selectMobileBudgetMilestones } from './budget.js';
export type { MobileBudgetReviewInput, MobileBudgetReviewPlan, MobileBudgetSummary } from './budget.js';
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
export { buildMobileNotificationPreferencePlan, summarizeMobileNotificationTopics } from './notifications.js';
export type { MobileNotificationPreferenceInput, MobileNotificationPreferencePlan, MobileNotificationQuietHours, MobileNotificationTopic } from './notifications.js';
export type { MobileReceiptReview, MobileReceiptReviewInput, MobileReceiptReviewItem, MobileReceiptReviewPlan } from './receipts.js';
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

export type ShelfOccupancyDropContext = {
  status: 'temporary_clearance' | 'stable_campaign' | 'observed_drop' | 'no_recent_drop';
  label: string;
  detail: string;
  purchaseTiming: string;
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

function sortedPricePoints(points: Array<{ time: string; value: number }>) {
  return [...points]
    .filter((point) => Number.isFinite(point.value))
    .sort((left, right) => Date.parse(left.time) - Date.parse(right.time));
}

function hasCampaignMarker(
  series: {
    markers: Array<{ time: string; type?: string }>;
  },
  latestTime: string
) {
  return series.markers.some((marker) =>
    marker.time === latestTime && (marker.type === 'promotion' || marker.type === 'member')
  );
}

function daysBetween(left: string, right: string) {
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);
  if (Number.isNaN(leftMs) || Number.isNaN(rightMs)) return Number.POSITIVE_INFINITY;
  return Math.abs(rightMs - leftMs) / (24 * 60 * 60 * 1000);
}

function nearPrice(left: number, right: number) {
  if (right === 0) return left === 0;
  return Math.abs(left - right) / right <= 0.03;
}

type MobilePriceTerminalChartSeriesInput = Array<{
  sourceType: string;
  points: Array<{
    time: string;
    value: number;
  }>;
  markers: Array<{
    time: string;
    type?: string;
  }>;
}>;

function shelfOccupancyContextForDrop(series: MobilePriceTerminalChartSeriesInput): ShelfOccupancyDropContext {
  const candidates = series
    .flatMap((entry) => {
      const points = sortedPricePoints(entry.points);
      return points
        .slice(1)
        .map((point, index) => {
          const previous = points[index]!;
          if (point.value >= previous.value) return null;
          return { entry, latest: point, previous, points };
        });
    })
    .filter((candidate): candidate is { entry: (typeof series)[number]; latest: { time: string; value: number }; previous: { time: string; value: number }; points: Array<{ time: string; value: number }> } => candidate !== null)
    .sort((left, right) => Date.parse(right.latest.time) - Date.parse(left.latest.time));

  const latestDrop = candidates[0];
  if (!latestDrop) {
    return {
      status: 'no_recent_drop',
      label: 'No fresh drop',
      detail: 'The latest visible observation did not move below the prior price.',
      purchaseTiming: 'Wait for a confirmed drop before treating this as a buy signal.'
    };
  }

  const dropPercent = ((latestDrop.previous.value - latestDrop.latest.value) / latestDrop.previous.value) * 100;
  const repeatedLow = latestDrop.points.some(
    (point) =>
      point.time !== latestDrop.latest.time &&
      daysBetween(point.time, latestDrop.latest.time) <= 14 &&
      nearPrice(point.value, latestDrop.latest.value)
  );
  const campaignSource =
    latestDrop.entry.sourceType === 'flyer' ||
    latestDrop.entry.sourceType === 'member' ||
    hasCampaignMarker(latestDrop.entry, latestDrop.latest.time);
  const shelfOnlySource =
    latestDrop.entry.sourceType === 'shelf' ||
    latestDrop.entry.sourceType === 'shelf_photo' ||
    latestDrop.entry.sourceType === 'receipt';

  if (campaignSource || repeatedLow) {
    return {
      status: 'stable_campaign',
      label: 'Stable campaign price',
      detail: repeatedLow
        ? 'The latest lower price repeats within the visible window, which is more consistent with a campaign than a one-off shelf clearance.'
        : 'The latest lower price is backed by campaign or member-price evidence.',
      purchaseTiming: 'Reasonable to compare baskets and buy during the campaign window.'
    };
  }

  if (shelfOnlySource || dropPercent >= 15) {
    return {
      status: 'temporary_clearance',
      label: 'Temporary store clearance',
      detail: `The latest drop is a one-observation ${dropPercent.toFixed(0)}% move without repeated campaign evidence.`,
      purchaseTiming: 'Buy only if the local shelf still shows the price; do not assume it will hold.'
    };
  }

  return {
    status: 'observed_drop',
    label: 'Observed drop',
    detail: `The latest visible price is ${dropPercent.toFixed(0)}% below the prior observation, but campaign stability is not yet proven.`,
    purchaseTiming: 'Check the store or wait for another observation before stocking up.'
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

export type MobileStoresViewModel = {
  userId: string;
  selectedStoreId: string | null;
  favoriteStoreCount: number;
  basketItemCount: number;
  stores: Array<{
    id: string;
    name: string;
    chain: string;
    district: string;
    address: string;
    confidence: 'high' | 'medium' | 'low';
    isFavorite: boolean;
    dealCount: number;
    topDeal: {
      productId: string;
      ticker: string;
      productName: string;
      price: number;
      dealScore: number;
      verdict: string;
      stockStatusLabel: string;
    } | null;
    basketQuote: {
      subtotal: number;
      coveragePercent: number;
      savingsVsBaseline: number;
      freshnessLabel: 'fresh' | 'mixed' | 'stale';
      confidenceLabel: 'high' | 'medium' | 'low';
      matchedProductCount: number;
      missingProductCount: number;
      unavailableProductCount: number;
      staleProductCount: number;
      stockStatusLabel: string;
    } | null;
  }>;
  selectedStore: {
    id: string;
    name: string;
    district: string;
    deals: Array<{
      productId: string;
      ticker: string;
      productName: string;
      price: number;
      dealScore: number;
      verdict: string;
      stockStatusLabel: string;
    }>;
  } | null;
  actions: Array<'open_store' | 'compare_basket' | 'scan_barcode'>;
};

export type MobileWatchlistViewModel = {
  userId: string;
  itemCount: number;
  alertCount: number;
  urgentAlertCount: number;
  trackedProducts: Array<{
    productId: string;
    ticker: string;
    productName: string;
    targetPriceLabel: string;
    alertDealScoreAt: number | null;
    favoriteStoresOnly: boolean;
    allowedPriceTypes: string[];
    bestPriceLabel: string;
    bestStoreName: string | null;
    dealScore: number;
    alertTypes: string[];
  }>;
  alerts: Array<{
    productId: string;
    productName: string;
    type: 'target_price' | 'deal_score' | 'new_52_week_low';
    severity: 'info' | 'opportunity' | 'urgent';
    message: string;
    triggerLabel: string;
  }>;
  actions: Array<'open_product' | 'compare_stores' | 'add_to_weekly_basket' | 'scan_barcode'>;
};

export type MobileBasketViewModel = {
  userId: string;
  itemCount: number;
  cheapestTotalLabel: string;
  bestSingleStore: {
    storeId: string;
    storeName: string;
    totalLabel: string;
    itemCount: number;
  } | null;
  savingsVsBestSingleStoreLabel: string;
  splitStoreCount: number;
  missingProductIds: string[];
  budget: {
    weeklyBudgetLabel: string;
    remainingLabel: string;
    status: 'under' | 'over';
  };
  assignments: Array<{
    productId: string;
    ticker: string;
    productName: string;
    storeId: string;
    storeName: string;
    quantity: number;
    unitPriceLabel: string;
    lineTotalLabel: string;
  }>;
  singleStoreOptions: Array<{
    storeId: string;
    storeName: string;
    totalLabel: string;
    itemCount: number;
  }>;
  actions: Array<'compare_basket' | 'open_product' | 'scan_barcode'>;
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

export type MobileStoresInput = string | { userId: string; selectedStoreId?: string };

function normalizeMobileStoresInput(input: MobileStoresInput): { userId: string; selectedStoreId?: string } {
  return typeof input === 'string' ? { userId: input } : input;
}

function formatMobileStockStatusLabel(input: {
  available: boolean;
  stale?: boolean;
  confidenceLabel: 'high' | 'medium' | 'low';
}): string {
  const status = input.available ? 'in stock' : 'stock unavailable';
  const freshness = input.stale ? ', stale evidence' : '';
  return `${status}, ${input.confidenceLabel} confidence${freshness}`;
}

function mobileStockConfidenceLabel(confidence: number): 'high' | 'medium' | 'low' {
  return confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';
}

function formatMobileDealStockLabel(input: {
  storeConfidence: 'high' | 'medium' | 'low';
  productId: string;
  basketQuote: ReturnType<MobileApi['getLocalOfferBasketReport']>['stores'][number] | null;
}): string {
  const line = input.basketQuote?.lines.find((candidate) => candidate.productId === input.productId);
  if (line) {
    return formatMobileStockStatusLabel({
      available: true,
      stale: line.stale,
      confidenceLabel: mobileStockConfidenceLabel(line.confidence)
    });
  }
  if (input.basketQuote?.unavailableProductIds.includes(input.productId)) {
    return formatMobileStockStatusLabel({ available: false, confidenceLabel: input.basketQuote.confidenceLabel });
  }
  return formatMobileStockStatusLabel({ available: true, confidenceLabel: input.storeConfidence });
}

function formatMobileBranchStockLabel(input: {
  matchedProductCount: number;
  totalProductCount: number;
  missingProductCount: number;
  unavailableProductCount: number;
  staleProductCount: number;
  confidenceLabel: 'high' | 'medium' | 'low';
}): string {
  if (input.totalProductCount === 0) return `stock unknown, ${input.confidenceLabel} confidence`;
  const status = input.unavailableProductCount > 0
    ? `${input.unavailableProductCount} unavailable`
    : input.missingProductCount > 0
      ? 'partial stock'
      : 'in stock';
  const stale = input.staleProductCount > 0 ? `, ${input.staleProductCount} stale` : '';
  return `${status} (${input.matchedProductCount}/${input.totalProductCount}), ${input.confidenceLabel} confidence${stale}`;
}

export function createMobileStoresViewModel(input: MobileStoresInput, api: MobileApi = createGroceryViewApi()): MobileStoresViewModel {
  const { userId, selectedStoreId } = normalizeMobileStoresInput(input);
  const favoriteStoreIds = new Set(api.getFavoriteStores(userId).map((store) => store.id));
  const offerBasket = api.getLocalOfferBasketReport(userId);
  const stores = api.getStores().map((store) => {
    const deals = api.getStoreDeals(store.id);
    const topDeal = deals[0] ?? null;
    const basketQuote = offerBasket.stores.find((candidate) => candidate.storeId === store.id) ?? null;
    const quoteProductCount = basketQuote
      ? basketQuote.matchedProductIds.length + basketQuote.missingProductIds.length + basketQuote.unavailableProductIds.length
      : 0;
    return {
      id: store.id,
      name: store.name,
      chain: store.chain,
      district: store.district,
      address: store.address,
      confidence: store.confidence,
      isFavorite: favoriteStoreIds.has(store.id),
      dealCount: deals.length,
      topDeal: topDeal
        ? {
            productId: topDeal.productId,
            ticker: topDeal.ticker,
            productName: topDeal.productName,
            price: topDeal.price,
            dealScore: topDeal.dealScore,
            verdict: topDeal.band.verdict,
            stockStatusLabel: formatMobileDealStockLabel({ storeConfidence: store.confidence, productId: topDeal.productId, basketQuote })
          }
        : null,
      basketQuote: basketQuote
        ? {
            subtotal: basketQuote.subtotal,
            coveragePercent: basketQuote.coveragePercent,
            savingsVsBaseline: basketQuote.savingsVsBaseline ?? 0,
            freshnessLabel: basketQuote.freshnessLabel,
            confidenceLabel: basketQuote.confidenceLabel,
            matchedProductCount: basketQuote.matchedProductIds.length,
            missingProductCount: basketQuote.missingProductIds.length,
            unavailableProductCount: basketQuote.unavailableProductIds.length,
            staleProductCount: basketQuote.staleProductIds.length,
            stockStatusLabel: formatMobileBranchStockLabel({
              matchedProductCount: basketQuote.matchedProductIds.length,
              totalProductCount: quoteProductCount,
              missingProductCount: basketQuote.missingProductIds.length,
              unavailableProductCount: basketQuote.unavailableProductIds.length,
              staleProductCount: basketQuote.staleProductIds.length,
              confidenceLabel: basketQuote.confidenceLabel
            })
          }
        : null
    };
  });
  const selectedStore = selectedStoreId ? stores.find((store) => store.id === selectedStoreId) ?? null : null;
  const selectedBasketQuote = selectedStore ? offerBasket.stores.find((candidate) => candidate.storeId === selectedStore.id) ?? null : null;
  const selectedDeals = selectedStore
    ? api.getStoreDeals(selectedStore.id).map((deal) => ({
        productId: deal.productId,
        ticker: deal.ticker,
        productName: deal.productName,
        price: deal.price,
        dealScore: deal.dealScore,
        verdict: deal.band.verdict,
        stockStatusLabel: formatMobileDealStockLabel({ storeConfidence: selectedStore.confidence, productId: deal.productId, basketQuote: selectedBasketQuote })
      }))
    : [];

  return {
    userId,
    selectedStoreId: selectedStore?.id ?? null,
    favoriteStoreCount: favoriteStoreIds.size,
    basketItemCount: offerBasket.basketItemCount,
    stores,
    selectedStore: selectedStore
      ? {
          id: selectedStore.id,
          name: selectedStore.name,
          district: selectedStore.district,
          deals: selectedDeals
        }
      : null,
    actions: ['open_store', 'compare_basket', 'scan_barcode']
  };
}

function watchlistTriggerLabel(alert: ReturnType<MobileApi['getWatchlist']>['alerts'][number]): string {
  if (alert.trigger.metric === 'price') {
    const threshold = typeof alert.trigger.threshold === 'number' ? ` target ${formatMobileMoney(alert.trigger.threshold)}` : ' target';
    return `${formatMobileMoney(Number(alert.trigger.value))}${threshold}`;
  }
  if (alert.trigger.metric === 'deal_score') return `Score ${alert.trigger.value} / ${alert.trigger.threshold}`;
  return String(alert.trigger.value).replaceAll('_', ' ');
}

export function createMobileWatchlistViewModel(userId: string, api: MobileApi = createGroceryViewApi()): MobileWatchlistViewModel {
  const watchlist = api.getWatchlist(userId);
  const alertsByProduct = new Map<string, typeof watchlist.alerts>();
  for (const alert of watchlist.alerts) {
    alertsByProduct.set(alert.productId, [...(alertsByProduct.get(alert.productId) ?? []), alert]);
  }

  return {
    userId,
    itemCount: watchlist.items.length,
    alertCount: watchlist.alerts.length,
    urgentAlertCount: watchlist.alerts.filter((alert) => alert.severity === 'urgent').length,
    trackedProducts: watchlist.items.map((item) => {
      const product = api.getProduct(item.productId);
      const productAlerts = alertsByProduct.get(item.productId) ?? [];
      return {
        productId: item.productId,
        ticker: product?.ticker ?? item.productId,
        productName: product?.name ?? item.productId,
        targetPriceLabel: item.targetPrice === undefined ? 'No target' : formatMobileMoney(item.targetPrice),
        alertDealScoreAt: item.alertDealScoreAt ?? null,
        favoriteStoresOnly: item.favoriteStoresOnly,
        allowedPriceTypes: item.allowedPriceTypes ?? ['shelf', 'member', 'promotion', 'estimated'],
        bestPriceLabel: product ? formatPriceLabel(product.currentPrices[0]?.price ?? null) : 'No verified price',
        bestStoreName: product?.currentPrices[0]?.storeName ?? null,
        dealScore: product?.dealScore ?? 0,
        alertTypes: [...new Set(productAlerts.map((alert) => alert.type))].sort()
      };
    }),
    alerts: watchlist.alerts.map((alert) => ({
      productId: alert.productId,
      productName: alert.productName,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      triggerLabel: watchlistTriggerLabel(alert)
    })),
    actions: ['open_product', 'compare_stores', 'add_to_weekly_basket', 'scan_barcode']
  };
}

export function createMobileBasketViewModel(userId: string, api: MobileApi = createGroceryViewApi()): MobileBasketViewModel {
  const basket = api.getBasket(userId);
  const comparison = api.compareBasket(userId);
  const budget = api.getBudgetSummary(userId);

  return {
    userId,
    itemCount: basket.items.reduce((total, item) => total + item.quantity, 0),
    cheapestTotalLabel: formatPriceLabel(comparison.cheapestByProduct.total),
    bestSingleStore: comparison.bestSingleStore
      ? {
          storeId: comparison.bestSingleStore.storeId,
          storeName: comparison.bestSingleStore.storeName,
          totalLabel: formatPriceLabel(comparison.bestSingleStore.total),
          itemCount: comparison.bestSingleStore.itemCount
        }
      : null,
    savingsVsBestSingleStoreLabel: formatPriceLabel(comparison.savingsVsBestSingleStore),
    splitStoreCount: comparison.splitStoreCount,
    missingProductIds: [...comparison.missingProductIds],
    budget: {
      weeklyBudgetLabel: formatMobileMoney(budget.weeklyBudget),
      remainingLabel: formatMobileMoney(budget.weeklyRemainingAfterEstimate),
      status: budget.weeklyStatus
    },
    assignments: comparison.cheapestByProduct.assignments.map((assignment) => {
      const product = api.getProduct(assignment.productId);
      return {
        productId: assignment.productId,
        ticker: product?.ticker ?? assignment.productId,
        productName: product?.name ?? assignment.productId,
        storeId: assignment.storeId,
        storeName: assignment.storeName,
        quantity: assignment.quantity,
        unitPriceLabel: formatPriceLabel(assignment.unitPrice),
        lineTotalLabel: formatPriceLabel(assignment.lineTotal)
      };
    }),
    singleStoreOptions: comparison.singleStoreOptions.map((option) => ({
      storeId: option.storeId,
      storeName: option.storeName,
      totalLabel: formatPriceLabel(option.total),
      itemCount: option.itemCount
    })),
    actions: ['compare_basket', 'open_product', 'scan_barcode']
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
  priceDropContext: ShelfOccupancyDropContext;
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
    priceDropContext: shelfOccupancyContextForDrop(terminal.chart.series.map((series) => ({
      sourceType: series.sourceType,
      points: series.points.map((point) => ({ time: point.time, value: point.value })),
      markers: series.markers.map((marker) => ({ time: marker.time, type: marker.type }))
    }))),
    actions: ['add_to_watchlist', 'add_to_weekly_basket', 'compare_stores', 'scan_receipt_to_verify']
  };
}

export type MobileScreenComponentAction =
  | MobileProductPriceTerminalViewModel['actions'][number]
  | MobileStoresViewModel['actions'][number]
  | MobileWatchlistViewModel['actions'][number]
  | MobileBasketViewModel['actions'][number]
  | 'open_product'
  | 'search_product'
  | 'compare_basket'
  | 'scan_barcode'
  | 'set_weekly_budget'
  | 'review_category_budgets'
  | 'review_receipts'
  | 'configure_notifications'
  | 'update_privacy'
  | 'invite_household_member'
  | 'review_household_basket'
  | 'review_household_watchlist'
  | 'report_unknown_barcode'
  | 'reauthenticate'
  | 'retry_online'
  | 'download_export'
  | 'confirm_account_deletion'
  | 'open_ad_privacy_controls'
  | 'schedule_receipt_image_cleanup'
  | 'request_camera_permission'
  | 'review_line_matches'
  | 'confirm_receipt_items'
  | 'queue_for_sync'
  | 'sync_when_online'
  | 'review_assignment'
  | 'submit_review_decision';

export type MobileScreenComponent =
  | {
      type: 'screen';
      key: string;
      title: string;
      state: 'ready' | 'empty' | 'needs_permission' | 'needs_human_review' | 'needs_provider';
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
      action: MobileScreenComponentAction;
      label: string;
      primary: boolean;
    }
  | {
      type: 'empty';
      key: string;
      message: string;
      action: 'search_product' | 'scan_barcode' | 'invite_household_member' | 'set_weekly_budget' | 'review_line_matches' | 'request_camera_permission' | 'review_assignment';
    };

function actionLabel(action: MobileProductPriceTerminalViewModel['actions'][number]): string {
  if (action === 'add_to_watchlist') return 'Watch price';
  if (action === 'add_to_weekly_basket') return 'Add to basket';
  if (action === 'compare_stores') return 'Compare stores';
  return 'Verify with receipt';
}

function scanActionLabel(action: Extract<MobileScreenComponentAction, 'add_to_weekly_basket' | 'add_to_watchlist' | 'compare_stores' | 'search_product' | 'report_unknown_barcode'>): string {
  if (action === 'add_to_weekly_basket') return 'Add to basket';
  if (action === 'add_to_watchlist') return 'Watch price';
  if (action === 'compare_stores') return 'Compare stores';
  if (action === 'search_product') return 'Search product';
  return 'Report barcode';
}

function receiptActionLabel(action: Extract<MobileScreenComponentAction, 'request_camera_permission' | 'review_line_matches' | 'confirm_receipt_items' | 'queue_for_sync' | 'sync_when_online'>): string {
  if (action === 'request_camera_permission') return 'Allow camera';
  if (action === 'review_line_matches') return 'Review matches';
  if (action === 'confirm_receipt_items') return 'Confirm receipt';
  if (action === 'queue_for_sync') return 'Queue offline';
  return 'Sync when online';
}

function humanReviewActionLabel(action: Extract<MobileScreenComponentAction, 'review_assignment' | 'submit_review_decision'>): string {
  if (action === 'review_assignment') return 'Review assignment';
  return 'Submit decision';
}

function todayActionLabel(action: Extract<MobileScreenComponentAction, 'open_product' | 'compare_basket' | 'scan_barcode'>): string {
  if (action === 'open_product') return 'Open deal';
  if (action === 'compare_basket') return 'Compare basket';
  return 'Scan barcode';
}

function searchActionLabel(action: Extract<MobileScreenComponentAction, 'open_product' | 'scan_barcode' | 'add_to_weekly_basket' | 'compare_stores'>): string {
  if (action === 'open_product') return 'Open product';
  if (action === 'add_to_weekly_basket') return 'Add to basket';
  if (action === 'compare_stores') return 'Compare stores';
  return 'Scan barcode';
}

function storesActionLabel(action: MobileStoresViewModel['actions'][number]): string {
  if (action === 'open_store') return 'Open store';
  if (action === 'compare_basket') return 'Compare basket';
  return 'Scan barcode';
}

function watchlistActionLabel(action: MobileWatchlistViewModel['actions'][number]): string {
  if (action === 'open_product') return 'Open product';
  if (action === 'compare_stores') return 'Compare stores';
  if (action === 'add_to_weekly_basket') return 'Add to basket';
  return 'Scan barcode';
}

function budgetActionLabel(action: Extract<MobileScreenComponentAction, 'set_weekly_budget' | 'review_category_budgets' | 'review_receipts'>): string {
  if (action === 'set_weekly_budget') return 'Set budget';
  if (action === 'review_category_budgets') return 'Review categories';
  return 'Review receipts';
}

function basketActionLabel(action: MobileBasketViewModel['actions'][number]): string {
  if (action === 'compare_basket') return 'Compare basket';
  if (action === 'open_product') return 'Open product';
  return 'Scan barcode';
}

function profileActionLabel(action: Extract<MobileScreenComponentAction, 'configure_notifications' | 'update_privacy' | 'invite_household_member'>): string {
  if (action === 'configure_notifications') return 'Configure alerts';
  if (action === 'update_privacy') return 'Update privacy';
  return 'Invite member';
}

function householdActionLabel(action: MobileHouseholdViewModel['actions'][number]): string {
  if (action === 'invite_household_member') return 'Invite member';
  if (action === 'review_household_basket') return 'Review basket';
  return 'Review watchlist';
}

const mobilePrivacyControls = [
  {
    label: 'Raw receipt media',
    detail: 'Stored separately from normalized price observations and deleted after review.',
    state: 'Limited'
  },
  {
    label: 'Location precision',
    detail: 'Store and district metadata are retained without route history.',
    state: 'Reduced'
  },
  {
    label: 'Catalog contributions',
    detail: 'Shared price facts keep provenance and remove household identifiers.',
    state: 'Anonymized'
  },
  {
    label: 'Advertiser payloads',
    detail: 'No raw receipt lines, household identity, or private notes are exposed.',
    state: 'Aggregated'
  }
] as const;

export type MobileProfileHubViewModel = {
  userId: string;
  budget: {
    weeklyBudgetLabel: string;
    plannedBasketLabel: string;
    remainingLabel: string;
    status: 'under' | 'over';
  };
  watchlist: {
    itemCount: number;
    alertCount: number;
  };
  notifications: {
    deliveredCount: number;
    heldCount: number;
    highPriorityCount: number;
  };
  household: {
    name: string;
    memberCount: number;
    weeklyBudgetLabel: string;
    approvalLimitLabel: string;
    reviewer: string;
    sharedFavoriteStoreCount: number;
  } | null;
  privacyControls: Array<{ label: string; detail: string; state: string }>;
};

export type MobileHouseholdViewModel = {
  userId: string;
  household: {
    householdId: string;
    name: string;
    memberCount: number;
    weeklyBudgetLabel: string;
    estimatedTotalLabel: string;
    remainingBudgetLabel: string;
    approvalLimitLabel: string;
    requiresOwnerApproval: boolean;
    reviewer: string;
    members: Array<{ userId: string; displayName: string; itemCount: number }>;
    sharedFavoriteStores: Array<{ storeId: string; storeName: string }>;
    basketItems: Array<{ productId: string; ticker: string; productName: string; quantity: number; addedBy: string; addedByName: string }>;
    watchlistItems: Array<{ productId: string; ticker: string; productName: string; addedBy: string; addedByName: string; targetPriceLabel: string }>;
  } | null;
  actions: Array<'invite_household_member' | 'review_household_basket' | 'review_household_watchlist'>;
};

function formatMobileMoney(value: number): string {
  return `${value.toFixed(2)} SEK`;
}

export type MobileBudgetRouteViewModel = {
  userId: string;
  summary: {
    weeklyBudgetLabel: string;
    plannedBasketLabel: string;
    remainingLabel: string;
    utilizationPercentLabel: string;
    status: 'under' | 'over';
  };
  basket: {
    itemCount: number;
    cheapestTotalLabel: string;
    bestSingleStoreLabel: string;
    splitStoreCount: number;
    missingProductCount: number;
  };
  categoryBudgets: Array<{
    category: string;
    weeklyBudgetLabel: string;
    estimatedSpendLabel: string;
    remainingLabel: string;
    status: 'under' | 'over';
    productCount: number;
  }>;
  unbudgetedCategories: Array<{
    category: string;
    estimatedSpendLabel: string;
    productCount: number;
  }>;
  actions: Array<'set_weekly_budget' | 'review_category_budgets' | 'review_receipts'>;
};

function formatMobilePercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function createMobileBudgetRouteViewModel(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileBudgetRouteViewModel {
  const budget = api.getBudgetSummary(userId);
  const categoryBudget = api.getCategoryBudgetSummary(userId);
  const basket = api.getBasket(userId);
  const comparison = api.compareBasket(userId);
  const utilizationPercent = budget.weeklyBudget === 0 ? 0 : (budget.estimatedBasketTotal / budget.weeklyBudget) * 100;

  return {
    userId,
    summary: {
      weeklyBudgetLabel: formatMobileMoney(budget.weeklyBudget),
      plannedBasketLabel: formatMobileMoney(budget.estimatedBasketTotal),
      remainingLabel: formatMobileMoney(budget.weeklyRemainingAfterEstimate),
      utilizationPercentLabel: formatMobilePercent(utilizationPercent),
      status: budget.weeklyStatus
    },
    basket: {
      itemCount: basket.items.reduce((total, item) => total + item.quantity, 0),
      cheapestTotalLabel: formatMobileMoney(comparison.cheapestByProduct.total),
      bestSingleStoreLabel: comparison.bestSingleStore ? `${comparison.bestSingleStore.storeName}, ${formatMobileMoney(comparison.bestSingleStore.total)}` : 'No complete store yet',
      splitStoreCount: comparison.splitStoreCount,
      missingProductCount: comparison.missingProductIds.length
    },
    categoryBudgets: categoryBudget.categories.map((category) => ({
      category: category.category,
      weeklyBudgetLabel: formatMobileMoney(category.weeklyBudget),
      estimatedSpendLabel: formatMobileMoney(category.estimatedSpend),
      remainingLabel: formatMobileMoney(category.remaining),
      status: category.status,
      productCount: category.productIds.length
    })),
    unbudgetedCategories: categoryBudget.unbudgetedCategories.map((category) => ({
      category: category.category,
      estimatedSpendLabel: formatMobileMoney(category.estimatedSpend),
      productCount: category.productIds.length
    })),
    actions: ['set_weekly_budget', 'review_category_budgets', 'review_receipts']
  };
}

export function createMobileProfileHubViewModel(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileProfileHubViewModel {
  const budget = api.getBudgetSummary(userId);
  const watchlist = api.getWatchlist(userId);
  const inbox = api.getNotificationInboxReport(userId);
  const householdPlan = api.getHouseholdPlan(userId);
  const reviewerDisplayName = householdPlan
    ? householdPlan.household.members.find((member) => member.userId === householdPlan.approvalPolicy.reviewer)?.displayName ?? householdPlan.approvalPolicy.reviewer
    : null;

  return {
    userId,
    budget: {
      weeklyBudgetLabel: formatMobileMoney(budget.weeklyBudget),
      plannedBasketLabel: formatMobileMoney(budget.estimatedBasketTotal),
      remainingLabel: formatMobileMoney(budget.weeklyRemainingAfterEstimate),
      status: budget.weeklyStatus
    },
    watchlist: {
      itemCount: watchlist.items.length,
      alertCount: watchlist.alerts.length
    },
    notifications: {
      deliveredCount: inbox.queue.filter((item) => item.status === 'delivered').length,
      heldCount: inbox.queue.filter((item) => item.status === 'held').length,
      highPriorityCount: inbox.queue.filter((item) => item.priority === 'high').length
    },
    household: householdPlan
      ? {
          name: householdPlan.household.name,
          memberCount: householdPlan.household.members.length,
          weeklyBudgetLabel: formatMobileMoney(householdPlan.household.weeklyBudget),
          approvalLimitLabel: formatMobileMoney(householdPlan.approvalPolicy.approvalLimit),
          reviewer: reviewerDisplayName ?? householdPlan.approvalPolicy.reviewer,
          sharedFavoriteStoreCount: householdPlan.household.sharedFavoriteStoreIds.length
        }
      : null,
    privacyControls: mobilePrivacyControls.map((control) => ({ ...control }))
  };
}

export function createMobileHouseholdViewModel(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileHouseholdViewModel {
  const householdPlan = api.getHouseholdPlan(userId);
  if (!householdPlan) {
    return {
      userId,
      household: null,
      actions: ['invite_household_member']
    };
  }

  const memberNameById = new Map(householdPlan.household.members.map((member) => [member.userId, member.displayName]));
  const contributionByMember = new Map(householdPlan.summary.memberContributions.map((member) => [member.userId, member.itemCount]));
  const reviewer = memberNameById.get(householdPlan.approvalPolicy.reviewer) ?? householdPlan.approvalPolicy.reviewer;

  return {
    userId,
    household: {
      householdId: householdPlan.household.id,
      name: householdPlan.household.name,
      memberCount: householdPlan.household.members.length,
      weeklyBudgetLabel: formatMobileMoney(householdPlan.household.weeklyBudget),
      estimatedTotalLabel: formatMobileMoney(householdPlan.summary.estimatedTotal),
      remainingBudgetLabel: formatMobileMoney(householdPlan.summary.remainingBudget),
      approvalLimitLabel: formatMobileMoney(householdPlan.approvalPolicy.approvalLimit),
      requiresOwnerApproval: householdPlan.approvalPolicy.requiresOwnerApproval,
      reviewer,
      members: householdPlan.household.members.map((member) => ({
        userId: member.userId,
        displayName: member.displayName,
        itemCount: contributionByMember.get(member.userId) ?? 0
      })),
      sharedFavoriteStores: householdPlan.household.sharedFavoriteStoreIds.map((storeId) => ({
        storeId,
        storeName: api.getStore(storeId)?.name ?? storeId
      })),
      basketItems: householdPlan.household.basketItems.map((item) => {
        const product = api.getProduct(item.productId);
        return {
          productId: item.productId,
          ticker: product?.ticker ?? item.productId,
          productName: product?.name ?? item.productId,
          quantity: item.quantity,
          addedBy: item.addedBy,
          addedByName: memberNameById.get(item.addedBy) ?? item.addedBy
        };
      }),
      watchlistItems: householdPlan.household.watchlistItems.map((item) => {
        const product = api.getProduct(item.productId);
        return {
          productId: item.productId,
          ticker: product?.ticker ?? item.productId,
          productName: product?.name ?? item.productId,
          addedBy: item.addedBy,
          addedByName: memberNameById.get(item.addedBy) ?? item.addedBy,
          targetPriceLabel: item.targetPrice === undefined ? 'No target' : formatMobileMoney(item.targetPrice)
        };
      })
    },
    actions: ['invite_household_member', 'review_household_basket', 'review_household_watchlist']
  };
}

export function composeMobileBudgetScreen(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileBudgetRouteViewModel(userId, api);
  const actions: Array<Extract<MobileScreenComponentAction, 'set_weekly_budget' | 'review_category_budgets' | 'review_receipts'>> = viewModel.actions;

  return {
    type: 'screen',
    key: `budget:${userId}`,
    title: 'Budget',
    state: 'ready',
    children: [
      {
        type: 'section',
        key: 'budget-summary',
        title: 'Budget summary',
        children: [
          { type: 'metric', key: 'weekly-budget', label: 'Weekly budget', value: viewModel.summary.weeklyBudgetLabel, tone: 'neutral' },
          { type: 'metric', key: 'planned-basket', label: 'Planned basket', value: viewModel.summary.plannedBasketLabel, tone: viewModel.summary.status === 'under' ? 'positive' : 'warning' },
          { type: 'metric', key: 'remaining', label: 'Remaining', value: viewModel.summary.remainingLabel, tone: viewModel.summary.status === 'under' ? 'positive' : 'warning' },
          { type: 'metric', key: 'utilization', label: 'Utilization', value: viewModel.summary.utilizationPercentLabel, tone: viewModel.summary.status === 'under' ? 'neutral' : 'warning' }
        ]
      },
      {
        type: 'section',
        key: 'basket-impact',
        title: 'Basket impact',
        children: [
          { type: 'row', key: 'basket-items', label: 'Basket items', value: `${viewModel.basket.itemCount} planned` },
          { type: 'row', key: 'cheapest-total', label: 'Cheapest total', value: viewModel.basket.cheapestTotalLabel },
          { type: 'row', key: 'best-single-store', label: 'Best store', value: viewModel.basket.bestSingleStoreLabel },
          { type: 'row', key: 'split-store-count', label: 'Split stores', value: `${viewModel.basket.splitStoreCount} stores, ${viewModel.basket.missingProductCount} missing` }
        ]
      },
      {
        type: 'section',
        key: 'category-budgets',
        title: 'Category budgets',
        children: viewModel.categoryBudgets.length > 0
          ? viewModel.categoryBudgets.map((category) => ({
              type: 'row',
              key: `category-budget:${category.category}`,
              label: category.category,
              value: `${category.estimatedSpendLabel} of ${category.weeklyBudgetLabel}, ${category.remainingLabel} remaining, ${category.productCount} products`
            }))
          : [{ type: 'empty', key: 'no-category-budgets', message: 'Set category budgets to catch basket drift before checkout.', action: 'set_weekly_budget' }]
      },
      {
        type: 'section',
        key: 'unbudgeted-categories',
        title: 'Unbudgeted categories',
        children: viewModel.unbudgetedCategories.length > 0
          ? viewModel.unbudgetedCategories.map((category) => ({
              type: 'row',
              key: `unbudgeted:${category.category}`,
              label: category.category,
              value: `${category.estimatedSpendLabel}, ${category.productCount} products`
            }))
          : [{ type: 'empty', key: 'no-unbudgeted-categories', message: 'All planned basket categories have a weekly budget.', action: 'set_weekly_budget' }]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: budgetActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export function composeMobileTodayScreen(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileViewModel(userId, api);
  const budget = api.getBudgetSummary(userId);
  const watchlist = api.getWatchlist(userId);
  const favoriteStores = viewModel.stores.favoriteStores;
  const actions: Array<Extract<MobileScreenComponentAction, 'open_product' | 'compare_basket' | 'scan_barcode'>> = ['open_product', 'compare_basket', 'scan_barcode'];

  return {
    type: 'screen',
    key: `today:${userId}`,
    title: `${viewModel.today.marketCity} Today`,
    state: 'ready',
    children: [
      {
        type: 'section',
        key: 'budget',
        title: 'Budget',
        children: [
          { type: 'metric', key: 'weekly-budget', label: 'Weekly budget', value: `${budget.weeklyBudget} SEK`, tone: 'neutral' },
          { type: 'metric', key: 'planned-basket', label: 'Planned basket', value: `${budget.estimatedBasketTotal} SEK`, tone: budget.weeklyStatus === 'under' ? 'positive' : 'warning' },
          { type: 'metric', key: 'remaining-after-plan', label: 'After plan', value: `${budget.weeklyRemainingAfterEstimate} SEK`, tone: budget.weeklyRemainingAfterEstimate >= 0 ? 'positive' : 'warning' }
        ]
      },
      {
        type: 'section',
        key: 'top-deals',
        title: 'Top deals',
        children: viewModel.today.topDeals.slice(0, 3).map((deal) => ({
          type: 'row',
          key: `deal:${deal.ticker}`,
          label: deal.ticker,
          value: `${deal.bestPrice?.toFixed(2) ?? 'n/a'} SEK, score ${deal.dealScore}`
        }))
      },
      {
        type: 'section',
        key: 'favorite-stores',
        title: 'Favorite stores',
        children: favoriteStores.length > 0
          ? favoriteStores.map((store) => ({ type: 'row', key: `store:${store.id}`, label: store.name, value: 'Saved for local deal filters' }))
          : [{ type: 'empty', key: 'no-favorite-stores', message: 'Add favorite stores to personalize Today.', action: 'search_product' }]
      },
      {
        type: 'section',
        key: 'watchlist',
        title: 'Watchlist',
        children: [
          { type: 'metric', key: 'watchlist-items', label: 'Watched products', value: String(watchlist.items.length), tone: 'neutral' },
          { type: 'metric', key: 'watchlist-alerts', label: 'Active alerts', value: String(watchlist.alerts.length), tone: watchlist.alerts.length > 0 ? 'positive' : 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: todayActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export function composeMobileSearchScreen(
  input: { userId: string; query: string; selectedProductId?: string },
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileDiscoveryViewModel(input, api);
  const actions: Array<Extract<MobileScreenComponentAction, 'open_product' | 'scan_barcode' | 'add_to_weekly_basket' | 'compare_stores'>> =
    viewModel.selectedProduct ? ['open_product', 'add_to_weekly_basket', 'compare_stores', 'scan_barcode'] : ['scan_barcode'];

  return {
    type: 'screen',
    key: `search:${viewModel.userId}:${viewModel.query || 'empty'}`,
    title: 'Search',
    state: viewModel.searchResults.length > 0 || viewModel.selectedProduct ? 'ready' : 'empty',
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'results', label: 'Results', value: String(viewModel.searchResults.length), tone: viewModel.searchResults.length > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'favorite-stores', label: 'Favorite stores', value: String(viewModel.favoriteStores.length), tone: viewModel.favoriteStores.length > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'basket-items', label: 'Basket items', value: String(viewModel.weeklyBasket.itemCount), tone: viewModel.weeklyBasket.itemCount > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'watchlist-alerts', label: 'Alerts', value: String(viewModel.watchlist.alertCount), tone: viewModel.watchlist.alertCount > 0 ? 'warning' : 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'results',
        title: 'Results',
        children: viewModel.searchResults.length > 0
          ? viewModel.searchResults.map((result) => ({
              type: 'row',
              key: `search-result:${result.id}`,
              label: result.ticker,
              value: `${result.name}, ${result.bestPrice === null ? 'no current price' : `${result.bestPrice.toFixed(2)} SEK`}, Deal Score ${result.dealScore}`
            }))
          : [{ type: 'empty', key: 'no-search-results', message: 'Search products by name or scan a barcode to match shelf prices.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'selected-product',
        title: 'Selected product',
        children: viewModel.selectedProduct
          ? [
              { type: 'row', key: 'selected-verdict', label: viewModel.selectedProduct.ticker, value: `${viewModel.selectedProduct.verdict}, Deal Score ${viewModel.selectedProduct.dealScore}` },
              { type: 'row', key: 'selected-price', label: 'Best price', value: viewModel.selectedProduct.currentPrices[0] ? `${viewModel.selectedProduct.currentPrices[0].price.toFixed(2)} SEK at ${viewModel.selectedProduct.currentPrices[0].storeName}` : 'No current price' },
              { type: 'row', key: 'selected-history', label: 'History', value: `${viewModel.selectedProduct.priceHistory.length} points, ${viewModel.selectedProduct.priceTerminal.chartSummary.isNewLow ? 'new low' : 'no new low'}` }
            ]
          : [{ type: 'empty', key: 'no-selected-product', message: 'Open a result to compare price history, store coverage, and basket impact.', action: 'search_product' }]
      },
      {
        type: 'section',
        key: 'basket-context',
        title: 'Basket context',
        children: [
          { type: 'row', key: 'cheapest-total', label: 'Cheapest split', value: `${viewModel.weeklyBasket.cheapestTotal.toFixed(2)} SEK` },
          { type: 'row', key: 'best-single-store', label: 'Best store', value: viewModel.weeklyBasket.bestSingleStore ? `${viewModel.weeklyBasket.bestSingleStore.storeName}, ${viewModel.weeklyBasket.bestSingleStore.total.toFixed(2)} SEK` : 'No complete store yet' },
          { type: 'row', key: 'budget-remaining', label: 'Budget left', value: `${viewModel.budget.weeklyRemainingAfterEstimate.toFixed(2)} SEK` }
        ]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: searchActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export function composeMobileStoresScreen(
  input: MobileStoresInput,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileStoresViewModel(input, api);
  const favoriteStores = viewModel.stores.filter((store) => store.isFavorite);
  const rankedStores = [...viewModel.stores].sort((left, right) => {
    if (left.isFavorite !== right.isFavorite) return left.isFavorite ? -1 : 1;
    const leftSavings = left.basketQuote?.savingsVsBaseline ?? 0;
    const rightSavings = right.basketQuote?.savingsVsBaseline ?? 0;
    return rightSavings - leftSavings || (right.topDeal?.dealScore ?? 0) - (left.topDeal?.dealScore ?? 0) || left.name.localeCompare(right.name);
  });
  const topDeals = rankedStores.flatMap((store) => store.topDeal ? [{ store, deal: store.topDeal }] : []).slice(0, 3);

  return {
    type: 'screen',
    key: `stores:${viewModel.userId}`,
    title: 'Stores',
    state: 'ready',
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'favorite-store-count', label: 'Favorite stores', value: String(viewModel.favoriteStoreCount), tone: viewModel.favoriteStoreCount > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'basket-item-count', label: 'Basket items', value: String(viewModel.basketItemCount), tone: viewModel.basketItemCount > 0 ? 'positive' : 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'favorite-stores',
        title: 'Favorite stores',
        children: favoriteStores.length > 0
          ? favoriteStores.map((store) => ({
              type: 'row',
              key: `favorite-store:${store.id}`,
              label: store.name,
              value: `${store.district}, ${store.dealCount} current deals, stock ${store.basketQuote?.stockStatusLabel ?? formatMobileStockStatusLabel({ available: store.dealCount > 0, confidenceLabel: store.confidence })}`
            }))
          : [{ type: 'empty', key: 'no-favorite-stores', message: 'Save favorite stores to rank nearby offers.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'ranked-stores',
        title: 'Ranked stores',
        children: rankedStores.map((store) => ({
          type: 'row',
          key: `store:${store.id}`,
          label: store.name,
          value: store.basketQuote
            ? `${store.basketQuote.coveragePercent}% coverage, ${store.basketQuote.subtotal.toFixed(2)} SEK, ${store.basketQuote.freshnessLabel}, stock ${store.basketQuote.stockStatusLabel}`
            : `${store.dealCount} current deals, top score ${store.topDeal?.dealScore ?? 'n/a'}, stock ${formatMobileStockStatusLabel({ available: store.dealCount > 0, confidenceLabel: store.confidence })}`
        }))
      },
      {
        type: 'section',
        key: 'top-store-deals',
        title: 'Top store deals',
        children: topDeals.map(({ store, deal }) => ({
          type: 'row',
          key: `store-deal:${store.id}:${deal.productId}`,
          label: `${deal.ticker} at ${store.chain}`,
          value: `${deal.price.toFixed(2)} SEK, score ${deal.dealScore}, ${deal.verdict}, stock ${deal.stockStatusLabel}`
        }))
      },
      ...(viewModel.selectedStore
        ? [{
            type: 'section' as const,
            key: 'selected-store',
            title: 'Selected store',
            children: [
              { type: 'row' as const, key: 'selected-store-name', label: viewModel.selectedStore.name, value: viewModel.selectedStore.district },
              ...viewModel.selectedStore.deals.slice(0, 3).map((deal) => ({
                type: 'row' as const,
                key: `selected-deal:${deal.productId}`,
                label: deal.productName,
                value: `${deal.price.toFixed(2)} SEK, score ${deal.dealScore}, ${deal.verdict}, stock ${deal.stockStatusLabel}`
              }))
            ]
          }]
        : []),
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: viewModel.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: storesActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export function composeMobileWatchlistScreen(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileWatchlistViewModel(userId, api);
  const highestPriorityAlerts = [...viewModel.alerts].sort((left, right) => {
    const severityRank = { urgent: 2, opportunity: 1, info: 0 } as const;
    return severityRank[right.severity] - severityRank[left.severity] || left.productName.localeCompare(right.productName);
  });

  return {
    type: 'screen',
    key: `watchlist:${userId}`,
    title: 'Watchlist',
    state: viewModel.itemCount > 0 ? 'ready' : 'empty',
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'tracked-products', label: 'Tracked products', value: String(viewModel.itemCount), tone: viewModel.itemCount > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'active-alerts', label: 'Active alerts', value: String(viewModel.alertCount), tone: viewModel.alertCount > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'urgent-alerts', label: 'Urgent alerts', value: String(viewModel.urgentAlertCount), tone: viewModel.urgentAlertCount > 0 ? 'warning' : 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'tracked-products',
        title: 'Tracked products',
        children: viewModel.trackedProducts.length > 0
          ? viewModel.trackedProducts.map((product) => ({
              type: 'row',
              key: `watch:${product.productId}`,
              label: product.ticker,
              value: `${product.bestPriceLabel} at ${product.bestStoreName ?? 'unknown store'}, target ${product.targetPriceLabel}, ${product.alertTypes.length} alerts`
            }))
          : [{ type: 'empty', key: 'no-watchlist-items', message: 'Watch products to get price, Deal Score, and new-low alerts.', action: 'search_product' }]
      },
      {
        type: 'section',
        key: 'active-alerts',
        title: 'Active alerts',
        children: highestPriorityAlerts.length > 0
          ? highestPriorityAlerts.map((alert) => ({
              type: 'row',
              key: `alert:${alert.productId}:${alert.type}`,
              label: alert.productName,
              value: `${alert.severity}: ${alert.triggerLabel}`
            }))
          : [{ type: 'empty', key: 'no-watchlist-alerts', message: 'No watched products are crossing alert thresholds yet.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: viewModel.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: watchlistActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export function composeMobileBasketScreen(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileBasketViewModel(userId, api);

  return {
    type: 'screen',
    key: `basket:${userId}`,
    title: 'Basket',
    state: viewModel.itemCount > 0 ? 'ready' : 'empty',
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'item-count', label: 'Items', value: String(viewModel.itemCount), tone: viewModel.itemCount > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'cheapest-total', label: 'Cheapest split', value: viewModel.cheapestTotalLabel, tone: 'positive' },
          { type: 'metric', key: 'budget-remaining', label: 'Budget left', value: viewModel.budget.remainingLabel, tone: viewModel.budget.status === 'under' ? 'positive' : 'warning' }
        ]
      },
      {
        type: 'section',
        key: 'assignments',
        title: 'Cheapest assignments',
        children: viewModel.assignments.length > 0
          ? viewModel.assignments.map((assignment) => ({
              type: 'row',
              key: `assignment:${assignment.productId}:${assignment.storeId}`,
              label: assignment.ticker,
              value: `${assignment.quantity} x ${assignment.unitPriceLabel} at ${assignment.storeName}, line ${assignment.lineTotalLabel}`
            }))
          : [{ type: 'empty', key: 'empty-basket', message: 'Start a basket from a deal, search result, or barcode scan.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'single-store-options',
        title: 'Single-store options',
        children: viewModel.singleStoreOptions.length > 0
          ? viewModel.singleStoreOptions.map((option) => ({
              type: 'row',
              key: `store-option:${option.storeId}`,
              label: option.storeName,
              value: `${option.totalLabel}, ${option.itemCount} matched items`
            }))
          : [{ type: 'empty', key: 'no-store-options', message: 'Add items and favorite stores to compare basket totals.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: viewModel.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: basketActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export function composeMobileProfileScreen(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileProfileHubViewModel(userId, api);
  const actions: Array<Extract<MobileScreenComponentAction, 'configure_notifications' | 'update_privacy' | 'invite_household_member'>> = [
    'configure_notifications',
    'update_privacy',
    'invite_household_member'
  ];

  return {
    type: 'screen',
    key: `profile:${userId}`,
    title: 'Profile',
    state: 'ready',
    children: [
      {
        type: 'section',
        key: 'account-summary',
        title: 'Account summary',
        children: [
          { type: 'metric', key: 'weekly-budget', label: 'Weekly budget', value: viewModel.budget.weeklyBudgetLabel, tone: 'neutral' },
          { type: 'metric', key: 'planned-basket', label: 'Planned basket', value: viewModel.budget.plannedBasketLabel, tone: viewModel.budget.status === 'under' ? 'positive' : 'warning' },
          { type: 'metric', key: 'watchlist-items', label: 'Watched products', value: String(viewModel.watchlist.itemCount), tone: viewModel.watchlist.itemCount > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'held-notifications', label: 'Held alerts', value: String(viewModel.notifications.heldCount), tone: viewModel.notifications.heldCount > 0 ? 'warning' : 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'household',
        title: 'Household',
        children: viewModel.household
          ? [
              { type: 'row', key: 'household-name', label: viewModel.household.name, value: `${viewModel.household.memberCount} members` },
              { type: 'row', key: 'household-budget', label: 'Shared budget', value: viewModel.household.weeklyBudgetLabel },
              { type: 'row', key: 'approval-policy', label: 'Approval policy', value: `${viewModel.household.reviewer} reviews over ${viewModel.household.approvalLimitLabel}` },
              { type: 'row', key: 'shared-stores', label: 'Shared stores', value: `${viewModel.household.sharedFavoriteStoreCount} favorites` }
            ]
          : [
              {
                type: 'empty',
                key: 'no-household',
                message: 'Create or join a household to share baskets, budgets, and review duties.',
                action: 'invite_household_member'
              }
            ]
      },
      {
        type: 'section',
        key: 'privacy-controls',
        title: 'Privacy controls',
        children: viewModel.privacyControls.map((control) => ({
          type: 'row',
          key: `privacy:${control.label.toLowerCase().replaceAll(' ', '-')}`,
          label: control.label,
          value: `${control.state}: ${control.detail}`
        }))
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: profileActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export function composeMobileHouseholdScreen(
  userId: string,
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileHouseholdViewModel(userId, api);
  const household = viewModel.household;

  if (!household) {
    return {
      type: 'screen',
      key: `household:${userId}`,
      title: 'Household',
      state: 'empty',
      children: [
        {
          type: 'empty',
          key: 'no-household',
          message: 'Create or join a household to share baskets, budgets, and review duties.',
          action: 'invite_household_member'
        },
        {
          type: 'section',
          key: 'actions',
          title: 'Actions',
          children: viewModel.actions.map((action, index) => ({
            type: 'action',
            key: action,
            action,
            label: householdActionLabel(action),
            primary: index === 0
          }))
        }
      ]
    };
  }

  return {
    type: 'screen',
    key: `household:${household.householdId}`,
    title: household.name,
    state: 'ready',
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'members', label: 'Members', value: String(household.memberCount), tone: household.memberCount > 1 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'weekly-budget', label: 'Weekly budget', value: household.weeklyBudgetLabel, tone: 'neutral' },
          { type: 'metric', key: 'planned-total', label: 'Planned total', value: household.estimatedTotalLabel, tone: household.requiresOwnerApproval ? 'warning' : 'positive' },
          { type: 'metric', key: 'remaining-budget', label: 'Remaining', value: household.remainingBudgetLabel, tone: household.remainingBudgetLabel.startsWith('-') ? 'warning' : 'positive' }
        ]
      },
      {
        type: 'section',
        key: 'approval',
        title: 'Approval',
        children: [
          { type: 'row', key: 'approval-limit', label: 'Approval limit', value: household.approvalLimitLabel },
          { type: 'row', key: 'reviewer', label: 'Reviewer', value: household.reviewer },
          { type: 'row', key: 'approval-status', label: 'Status', value: household.requiresOwnerApproval ? 'Review required' : 'No review needed' }
        ]
      },
      {
        type: 'section',
        key: 'members',
        title: 'Members',
        children: household.members.map((member) => ({
          type: 'row',
          key: `member:${member.userId}`,
          label: member.displayName,
          value: `${member.itemCount} basket items`
        }))
      },
      {
        type: 'section',
        key: 'shared-stores',
        title: 'Shared stores',
        children: household.sharedFavoriteStores.length > 0
          ? household.sharedFavoriteStores.map((store) => ({
              type: 'row',
              key: `shared-store:${store.storeId}`,
              label: store.storeName,
              value: 'Shared favorite'
            }))
          : [{ type: 'empty', key: 'no-shared-stores', message: 'Share favorite stores to align household deal filters.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'basket-items',
        title: 'Basket items',
        children: household.basketItems.length > 0
          ? household.basketItems.map((item) => ({
              type: 'row',
              key: `household-basket:${item.productId}:${item.addedBy}`,
              label: item.ticker,
              value: `${item.quantity} planned by ${item.addedByName}`
            }))
          : [{ type: 'empty', key: 'no-household-basket-items', message: 'Add household basket items to coordinate the weekly shop.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'watchlist-items',
        title: 'Watchlist',
        children: household.watchlistItems.length > 0
          ? household.watchlistItems.map((item) => ({
              type: 'row',
              key: `household-watch:${item.productId}:${item.addedBy}`,
              label: item.ticker,
              value: `${item.targetPriceLabel}, watched by ${item.addedByName}`
            }))
          : [{ type: 'empty', key: 'no-household-watchlist-items', message: 'Share watched products to avoid duplicate deal hunting.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: viewModel.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: householdActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
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
        key: 'price-drop-context',
        title: 'Price-drop context',
        children: [
          { type: 'row', key: 'drop-status', label: 'Context', value: terminal.priceDropContext.label },
          { type: 'row', key: 'drop-detail', label: 'Detail', value: terminal.priceDropContext.detail },
          { type: 'row', key: 'drop-timing', label: 'Purchase timing', value: terminal.priceDropContext.purchaseTiming }
        ]
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

export type MobileBarcodeScanViewModel = {
  code: string;
  product: {
    productId: string;
    ticker: string;
    productName: string;
    bestPriceLabel: string;
    dealScore: number;
  } | null;
  verdict: string;
  confidenceLabel: string;
  equivalentProducts: string[];
  actions: Array<'add_to_weekly_basket' | 'add_to_watchlist' | 'compare_stores' | 'search_product' | 'report_unknown_barcode'>;
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

export function createMobileBarcodeScanViewModel(
  input: { code: string; productId?: string },
  api: MobileApi = createGroceryViewApi()
): MobileBarcodeScanViewModel {
  const result = buildScanResult({ mode: 'barcode', code: input.code, productId: input.productId }, api);

  return {
    code: result.code,
    product: result.product
      ? {
          productId: result.product.id,
          ticker: result.product.ticker,
          productName: result.product.name,
          bestPriceLabel: formatPriceLabel(result.product.currentBestPrice),
          dealScore: result.product.dealScore
        }
      : null,
    verdict: result.verdict,
    confidenceLabel: result.confidenceLabel,
    equivalentProducts: [...result.equivalentProducts],
    actions: result.actions as MobileBarcodeScanViewModel['actions']
  };
}

export function composeMobileBarcodeScanScreen(
  input: { code: string; productId?: string },
  api: MobileApi = createGroceryViewApi()
): MobileScreenComponent {
  const viewModel = createMobileBarcodeScanViewModel(input, api);

  return {
    type: 'screen',
    key: `barcode-scan:${viewModel.code}`,
    title: 'Barcode scan',
    state: viewModel.product ? 'ready' : 'empty',
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'confidence', label: 'Confidence', value: viewModel.confidenceLabel, tone: viewModel.product ? 'positive' : 'warning' },
          { type: 'metric', key: 'verdict', label: 'Verdict', value: viewModel.verdict, tone: viewModel.product ? 'positive' : 'neutral' },
          { type: 'metric', key: 'equivalents', label: 'Equivalents', value: String(viewModel.equivalentProducts.length), tone: viewModel.equivalentProducts.length > 0 ? 'positive' : 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'product',
        title: 'Product',
        children: viewModel.product
          ? [
              { type: 'row', key: `product:${viewModel.product.productId}`, label: viewModel.product.ticker, value: `${viewModel.product.bestPriceLabel}, score ${viewModel.product.dealScore}` },
              { type: 'row', key: 'product-name', label: 'Name', value: viewModel.product.productName }
            ]
          : [{ type: 'empty', key: 'unknown-barcode', message: 'No verified product is linked to this barcode yet.', action: 'search_product' }]
      },
      {
        type: 'section',
        key: 'equivalents',
        title: 'Equivalents',
        children: viewModel.equivalentProducts.length > 0
          ? viewModel.equivalentProducts.map((equivalent) => ({ type: 'row', key: `equivalent:${equivalent}`, label: equivalent, value: 'Available for comparison' }))
          : [{ type: 'empty', key: 'no-equivalents', message: 'Scan or search to find equivalent products.', action: 'search_product' }]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: viewModel.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: scanActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

function receiptScreenState(plan: ReturnType<typeof buildMobileReceiptReviewPlan>): Extract<MobileScreenComponent, { type: 'screen' }>['state'] {
  if (plan.status === 'ready_to_confirm') return 'ready';
  if (plan.blockers.includes('camera_permission_required')) return 'needs_permission';
  if (plan.status === 'needs_review') return 'needs_human_review';
  return 'needs_provider';
}

export function composeMobileReceiptScanScreen(input: MobileReceiptReviewInput): MobileScreenComponent {
  const plan = buildMobileReceiptReviewPlan(input);
  const rows = selectMobileReceiptReviewRows(input.review);

  return {
    type: 'screen',
    key: `receipt-scan:${plan.receiptId}`,
    title: 'Receipt scan',
    state: receiptScreenState(plan),
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'confidence', label: 'Confidence', value: plan.confidenceLabel, tone: plan.confidenceLabel === 'high' ? 'positive' : 'warning' },
          { type: 'metric', key: 'lines', label: 'Lines', value: String(plan.summary.lineCount), tone: plan.summary.lineCount > 0 ? 'positive' : 'neutral' },
          { type: 'metric', key: 'needs-review', label: 'Needs review', value: String(plan.summary.needsReviewCount), tone: plan.summary.needsReviewCount > 0 ? 'warning' : 'positive' },
          { type: 'metric', key: 'weekly-remaining', label: 'Budget left', value: formatMobileMoney(plan.summary.weeklyRemainingAfterReceipt), tone: plan.summary.weeklyStatus === 'under' ? 'positive' : 'warning' }
        ]
      },
      {
        type: 'section',
        key: 'receipt-lines',
        title: 'Receipt lines',
        children: rows.length > 0
          ? rows.map((row) => ({
              type: 'row',
              key: `receipt-line:${row.rawName}`,
              label: row.label,
              value: `${formatMobileMoney(row.itemTotal)}, ${(row.matchConfidence * 100).toFixed(0)}% match${row.reviewRequired ? ', review required' : ''}`
            }))
          : [{ type: 'empty', key: 'no-receipt-lines', message: 'Scan a receipt to extract grocery lines.', action: 'scan_barcode' }]
      },
      {
        type: 'section',
        key: 'budget-impact',
        title: 'Budget impact',
        children: [
          { type: 'row', key: 'budget-impact', label: 'Receipt impact', value: formatMobileMoney(plan.summary.budgetImpact) },
          { type: 'row', key: 'good-buys', label: 'Good buys', value: String(plan.summary.goodBuyCount) },
          { type: 'row', key: 'overspend', label: 'Overspend lines', value: String(plan.summary.overspendCount) },
          { type: 'row', key: 'local-median-delta', label: 'Local median delta', value: formatMobileMoney(input.review.comparedWithLocalMedianDelta) }
        ]
      },
      {
        type: 'section',
        key: 'blockers',
        title: 'Blockers',
        children: plan.blockers.length > 0
          ? plan.blockers.map((blocker) => ({
              type: 'row',
              key: `blocker:${blocker}`,
              label: blocker,
              value: blocker === 'line_match_review_required' ? `${plan.summary.needsReviewCount} lines need review` : 'Required before receipt writeback'
            }))
          : [{ type: 'row', key: 'ready-to-confirm', label: 'Ready', value: 'Receipt lines can update budget and basket context.' }]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: plan.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: receiptActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export type MobileHumanReviewAssignment = {
  assignmentId: string;
  kind: 'receipt_line_match' | 'barcode_report' | 'price_claim';
  title: string;
  submittedBy: string;
  confidenceLabel: 'high' | 'medium' | 'low';
  slaDueAt: string;
  status: 'open' | 'in_review' | 'blocked';
};

export type MobileHumanReviewQueueInput = {
  reviewerId: string;
  canSubmitDecisions: boolean;
  assignments: MobileHumanReviewAssignment[];
  now: string;
};

function reviewQueueState(input: MobileHumanReviewQueueInput): Extract<MobileScreenComponent, { type: 'screen' }>['state'] {
  if (!input.canSubmitDecisions) return 'needs_provider';
  return input.assignments.length > 0 ? 'needs_human_review' : 'empty';
}

export function composeMobileHumanReviewQueueScreen(input: MobileHumanReviewQueueInput): MobileScreenComponent {
  const overdueCount = input.assignments.filter((assignment) => Date.parse(assignment.slaDueAt) < Date.parse(input.now)).length;
  const blockedCount = input.assignments.filter((assignment) => assignment.status === 'blocked').length;
  const lowConfidenceCount = input.assignments.filter((assignment) => assignment.confidenceLabel === 'low').length;
  const actions: Array<Extract<MobileScreenComponentAction, 'review_assignment' | 'submit_review_decision'>> = input.assignments.length > 0
    ? ['review_assignment', 'submit_review_decision']
    : ['review_assignment'];

  return {
    type: 'screen',
    key: `human-review-queue:${input.reviewerId}`,
    title: 'Review queue',
    state: reviewQueueState(input),
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'open-assignments', label: 'Open', value: String(input.assignments.length), tone: input.assignments.length > 0 ? 'warning' : 'positive' },
          { type: 'metric', key: 'overdue', label: 'Overdue', value: String(overdueCount), tone: overdueCount > 0 ? 'warning' : 'positive' },
          { type: 'metric', key: 'blocked', label: 'Blocked', value: String(blockedCount), tone: blockedCount > 0 ? 'warning' : 'neutral' },
          { type: 'metric', key: 'low-confidence', label: 'Low confidence', value: String(lowConfidenceCount), tone: lowConfidenceCount > 0 ? 'warning' : 'positive' }
        ]
      },
      {
        type: 'section',
        key: 'assignments',
        title: 'Assignments',
        children: input.assignments.length > 0
          ? input.assignments.map((assignment) => ({
              type: 'row',
              key: `assignment:${assignment.assignmentId}`,
              label: assignment.title,
              value: `${assignment.kind}, ${assignment.confidenceLabel} confidence, ${assignment.status}`
            }))
          : [{ type: 'empty', key: 'no-review-assignments', message: 'No low-confidence product matches or community reports need review.', action: 'review_assignment' }]
      },
      {
        type: 'section',
        key: 'sla',
        title: 'SLA',
        children: input.assignments.length > 0
          ? input.assignments.map((assignment) => ({
              type: 'row',
              key: `sla:${assignment.assignmentId}`,
              label: assignment.assignmentId,
              value: Date.parse(assignment.slaDueAt) < Date.parse(input.now) ? `Overdue since ${assignment.slaDueAt}` : `Due ${assignment.slaDueAt}`
            }))
          : [{ type: 'row', key: 'sla-clear', label: 'Queue clear', value: 'No active SLA timers.' }]
      },
      {
        type: 'section',
        key: 'permissions',
        title: 'Permissions',
        children: [
          { type: 'row', key: 'reviewer', label: 'Reviewer', value: input.reviewerId },
          { type: 'row', key: 'decision-permission', label: 'Decision writes', value: input.canSubmitDecisions ? 'Enabled' : 'Blocked until reviewer permission is granted' }
        ]
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: humanReviewActionLabel(action),
          primary: index === 0
        }))
      }
    ]
  };
}

export type ExpoRoute = {
  path:
    | '/today'
    | '/stores'
    | '/watchlist'
    | '/search'
    | '/products/[id]/terminal'
    | '/basket'
    | '/budget'
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
  | 'compare_stores'
  | 'add_to_weekly_basket'
  | 'set_weekly_budget'
  | 'review_category_budgets'
  | 'review_receipts'
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
      { path: '/watchlist', screen: 'WatchlistScreen', purpose: 'Tracked products, alert thresholds, and price opportunities', requiresAuth: true },
      { path: '/search', screen: 'SearchScreen', purpose: 'Product search with price, basket, and watchlist context', requiresAuth: true },
      { path: '/products/[id]/terminal', screen: 'ProductPriceTerminalScreen', purpose: 'Stock-style product quote, distribution, and history terminal', requiresAuth: true },
      { path: '/basket', screen: 'BasketScreen', purpose: 'Weekly basket planning and smart swaps', requiresAuth: true },
      { path: '/budget', screen: 'BudgetScreen', purpose: 'Weekly budget, category budgets, and planned basket impact', requiresAuth: true },
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
      route: '/watchlist',
      screen: 'WatchlistScreen',
      primaryState: 'ready',
      emptyState: 'Watch products to get price, Deal Score, and new-low alerts.',
      dataDependencies: ['watchlist_items', 'watchlist_alerts', 'product_prices'],
      actions: ['open_product', 'compare_stores', 'add_to_weekly_basket'],
      providerRequirements: ['secure-session'],
      offlineBehavior: 'Show cached watchlist alerts and queue threshold changes until sync.'
    },
    {
      route: '/search',
      screen: 'SearchScreen',
      primaryState: 'ready',
      emptyState: 'Search products by name or scan a barcode to match shelf prices.',
      dataDependencies: ['product_search', 'favorite_stores', 'weekly_basket', 'watchlist_alerts'],
      actions: ['open_product', 'add_to_weekly_basket', 'compare_stores', 'scan_barcode'],
      providerRequirements: ['secure-session'],
      offlineBehavior: 'Show cached search results and require sync before changing basket or watchlist state.'
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
      route: '/budget',
      screen: 'BudgetScreen',
      primaryState: 'ready',
      emptyState: 'Set a weekly budget to track planned basket and category spend.',
      dataDependencies: ['budget_summary', 'category_budgets', 'weekly_basket', 'basket_comparison'],
      actions: ['set_weekly_budget', 'review_category_budgets', 'review_receipts'],
      providerRequirements: ['secure-session'],
      offlineBehavior: 'Show cached budget totals and queue budget edits until sync is available.'
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

export type MobilePrivacyScreenInput = {
  userId: string;
  authenticated: boolean;
  networkOnline: boolean;
  confirmedDestructiveAction?: boolean;
  receiptImageRetentionDays?: number;
};

export type MobilePrivacyViewModel = {
  userId: string;
  controlCount: number;
  blockerCount: number;
  exportSectionCount: number;
  controls: Array<{ label: string; detail: string; state: string }>;
  requests: Array<{
    requestType: MobilePrivacyRequestType;
    label: string;
    status: 'ready' | 'blocked';
    confirmationRequired: boolean;
    blockerCount: number;
    actionLabels: string[];
    exportSectionCount: number;
  }>;
  actions: MobilePrivacyRequestPlan['actions'];
};

function privacyRequestLabel(requestType: MobilePrivacyRequestType): string {
  if (requestType === 'export_data') return 'Data export';
  if (requestType === 'delete_account') return 'Delete account';
  if (requestType === 'ad_privacy') return 'Ad privacy';
  return 'Receipt retention';
}

function privacyActionLabel(action: MobilePrivacyRequestPlan['actions'][number]): string {
  if (action === 'reauthenticate') return 'Reauthenticate';
  if (action === 'retry_online') return 'Retry online';
  if (action === 'download_export') return 'Download export';
  if (action === 'confirm_account_deletion') return 'Confirm deletion';
  if (action === 'open_ad_privacy_controls') return 'Open ad controls';
  return 'Schedule cleanup';
}

export function createMobilePrivacyViewModel(input: MobilePrivacyScreenInput): MobilePrivacyViewModel {
  const requestTypes: MobilePrivacyRequestType[] = ['export_data', 'delete_account', 'ad_privacy', 'receipt_retention'];
  const plans = requestTypes.map((requestType) => buildMobilePrivacyRequestPlan({ ...input, requestType }));
  const actions = [...new Set(plans.flatMap((plan) => plan.actions))];

  return {
    userId: input.userId,
    controlCount: mobilePrivacyControls.length,
    blockerCount: plans.reduce((total, plan) => total + plan.blockers.length, 0),
    exportSectionCount: plans.reduce((total, plan) => total + plan.exportSections.length, 0),
    controls: mobilePrivacyControls.map((control) => ({ ...control })),
    requests: plans.map((plan) => ({
      requestType: plan.requestType,
      label: privacyRequestLabel(plan.requestType),
      status: plan.blockers.length > 0 ? 'blocked' : 'ready',
      confirmationRequired: plan.confirmationRequired,
      blockerCount: plan.blockers.length,
      actionLabels: plan.actions.map(privacyActionLabel),
      exportSectionCount: plan.exportSections.length
    })),
    actions
  };
}

export function composeMobilePrivacyScreen(input: MobilePrivacyScreenInput): MobileScreenComponent {
  const viewModel = createMobilePrivacyViewModel(input);

  return {
    type: 'screen',
    key: `privacy:${viewModel.userId}`,
    title: 'Privacy',
    state: 'ready',
    children: [
      {
        type: 'section',
        key: 'summary',
        title: 'Summary',
        children: [
          { type: 'metric', key: 'controls', label: 'Controls', value: String(viewModel.controlCount), tone: 'neutral' },
          { type: 'metric', key: 'blockers', label: 'Blockers', value: String(viewModel.blockerCount), tone: viewModel.blockerCount > 0 ? 'warning' : 'positive' },
          { type: 'metric', key: 'export-sections', label: 'Export sections', value: String(viewModel.exportSectionCount), tone: viewModel.exportSectionCount > 0 ? 'positive' : 'neutral' }
        ]
      },
      {
        type: 'section',
        key: 'controls',
        title: 'Controls',
        children: viewModel.controls.map((control) => ({
          type: 'row',
          key: `privacy-control:${control.label.toLowerCase().replaceAll(' ', '-')}`,
          label: control.label,
          value: `${control.state}: ${control.detail}`
        }))
      },
      {
        type: 'section',
        key: 'requests',
        title: 'Requests',
        children: viewModel.requests.map((request) => ({
          type: 'row',
          key: `privacy-request:${request.requestType}`,
          label: request.label,
          value: `${request.status}, ${request.blockerCount} blockers, ${request.exportSectionCount} export sections`
        }))
      },
      {
        type: 'section',
        key: 'actions',
        title: 'Actions',
        children: viewModel.actions.map((action, index) => ({
          type: 'action',
          key: action,
          action,
          label: privacyActionLabel(action),
          primary: index === 0
        }))
      }
    ]
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
