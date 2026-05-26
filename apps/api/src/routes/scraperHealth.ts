export const scraperHealthRoutes = {
  dashboardPath: '/admin/scrapers',
  apiPath: '/api/admin/scraper-health',
  staleAfterHours: 24,
  fields: ['retailer', 'lastRunAt', 'successRate', 'itemCount', 'runCount', 'failedRunCount', 'stale'],
  description: 'Admin scraper health dashboard backed by source_runs last-run, item-count, and success-rate evidence.'
} as const;
