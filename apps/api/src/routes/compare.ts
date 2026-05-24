export const compareRoutes = {
  controllerPath: 'compare',
  itemComparison: 'compare/items',
  webItemComparisonPage: '/compare-items',
  description: 'Compare up to four grocery items by nutrition, storePrices, and trendPoints evidence.',
  queryParam: 'items',
  maxItems: 4,
  responseFields: ['items', 'nutrition', 'storePrices', 'trendPoints', 'missingItemIds', 'truncatedItemIds'],
  nutrition: 'nutrition',
  storePrices: 'storePrices',
  trendPoints: 'trendPoints',
  storeComparisonCache: { keyPrefix: 'store-comparison', ttlSeconds: 300 },
} as const;
