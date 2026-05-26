export const trendingRoutes = {
  controllerPath: 'api/trending',
  description: 'Return grocery items with the highest price-check or list-add event count over the past 7 days.',
  limitQueryParam: 'limit',
  maxLimit: 50,
  defaultLimit: 10,
  responseFields: ['items', 'windowStart', 'windowEnd', 'windowDays', 'sortedBy']
} as const;
