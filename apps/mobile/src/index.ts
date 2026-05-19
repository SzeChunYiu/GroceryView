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

export function createMobileViewModel(userId: string, api = createGroceryViewApi()): MobileViewModel {
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

export function buildScanResult(request: ScanRequest, api = createGroceryViewApi()): ScanResult {
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
  path: '/today' | '/stores' | '/basket' | '/scan/barcode' | '/scan/receipt' | '/profile' | '/household' | '/privacy';
  screen: string;
  purpose: string;
  requiresAuth: boolean;
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
      { path: '/privacy', screen: 'PrivacyScreen', purpose: 'Data export, deletion, and ad privacy controls', requiresAuth: true }
    ],
    requiredDeviceCapabilities: ['camera', 'secure-storage', 'push-notifications'],
    buildProfiles: {
      preview: { distribution: 'internal', channel: 'preview' },
      production: { distribution: 'store', channel: 'production' }
    },
    failClosedWithoutProviders: true
  };
}
