import { buildWatchlistAlerts, calculateDealScore, planNotifications, type NotificationPreferences, type WatchlistItem, type WatchlistPriceType, type WatchlistProductSnapshot } from '@groceryview/core';
import { chainPriceRows, topChainSpreads } from '@/lib/verified-data';

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type WatchlistAlert = ReturnType<typeof buildWatchlistAlerts>[number];

type PricedChainRow = ReturnType<typeof chainPriceRows>[number] & { price: number };
type VerifiedWatchlistProduct = WatchlistProductSnapshot & {
  source: string;
};

const notificationNow = '2026-05-22T10:00:00.000Z';
const notificationPreferences: NotificationPreferences = {
  channels: ['email', 'push'],
  enabledTypes: ['target_price'],
  quietHours: { startHour: 21, endHour: 7, timezone: 'Europe/Stockholm' }
};

const chainDisplayNames: Record<string, string> = {
  willys: 'Willys',
  hemkop: 'Hemköp'
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundSek(value: number) {
  return Math.round(value * 100) / 100;
}

function watchlistPriceTypeFor(row: PricedChainRow): WatchlistPriceType {
  return typeof row.savings === 'number' && row.savings > 0 ? 'promotion' : 'shelf';
}

export function confidenceForCoverage(priceRows: number, alertCount: number): ConfidenceLevel {
  if (priceRows >= 6 && alertCount > 0) return 'high';
  if (priceRows > 0 && alertCount > 0) return 'medium';
  return 'low';
}

function notificationEventForAlert(alert: WatchlistAlert) {
  return {
    type: 'target_price' as const,
    title: alert.productName,
    body: alert.message,
    priority: alert.severity === 'urgent' ? 'high' as const : 'normal' as const
  };
}

export const watchlistSourceRows = topChainSpreads
  .map((product) => {
    const pricedRows = chainPriceRows(product)
      .filter((row): row is PricedChainRow => typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0)
      .sort((left, right) => left.price - right.price || String(left.chain).localeCompare(String(right.chain), 'sv'));
    const cheapest = pricedRows[0];
    if (!cheapest) return null;
    const dealScore = calculateDealScore({
      currentCityPercentile: clamp(100 - product.spreadPct * 2, 0, 100),
      knownPromoHistoryPercentile: clamp(100 - product.spreadPct * 2, 0, 100),
      equivalentUnitPricePercentile: product.inChains.length > 1 ? 0 : 50,
      discountDepthPercent: product.spreadPct,
      sourceConfidence: clamp(product.inChains.length / 2, 0, 1)
    });
    return { product, pricedRows, cheapest, dealScore };
  })
  .filter((row): row is NonNullable<typeof row> => row !== null)
  .slice(0, 4);

const watchlistItems: WatchlistItem[] = watchlistSourceRows.map(({ product, cheapest, dealScore }) => ({
  productId: product.slug,
  targetPrice: roundSek(cheapest.price * 1.02),
  alertDealScoreAt: Math.max(50, Math.min(90, dealScore)),
  favoriteStoresOnly: false,
  allowedPriceTypes: [watchlistPriceTypeFor(cheapest)]
}));

const watchlistProducts: VerifiedWatchlistProduct[] = watchlistSourceRows.map(({ product, pricedRows, cheapest, dealScore }) => ({
  productId: product.slug,
  productName: product.name,
  bestPrice: cheapest.price,
  bestStoreId: `${cheapest.chain}-online-catalog`,
  bestPriceType: watchlistPriceTypeFor(cheapest),
  prices: pricedRows.map((row) => ({
    storeId: `${row.chain}-online-catalog`,
    storeName: `${chainDisplayNames[row.chain] ?? row.chain} online catalog`,
    price: row.price,
    priceType: watchlistPriceTypeFor(row)
  })),
  dealScore,
  isNew52WeekLow: product.spreadPct >= 20,
  source: `${pricedRows.length} verified Axfood chain price row${pricedRows.length === 1 ? '' : 's'} · ${product.inChains.join(' + ')}`
}));

export const watchlistAlertInputs: {
  favoriteStoreIds: string[];
  watchlist: WatchlistItem[];
  products: VerifiedWatchlistProduct[];
} = {
  favoriteStoreIds: Array.from(new Set(watchlistProducts.map((product) => product.bestStoreId))),
  watchlist: watchlistItems,
  products: watchlistProducts
};

export function buildWatchlistAlertBoard(inputs = watchlistAlertInputs) {
  const watchlistAlerts = buildWatchlistAlerts(inputs)
    .filter((alert) => alert.type === 'target_price');
  const plannedNotifications = planNotifications({
    now: notificationNow,
    preferences: notificationPreferences,
    events: watchlistAlerts.map(notificationEventForAlert)
  });
  const watchedProducts = inputs.watchlist.length;
  const eligiblePriceRows = inputs.products.reduce((sum, product) => sum + (product.prices?.length ?? 0), 0);

  return {
    inputs,
    watchlistAlerts,
    plannedNotifications,
    watchedProducts,
    eligiblePriceRows,
    coverageConfidence: confidenceForCoverage(eligiblePriceRows, watchlistAlerts.length)
  };
}

export const watchlistAlertBoard = buildWatchlistAlertBoard();

export function productForAlert(productId: string, board = watchlistAlertBoard) {
  return board.inputs.products.find((product) => product.productId === productId);
}

export function watchlistItemForAlert(productId: string, board = watchlistAlertBoard) {
  return board.inputs.watchlist.find((item) => item.productId === productId);
}

export function priceSource(productId: string, board = watchlistAlertBoard) {
  return productForAlert(productId, board)?.source ?? 'visible price row';
}

export function priceRowCount(productId: string, board = watchlistAlertBoard) {
  return productForAlert(productId, board)?.prices?.length ?? 0;
}

export function confidenceForProduct(productId: string, board = watchlistAlertBoard): ConfidenceLevel {
  const product = productForAlert(productId, board);
  const rows = product?.prices?.length ?? 0;
  if (!product || rows === 0) return 'low';
  if (rows >= 2) return 'high';
  return 'medium';
}
