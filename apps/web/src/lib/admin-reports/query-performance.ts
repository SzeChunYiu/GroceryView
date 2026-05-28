import { scaffoldLabel } from './types';

export function getQueryPerformanceReport() {
  return {
    label: scaffoldLabel('pg_stat_statements + scripts/ops/check-hot-query-plans.mjs'),
    rows: [
      { route: '/api/products/search', p95Ms: 180, sampleCount: 1200 },
      { route: '/api/market/overview', p95Ms: 95, sampleCount: 800 },
      { route: '/api/deals/discounts', p95Ms: 110, sampleCount: 640 }
    ]
  };
}
