export type MobileMvpRouteId =
  | 'today'
  | 'stores'
  | 'watchlist'
  | 'search'
  | 'product'
  | 'product-terminal'
  | 'basket'
  | 'budget'
  | 'barcode-scan'
  | 'receipt-scan'
  | 'profile'
  | 'household'
  | 'privacy'
  | 'review-queue'
  | 'camera-placeholder'
  | 'notifications-placeholder';

export type MobileMvpRoutePath =
  | '/today'
  | '/stores'
  | '/watchlist'
  | '/search'
  | '/products/[id]'
  | '/products/[id]/terminal'
  | '/basket'
  | '/budget'
  | '/scan/barcode'
  | '/scan/receipt'
  | '/profile'
  | '/household'
  | '/privacy'
  | '/review-queue'
  | '/scan/camera-placeholder'
  | '/profile/notifications-placeholder';

export type MobileRouteParam = {
  name: string;
  required: boolean;
  source: 'path' | 'query';
};

export type MobileMvpRoute = {
  id: MobileMvpRouteId;
  path: MobileMvpRoutePath;
  screen: string;
  title: string;
  tab: 'today' | 'stores' | 'basket' | 'scan' | 'profile';
  params: MobileRouteParam[];
  requiresAuth: boolean;
  preloadQueryIds: Array<'today' | 'stores' | 'watchlist' | 'search' | 'product' | 'productTerminal' | 'basket' | 'budget' | 'barcodeScan' | 'receiptReview' | 'reviewQueue'>;
  placeholderFor?: 'camera' | 'notifications';
};

export type MobileRouteManifest = {
  router: 'expo-router';
  initialRoute: '/today';
  requiredRoutes: MobileMvpRoute[];
  placeholderRoutes: MobileMvpRoute[];
  deepLinkPrefixes: string[];
};

const routes: MobileMvpRoute[] = [
  {
    id: 'today',
    path: '/today',
    screen: 'TodayScreen',
    title: 'Today',
    tab: 'today',
    params: [],
    requiresAuth: true,
    preloadQueryIds: ['today', 'basket', 'budget']
  },
  {
    id: 'stores',
    path: '/stores',
    screen: 'StoresScreen',
    title: 'Stores',
    tab: 'stores',
    params: [{ name: 'selectedStoreId', required: false, source: 'query' }],
    requiresAuth: true,
    preloadQueryIds: ['stores', 'basket']
  },
  {
    id: 'watchlist',
    path: '/watchlist',
    screen: 'WatchlistScreen',
    title: 'Watchlist',
    tab: 'today',
    params: [],
    requiresAuth: true,
    preloadQueryIds: ['watchlist', 'product']
  },
  {
    id: 'search',
    path: '/search',
    screen: 'SearchScreen',
    title: 'Search',
    tab: 'today',
    params: [{ name: 'q', required: false, source: 'query' }],
    requiresAuth: true,
    preloadQueryIds: ['search']
  },
  {
    id: 'product',
    path: '/products/[id]',
    screen: 'ProductScreen',
    title: 'Product',
    tab: 'today',
    params: [{ name: 'id', required: true, source: 'path' }],
    requiresAuth: true,
    preloadQueryIds: ['product']
  },
  {
    id: 'product-terminal',
    path: '/products/[id]/terminal',
    screen: 'ProductPriceTerminalScreen',
    title: 'Product terminal',
    tab: 'today',
    params: [{ name: 'id', required: true, source: 'path' }],
    requiresAuth: true,
    preloadQueryIds: ['product', 'productTerminal']
  },
  {
    id: 'basket',
    path: '/basket',
    screen: 'BasketScreen',
    title: 'Basket',
    tab: 'basket',
    params: [],
    requiresAuth: true,
    preloadQueryIds: ['basket', 'budget']
  },
  {
    id: 'budget',
    path: '/budget',
    screen: 'BudgetScreen',
    title: 'Budget',
    tab: 'basket',
    params: [],
    requiresAuth: true,
    preloadQueryIds: ['budget', 'basket']
  },
  {
    id: 'barcode-scan',
    path: '/scan/barcode',
    screen: 'BarcodeScanScreen',
    title: 'Barcode scan',
    tab: 'scan',
    params: [{ name: 'code', required: false, source: 'query' }],
    requiresAuth: true,
    preloadQueryIds: ['barcodeScan', 'product']
  },
  {
    id: 'receipt-scan',
    path: '/scan/receipt',
    screen: 'ReceiptScanScreen',
    title: 'Receipt scan',
    tab: 'scan',
    params: [{ name: 'receiptId', required: false, source: 'query' }],
    requiresAuth: true,
    preloadQueryIds: ['receiptReview', 'budget', 'basket']
  },
  {
    id: 'profile',
    path: '/profile',
    screen: 'ProfileScreen',
    title: 'Profile',
    tab: 'profile',
    params: [],
    requiresAuth: true,
    preloadQueryIds: ['budget', 'basket']
  },
  {
    id: 'household',
    path: '/household',
    screen: 'HouseholdScreen',
    title: 'Household',
    tab: 'profile',
    params: [],
    requiresAuth: true,
    preloadQueryIds: ['basket', 'budget']
  },
  {
    id: 'privacy',
    path: '/privacy',
    screen: 'PrivacyScreen',
    title: 'Privacy',
    tab: 'profile',
    params: [],
    requiresAuth: true,
    preloadQueryIds: []
  },
  {
    id: 'review-queue',
    path: '/review-queue',
    screen: 'HumanReviewQueueScreen',
    title: 'Review queue',
    tab: 'profile',
    params: [],
    requiresAuth: true,
    preloadQueryIds: ['reviewQueue']
  },
  {
    id: 'camera-placeholder',
    path: '/scan/camera-placeholder',
    screen: 'CameraProviderPlaceholderScreen',
    title: 'Camera setup',
    tab: 'scan',
    params: [],
    requiresAuth: true,
    preloadQueryIds: [],
    placeholderFor: 'camera'
  },
  {
    id: 'notifications-placeholder',
    path: '/profile/notifications-placeholder',
    screen: 'NotificationProviderPlaceholderScreen',
    title: 'Notification setup',
    tab: 'profile',
    params: [],
    requiresAuth: true,
    preloadQueryIds: [],
    placeholderFor: 'notifications'
  }
];

function cloneRoute(route: MobileMvpRoute): MobileMvpRoute {
  return {
    ...route,
    params: route.params.map((param) => ({ ...param })),
    preloadQueryIds: [...route.preloadQueryIds]
  };
}

export function buildMobileRouteManifest(): MobileRouteManifest {
  return {
    router: 'expo-router',
    initialRoute: '/today',
    requiredRoutes: routes.filter((route) => !route.placeholderFor).map(cloneRoute),
    placeholderRoutes: routes.filter((route) => route.placeholderFor).map(cloneRoute),
    deepLinkPrefixes: ['groceryview://', 'https://app.groceryview.se']
  };
}

export function findMobileRoute(path: MobileMvpRoutePath): MobileMvpRoute | null {
  const route = routes.find((candidate) => candidate.path === path);
  return route ? cloneRoute(route) : null;
}

export function buildMobileDeepLink(path: MobileMvpRoutePath, params: Record<string, string> = {}): string {
  const route = findMobileRoute(path);
  if (!route) throw new Error(`Unknown mobile route: ${path}`);

  let resolvedPath = route.path as string;
  for (const param of route.params.filter((candidate) => candidate.source === 'path')) {
    const value = params[param.name]?.trim();
    if (!value && param.required) throw new Error(`${param.name} is required.`);
    resolvedPath = resolvedPath.replace(`[${param.name}]`, encodeURIComponent(value ?? ''));
  }

  const query = route.params
    .filter((param) => param.source === 'query')
    .flatMap<[string, string]>((param) => {
      const value = params[param.name]?.trim();
      return value ? [[param.name, value]] : [];
    });
  const suffix = query.length > 0 ? `?${new URLSearchParams(query).toString()}` : '';
  return `groceryview://${resolvedPath.replace(/^\//, '')}${suffix}`;
}
