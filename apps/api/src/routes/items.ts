import {
  buildApiCacheKey,
  priceQueryCacheTtlSeconds,
  withRedisCache,
  type CacheQueryValue,
  type CacheStructuredLogger,
  type RedisCacheClient
} from '../lib/cache.js';

export const itemsRoutes = {
  controllerPath: 'items',
  detailAlias: 'items/:id',
  seasonalSalePattern: 'items/:id/seasonal-sale-pattern',
  substitutionSuggestions: 'items/:id/substitution-suggestions',
  holidayWindow: 'midsommar',
  description: 'Item detail, multi-store priceComparison metadata, seasonalSalePattern metadata, substitutionSuggestions, and localized product names backed by explicit current price evidence.',
  queryParams: ['holiday', 'locale'],
  localeHeader: 'x-groceryview-locale',
  localeCookie: 'NEXT_LOCALE',
  localizedProductNameColumns: ['name_sv', 'name_en'],
  localizedResponseFields: ['canonicalName', 'productName'],
  maxSuggestions: 3,
  responseFields: [
    'available',
    'holiday',
    'hint',
    'holidayWindow',
    'observedSeasonCount',
    'qualifiedSeasonCount',
    'evidenceLabel',
    'trigger',
    'priceComparison',
    'stores',
    'cheapestStore',
    'suggestions',
    'currentPrice',
    'savingsPercent',
    'guardrail'
  ],
  priceHistoryCacheTtlSeconds: priceQueryCacheTtlSeconds,
  priceHistoryCacheKeyPrefix: 'items:price-history:v1',
  guardrail: 'No seasonal sale hint is returned without repeated explicit historical holiday-window price evidence. Substitution suggestions only return same-category, in-stock items with a verified lower current price.'
} as const;

export type ItemsPriceHistoryCacheQueryParams = Record<string, CacheQueryValue>;

export function buildItemsPriceHistoryCacheKey(productId: string, queryParams: ItemsPriceHistoryCacheQueryParams) {
  return buildApiCacheKey(itemsRoutes.priceHistoryCacheKeyPrefix, { productId, ...queryParams });
}

export async function withItemsPriceHistoryRedisCache<T>(input: {
  load: () => Promise<T>;
  logger?: CacheStructuredLogger;
  productId: string;
  queryParams: ItemsPriceHistoryCacheQueryParams;
  redisClient?: RedisCacheClient | null;
}) {
  const cacheKey = buildItemsPriceHistoryCacheKey(input.productId, input.queryParams);

  return withRedisCache({
    cacheKey,
    load: input.load,
    logger: input.logger,
    redisClient: input.redisClient,
    route: itemsRoutes.detailAlias,
    ttlSeconds: itemsRoutes.priceHistoryCacheTtlSeconds
  });
}
