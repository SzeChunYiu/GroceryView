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
  basketWinnerHighlight: 'Cheapest'
} as const;
