import type { AdminReport } from './types';

export type QueryPerformanceRow = {
  route: string;
  p95Ms: number;
  cacheHitRate: number;
  sampleSize: number;
};

export function getQueryPerformanceReport(generatedAt = new Date().toISOString()): AdminReport<QueryPerformanceRow> {
  return {
    title: 'Query performance',
    scaffold: true,
    sourceLabel: 'local report helper',
    nextIntegration: 'pg_stat_statements + scripts/ops/check-hot-query-plans.mjs',
    generatedAt,
    rows: [
      { route: '/api/products/search', p95Ms: 180, cacheHitRate: 0.62, sampleSize: 1200 },
      { route: '/api/market/overview', p95Ms: 95, cacheHitRate: 0.81, sampleSize: 800 },
      { route: '/api/deals/discounts', p95Ms: 110, cacheHitRate: 0.74, sampleSize: 640 }
    ]
  };
}
