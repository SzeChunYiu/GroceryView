import { createHash } from 'node:crypto';

export const screenerRoutes = {
  controllerPath: 'screener',
  list: 'screener',
  description: 'Deal screener rows with minimum discount filtering computed from price_history observations',
  minDiscountParam: 'min_discount',
  minDiscountRange: [0, 50],
  defaultLimit: 25,
  maxLimit: 50,
  sourceCte: 'price_history',
  sourceTable: 'observations',
  discountComputation: 'discountPercent = (previousPrice - latestPrice) / previousPrice * 100 from consecutive price_history rows',
  queryParams: ['min_discount', 'category', 'limit'],
  responseFields: [
    'productId',
    'productSlug',
    'productName',
    'category',
    'latestPrice',
    'previousPrice',
    'savingsAmount',
    'discountPercent',
    'latestObservedAt'
  ],
  cacheTtlSeconds: 60,
  cacheKeyPrefix: 'screener:v1'
} as const;

export type ScreenerCacheQueryParams = Record<string, string | number | boolean | null | undefined>;

export type ScreenerIoredisClient = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
};

export type ScreenerStructuredLogger = {
  info(payload: Record<string, unknown>, message?: string): void;
};

export function buildScreenerCacheKey(queryParams: ScreenerCacheQueryParams) {
  const normalized = Object.entries(queryParams)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right));
  const digest = createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 24);

  return `${screenerRoutes.cacheKeyPrefix}:${digest}`;
}

export async function withScreenerRedisCache<T>(input: {
  ioredisClient: ScreenerIoredisClient;
  queryParams: ScreenerCacheQueryParams;
  logger: ScreenerStructuredLogger;
  load: () => Promise<T>;
}) {
  const cacheKey = buildScreenerCacheKey(input.queryParams);
  const cached = await input.ioredisClient.get(cacheKey);

  if (cached) {
    input.logger.info({ route: screenerRoutes.list, cache: 'hit', cacheKey }, 'screener cache hit');
    return JSON.parse(cached) as T;
  }

  input.logger.info({ route: screenerRoutes.list, cache: 'miss', cacheKey }, 'screener cache miss');
  const result = await input.load();
  await input.ioredisClient.setex(cacheKey, screenerRoutes.cacheTtlSeconds, JSON.stringify(result));

  return result;
}
