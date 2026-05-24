export const PRICE_QUERY_CACHE_TTL_SECONDS = 5 * 60;

export type PriceQueryCacheRoute = 'items:price-history' | 'compare:store-prices';

export type PriceQueryCachePolicy = {
  route: PriceQueryCacheRoute;
  ttlSeconds: number;
  keyPrefix: string;
};

export const priceQueryCachePolicies = {
  itemPriceHistory: {
    route: 'items:price-history',
    ttlSeconds: PRICE_QUERY_CACHE_TTL_SECONDS,
    keyPrefix: 'price-history'
  },
  storeComparison: {
    route: 'compare:store-prices',
    ttlSeconds: PRICE_QUERY_CACHE_TTL_SECONDS,
    keyPrefix: 'store-comparison'
  }
} as const satisfies Record<string, PriceQueryCachePolicy>;

type RedisCacheClient = {
  get(key: string): Promise<string | null>;
  set?: (key: string, value: string, mode: 'EX', ttlSeconds: number) => Promise<unknown>;
  setEx?: (key: string, ttlSeconds: number, value: string) => Promise<unknown>;
};

export function priceQueryCacheKey(policy: PriceQueryCachePolicy, parts: readonly string[]) {
  return [policy.keyPrefix, ...parts.map((part) => part.trim().toLowerCase())].join(':');
}

export async function cachedPriceQuery<T>(
  redis: RedisCacheClient | null | undefined,
  key: string,
  load: () => Promise<T>,
  ttlSeconds = PRICE_QUERY_CACHE_TTL_SECONDS
): Promise<T> {
  if (!redis) {
    return load();
  }

  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const value = await load();
  const serialized = JSON.stringify(value);
  if (redis.setEx) {
    await redis.setEx(key, ttlSeconds, serialized);
  } else if (redis.set) {
    await redis.set(key, serialized, 'EX', ttlSeconds);
  }
  return value;
}
