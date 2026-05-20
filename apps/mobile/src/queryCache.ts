export type MobileQueryId = 'today' | 'search' | 'product' | 'basket' | 'budget';

export type MobileScreenRoute = '/today' | '/search' | '/products/[id]' | '/basket' | '/budget';

export type MobileQueryDefinition = {
  id: MobileQueryId;
  route: MobileScreenRoute;
  queryKey: readonly string[];
  staleTimeMs: number;
  gcTimeMs: number;
  persist: boolean;
  networkMode: 'online' | 'offlineFirst';
  invalidatesOn: Array<'favorite_store_changed' | 'basket_changed' | 'budget_changed' | 'watchlist_changed' | 'receipt_synced'>;
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
  | { id: 'search'; userId: string; query: string }
  | { id: 'product'; userId: string; productId: string }
  | { id: 'basket'; userId: string }
  | { id: 'budget'; userId: string };

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
  }
];

function normalizeSegment(value: string): string {
  return value.trim().toLowerCase();
}

export function buildMobileQueryKey(input: MobileQueryKeyInput): readonly string[] {
  const userSegment = normalizeSegment(input.userId);
  if (!userSegment) throw new Error('userId is required.');

  if (input.id === 'search') return ['mobile', userSegment, 'search', normalizeSegment(input.query)];
  if (input.id === 'product') {
    const productSegment = normalizeSegment(input.productId);
    if (!productSegment) throw new Error('productId is required.');
    return ['mobile', userSegment, 'product', productSegment];
  }

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
    hydrateOrder: ['today', 'basket', 'budget', 'search', 'product'],
    persistedQueryIds: definitions.filter((definition) => definition.persist).map((definition) => definition.id),
    maxPersistedAgeMs: 24 * hour,
    purgeOnSignOut: true,
    redactBeforePersist: ['receipt_images', 'auth_tokens', 'precise_location']
  };
}
