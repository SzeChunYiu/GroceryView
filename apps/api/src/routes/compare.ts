export const compareRoutes = {
  controllerPath: 'compare',
  priceSnapshots: 'compare',
  itemComparison: 'compare/items',
  webItemComparisonPage: '/compare-items',
  description: 'Compare grocery items by current store-level price snapshots.',
  itemSnapshotDescription: 'Map store ids to current latest_prices snapshots for each requested item id.',
  queryParam: 'items',
  itemIdsParam: 'itemIds',
  maxItems: 4,
  responseFields: ['itemIds', 'stores', 'missingItemIds'],
  nutrition: 'nutrition',
  storePrices: 'storePrices',
  trendPoints: 'trendPoints'
} as const;
