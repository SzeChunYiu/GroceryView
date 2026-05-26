import { createHash } from 'node:crypto';

export const priceQueryCacheTtlSeconds = 300;

export type CacheQueryValue = string | number | boolean | null | undefined | readonly (string | number | boolean | null | undefined)[];

export type RedisCacheClient = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
};

export type CacheStructuredLogger = {
  info(payload: Record<string, unknown>, message?: string): void;
  warn?(payload: Record<string, unknown>, message?: string): void;
};

function normalizeCacheValue(value: CacheQueryValue): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined && item !== null && item !== '')
      .map(String)
      .sort();
  }
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

export function buildApiCacheKey(prefix: string, parts: Record<string, CacheQueryValue>) {
  const normalized = Object.entries(parts)
    .map(([key, value]) => [key, normalizeCacheValue(value)] as const)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  const digest = createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 32);

  return `${prefix}:${digest}`;
}

export async function withRedisCache<T>(input: {
  cacheKey: string;
  load: () => Promise<T>;
  logger?: CacheStructuredLogger;
  redisClient?: RedisCacheClient | null;
  route: string;
  ttlSeconds?: number;
}) {
  const ttlSeconds = input.ttlSeconds ?? priceQueryCacheTtlSeconds;
  if (!input.redisClient) {
    input.logger?.info({ route: input.route, cache: 'bypass', cacheKey: input.cacheKey }, 'redis cache bypass');
    return input.load();
  }

  const cached = await input.redisClient.get(input.cacheKey);
  if (cached) {
    input.logger?.info({ route: input.route, cache: 'hit', cacheKey: input.cacheKey }, 'redis cache hit');
    return JSON.parse(cached) as T;
  }

  input.logger?.info({ route: input.route, cache: 'miss', cacheKey: input.cacheKey }, 'redis cache miss');
  const result = await input.load();
  await input.redisClient.setex(input.cacheKey, ttlSeconds, JSON.stringify(result));

  return result;
}
