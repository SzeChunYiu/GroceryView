import { generatedReportLabel } from './types';

export function getSearchAnalyticsReport() {
  return {
    label: generatedReportLabel('scripts/ops/search-analytics-report.mjs + analytics_events', 'Set DATABASE_URL for live analytics_events and search_documents rollups.'),
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
