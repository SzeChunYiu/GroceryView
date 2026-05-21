export type MobileQueryId =
  | 'today'
  | 'stores'
  | 'watchlist'
  | 'search'
  | 'product'
  | 'productTerminal'
  | 'basket'
  | 'budget'
  | 'barcodeScan'
  | 'receiptReview'
  | 'reviewQueue';

export type MobileScreenRoute =
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
  | '/review-queue';

export type MobileQueryDefinition = {
  id: MobileQueryId;
  route: MobileScreenRoute;
  queryKey: readonly string[];
  staleTimeMs: number;
  gcTimeMs: number;
  persist: boolean;
  networkMode: 'online' | 'offlineFirst';
  invalidatesOn: Array<'favorite_store_changed' | 'basket_changed' | 'budget_changed' | 'watchlist_changed' | 'receipt_synced' | 'barcode_reported' | 'review_decision_submitted'>;
};

export type MobilePersistedCachePlan = {
  storageKey: string;
  schemaVersion: number;
  userPartitionKey: string;
  hydrateOrder: MobileQueryId[];
  persistedQueryIds: MobileQueryId[];
  maxPersistedAgeMs: number;
  purgeOnSignOut: boolean;
  redactBeforePersist: Array<'receipt_images' | 'auth_tokens' | 'precise_location'>;
};

export type MobileQueryKeyInput =
  | { id: 'today'; userId: string }
  | { id: 'stores'; userId: string }
  | { id: 'watchlist'; userId: string }
  | { id: 'search'; userId: string; query: string }
  | { id: 'product'; userId: string; productId: string }
  | { id: 'productTerminal'; userId: string; productId: string }
  | { id: 'basket'; userId: string }
  | { id: 'budget'; userId: string }
  | { id: 'barcodeScan'; userId: string; code: string }
  | { id: 'receiptReview'; userId: string; receiptId: string }
  | { id: 'reviewQueue'; userId: string };

const minute = 60_000;
const hour = 60 * minute;

const definitions: MobileQueryDefinition[] = [
  {
    id: 'today',
    route: '/today',
    queryKey: ['mobile', 'today'],
    staleTimeMs: 5 * minute,
    gcTimeMs: 6 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['favorite_store_changed', 'basket_changed', 'budget_changed', 'watchlist_changed', 'receipt_synced']
  },
  {
    id: 'stores',
    route: '/stores',
    queryKey: ['mobile', 'stores'],
    staleTimeMs: 5 * minute,
    gcTimeMs: 12 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['favorite_store_changed', 'basket_changed', 'watchlist_changed', 'receipt_synced']
  },
  {
    id: 'watchlist',
    route: '/watchlist',
    queryKey: ['mobile', 'watchlist'],
    staleTimeMs: 2 * minute,
    gcTimeMs: 12 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['watchlist_changed', 'favorite_store_changed', 'receipt_synced']
  },
  {
    id: 'search',
    route: '/search',
    queryKey: ['mobile', 'search'],
    staleTimeMs: 2 * minute,
    gcTimeMs: 2 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['favorite_store_changed']
  },
  {
    id: 'product',
    route: '/products/[id]',
    queryKey: ['mobile', 'product'],
    staleTimeMs: 5 * minute,
    gcTimeMs: 12 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['favorite_store_changed', 'watchlist_changed']
  },
  {
    id: 'productTerminal',
    route: '/products/[id]/terminal',
    queryKey: ['mobile', 'product', 'terminal'],
    staleTimeMs: 2 * minute,
    gcTimeMs: 12 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['favorite_store_changed', 'watchlist_changed', 'receipt_synced']
  },
  {
    id: 'basket',
    route: '/basket',
    queryKey: ['mobile', 'basket'],
    staleTimeMs: minute,
    gcTimeMs: 24 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['basket_changed', 'favorite_store_changed', 'receipt_synced']
  },
  {
    id: 'budget',
    route: '/budget',
    queryKey: ['mobile', 'budget'],
    staleTimeMs: minute,
    gcTimeMs: 24 * hour,
    persist: true,
    networkMode: 'offlineFirst',
    invalidatesOn: ['budget_changed', 'basket_changed', 'receipt_synced']
  },
  {
    id: 'barcodeScan',
    route: '/scan/barcode',
    queryKey: ['mobile', 'scan', 'barcode'],
    staleTimeMs: minute,
    gcTimeMs: 2 * hour,
    persist: false,
    networkMode: 'offlineFirst',
    invalidatesOn: ['barcode_reported', 'favorite_store_changed']
  },
  {
    id: 'receiptReview',
    route: '/scan/receipt',
    queryKey: ['mobile', 'scan', 'receipt'],
    staleTimeMs: minute,
    gcTimeMs: 2 * hour,
    persist: false,
    networkMode: 'offlineFirst',
    invalidatesOn: ['receipt_synced', 'budget_changed', 'basket_changed', 'review_decision_submitted']
  },
  {
    id: 'reviewQueue',
    route: '/review-queue',
    queryKey: ['mobile', 'review-queue'],
    staleTimeMs: minute,
    gcTimeMs: hour,
    persist: false,
    networkMode: 'online',
    invalidatesOn: ['review_decision_submitted', 'barcode_reported', 'receipt_synced']
  }
];

function normalizeSegment(value: string): string {
  return value.trim().toLowerCase();
}

export function buildMobileQueryKey(input: MobileQueryKeyInput): readonly string[] {
  const userSegment = normalizeSegment(input.userId);
  if (!userSegment) throw new Error('userId is required.');

  if (input.id === 'search') return ['mobile', userSegment, 'search', normalizeSegment(input.query)];
  if (input.id === 'product' || input.id === 'productTerminal') {
    const productSegment = normalizeSegment(input.productId);
    if (!productSegment) throw new Error('productId is required.');
    if (input.id === 'productTerminal') return ['mobile', userSegment, 'product', productSegment, 'terminal'];
    return ['mobile', userSegment, 'product', productSegment];
  }
  if (input.id === 'barcodeScan') {
    const codeSegment = normalizeSegment(input.code);
    if (!codeSegment) throw new Error('code is required.');
    return ['mobile', userSegment, 'scan', 'barcode', codeSegment];
  }
  if (input.id === 'receiptReview') {
    const receiptSegment = normalizeSegment(input.receiptId);
    if (!receiptSegment) throw new Error('receiptId is required.');
    return ['mobile', userSegment, 'scan', 'receipt', receiptSegment];
  }
  if (input.id === 'reviewQueue') return ['mobile', userSegment, 'review-queue'];

  return ['mobile', userSegment, input.id];
}

export function buildMobileQueryRegistry(): MobileQueryDefinition[] {
  return definitions.map((definition) => ({
    ...definition,
    queryKey: [...definition.queryKey],
    invalidatesOn: [...definition.invalidatesOn]
  }));
}

export function buildMobilePersistedCachePlan(userId: string): MobilePersistedCachePlan {
  const userSegment = normalizeSegment(userId);
  if (!userSegment) throw new Error('userId is required.');

  return {
    storageKey: 'groceryview.mobile.query-cache.v1',
    schemaVersion: 1,
    userPartitionKey: `user:${userSegment}`,
    hydrateOrder: ['today', 'stores', 'watchlist', 'basket', 'budget', 'search', 'product', 'productTerminal'],
    persistedQueryIds: definitions.filter((definition) => definition.persist).map((definition) => definition.id),
    maxPersistedAgeMs: 24 * hour,
    purgeOnSignOut: true,
    redactBeforePersist: ['receipt_images', 'auth_tokens', 'precise_location']
  };
}
