import { scaffoldLabel } from './types';

export function getSearchAnalyticsReport() {
  return {
    label: scaffoldLabel('product search telemetry rollup + /api/analytics/search-to-savings-funnel'),
    summary: {
      zeroResultRate7d: 6.2,
      searchToProductCtr: 38,
      topQueries: [
        { query: 'mjölk', searches: 420, zeroResultRate: 4, clickThroughRate: 41 },
        { query: 'kaffe', searches: 310, zeroResultRate: 7, clickThroughRate: 35 },
        { query: 'bröd', searches: 280, zeroResultRate: 5, clickThroughRate: 39 }
      ]
    }
  };
}
