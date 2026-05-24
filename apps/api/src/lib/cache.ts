export const PRICE_QUERY_CACHE_TTL_SECONDS = 5 * 60;

export type CacheKeyPart = string | number | boolean | null | undefined;

export function priceQueryCacheKey(scope: string, parts: CacheKeyPart[]) {
  const normalizedParts = parts
    .filter((part) => part !== undefined && part !== null)
    .map((part) => encodeURIComponent(String(part).trim().toLowerCase()));

  return ['groceryview', 'price-query', scope, ...normalizedParts].join(':');
}

export const redisPriceQueryCache = {
  provider: 'redis',
  ttlSeconds: PRICE_QUERY_CACHE_TTL_SECONDS,
  cacheHeaders: {
    hit: 'x-groceryview-cache-hit',
    ttl: 'x-groceryview-cache-ttl'
  },
  keyForPriceHistory: (itemId: string) => priceQueryCacheKey('price-history', [itemId]),
  keyForStoreComparison: (items: readonly string[]) => priceQueryCacheKey('store-comparison', [...items].sort())
} as const;
