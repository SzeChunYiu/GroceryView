import { generatedReportLabel } from './types';

export function getQueryPerformanceReport() {
  return {
    label: generatedReportLabel('scripts/ops/slow-query-report.mjs + scripts/ops/check-hot-query-plans.mjs', 'Set DATABASE_URL for live pg_stat_statements slow query evidence.'),
    rows: [
      { route: '/api/products/search', p95Ms: 180, sampleCount: 1200 },
      { route: '/api/market/overview', p95Ms: 95, sampleCount: 800 },
      { route: '/api/deals/discounts', p95Ms: 110, sampleCount: 640 }
    ]
  };
}
