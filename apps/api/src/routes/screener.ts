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
  ]
} as const;
