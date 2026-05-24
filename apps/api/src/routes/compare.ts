import { redisPriceQueryCache } from '../lib/cache';

export const compareRoutes = {
  controllerPath: 'compare',
  itemComparison: 'compare/items',
  webItemComparisonPage: '/compare-items',
  cache: {
    storeComparison: {
      provider: redisPriceQueryCache.provider,
      ttlSeconds: redisPriceQueryCache.ttlSeconds,
      keyScope: 'store-comparison'
    }
  },
  description: 'Compare up to four grocery items by nutrition, storePrices, and trendPoints evidence.',
  queryParam: 'items',
  maxItems: 4,
  responseFields: ['items', 'nutrition', 'storePrices', 'trendPoints', 'missingItemIds', 'truncatedItemIds'],
  nutrition: 'nutrition',
  storePrices: 'storePrices',
  trendPoints: 'trendPoints',
  guardrail: 'Expensive store comparison price queries are keyed by sorted item ids and cached in Redis for 5 minutes.'
} as const;
