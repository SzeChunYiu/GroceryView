import {
  buildApiCacheKey,
  priceQueryCacheTtlSeconds,
  withRedisCache,
  type CacheStructuredLogger,
  type RedisCacheClient
} from '../lib/cache.js';

export const compareRoutes = {
  controllerPath: 'compare',
  itemComparison: 'compare/items',
  webItemComparisonPage: '/compare-items',
  description: 'Compare up to four grocery items by nutrition, storePrices, and trendPoints evidence.',
  queryParam: 'items',
  loyaltyCardsQueryParam: 'loyaltyCards',
  maxItems: 4,
  responseFields: ['items', 'nutrition', 'storePrices', 'loyaltyCards', 'trendPoints', 'missingItemIds', 'truncatedItemIds'],
  nutrition: 'nutrition',
  storePrices: 'storePrices',
  loyaltyCards: 'loyaltyCards',
  loyaltyPriceFields: ['loyaltyCardId', 'loyaltyCardLabel', 'loyaltyPrice'],
  trendPoints: 'trendPoints',
  basketStoreSort: 'total_basket_cost',
  basketWinnerHighlight: 'Cheapest',
  storeComparisonCacheTtlSeconds: priceQueryCacheTtlSeconds,
  storeComparisonCacheKeyPrefix: 'compare:store-prices:v1'
} as const;

export function buildCompareStoreComparisonCacheKey(input: {
  itemIds: readonly string[];
  loyaltyCards?: readonly string[];
  sort?: string;
}) {
  return buildApiCacheKey(compareRoutes.storeComparisonCacheKeyPrefix, {
    itemIds: input.itemIds,
    loyaltyCards: input.loyaltyCards,
    sort: input.sort ?? compareRoutes.basketStoreSort
  });
}

export async function withCompareStoreRedisCache<T>(input: {
  itemIds: readonly string[];
  load: () => Promise<T>;
  logger?: CacheStructuredLogger;
  loyaltyCards?: readonly string[];
  redisClient?: RedisCacheClient | null;
  sort?: string;
}) {
  const cacheKey = buildCompareStoreComparisonCacheKey({
    itemIds: input.itemIds,
    loyaltyCards: input.loyaltyCards,
    sort: input.sort
  });

  return withRedisCache({
    cacheKey,
    load: input.load,
    logger: input.logger,
    redisClient: input.redisClient,
    route: compareRoutes.itemComparison,
    ttlSeconds: compareRoutes.storeComparisonCacheTtlSeconds
  });
}
