import { generatedReportLabel } from './types';
import { buildSearchAnalyticsFixtureReport } from '../../../../../scripts/ops/search-analytics-report.mjs';

export function getSearchAnalyticsReport() {
  const report = buildSearchAnalyticsFixtureReport(
    { ...process.env, GROCERYVIEW_SEARCH_ANALYTICS_REPORT_LOOKBACK_HOURS: '87600' },
    new Date('2026-05-28T20:00:00.000Z')
  );

  return {
    label: generatedReportLabel('scripts/ops/search-analytics-report.mjs + analytics_events', 'Set DATABASE_URL for live analytics_events and search_documents rollups.'),
    summary: {
      zeroResultRate7d: report.summary.searchZeroResultRate,
      searchToProductCtr: report.summary.searchToProductClickRate,
      topQueries: report.rows.map((row) => ({
        query: row.query,
        domain: row.domain,
        searches: row.searchCount,
        zeroResultRate: row.zeroResultRate,
        clickThroughRate: row.clickThroughRate
      }))
    }
  };
}
