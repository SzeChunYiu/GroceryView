import type { AdminReport } from './types';

export type SearchAnalyticsRow = {
  queryCluster: string;
  searches: number;
  zeroResultRate: number;
  topCategory: string;
};

export function getSearchAnalyticsReport(generatedAt = new Date().toISOString()): AdminReport<SearchAnalyticsRow> {
  return {
    title: 'Search analytics',
    scaffold: true,
    sourceLabel: 'local report helper',
    nextIntegration: 'product search telemetry rollup + /api/analytics/search-to-savings-funnel',
    generatedAt,
    rows: [
      { queryCluster: 'mjölk', searches: 420, zeroResultRate: 0.04, topCategory: 'mejeri-ost-agg' },
      { queryCluster: 'kaffe', searches: 310, zeroResultRate: 0.07, topCategory: 'kaffe' },
      { queryCluster: 'bröd', searches: 280, zeroResultRate: 0.05, topCategory: 'brod-bageri' }
    ]
  };
}
