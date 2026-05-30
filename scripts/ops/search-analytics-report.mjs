#!/usr/bin/env node
import process from 'node:process';
import pg from 'pg';
import { buildPostgresPoolConfig } from './db-connection.mjs';
import {
  buildReportShell,
  buildUnavailableReport,
  parsePositiveInteger,
  resolveDatabaseUrl,
  resolveReportMode
} from './report-env.mjs';

const { Pool: PgPool } = pg;

export const SEARCH_ANALYTICS_FIXTURE_ROWS = [
  {
    query: 'mjölk',
    domain: 'grocery',
    searchCount: 420,
    zeroResultCount: 17,
    resultClickCount: 172,
    productOpenCount: 148,
    lastSeenAt: '2026-05-28T19:45:00.000Z'
  },
  {
    query: 'alvedon',
    domain: 'pharmacy',
    searchCount: 86,
    zeroResultCount: 2,
    resultClickCount: 51,
    productOpenCount: 44,
    lastSeenAt: '2026-05-28T18:22:00.000Z'
  },
  {
    query: 'diesel',
    domain: 'fuel',
    searchCount: 134,
    zeroResultCount: 6,
    resultClickCount: 57,
    productOpenCount: 31,
    lastSeenAt: '2026-05-28T17:12:00.000Z'
  }
];

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function summarizeSearchAnalytics(rows) {
  const searchCount = rows.reduce((sum, row) => sum + row.searchCount, 0);
  const zeroResultCount = rows.reduce((sum, row) => sum + row.zeroResultCount, 0);
  const resultClickCount = rows.reduce((sum, row) => sum + row.resultClickCount, 0);
  const productOpenCount = rows.reduce((sum, row) => sum + row.productOpenCount, 0);
  return {
    queryCount: rows.length,
    searchCount,
    zeroResultCount,
    resultClickCount,
    productOpenCount,
    searchZeroResultRate: pct(zeroResultCount, searchCount),
    searchToProductClickRate: pct(productOpenCount, searchCount)
  };
}

export function buildSearchAnalyticsFixtureReport(env = process.env, now = new Date()) {
  const lookbackHours = parsePositiveInteger(env.GROCERYVIEW_SEARCH_ANALYTICS_REPORT_LOOKBACK_HOURS, 24);
  const withinLookback = SEARCH_ANALYTICS_FIXTURE_ROWS.filter((row) => {
    const seenMs = Date.parse(row.lastSeenAt);
    return Number.isFinite(seenMs) && now.getTime() - seenMs <= lookbackHours * 60 * 60 * 1000;
  });
  // Fall back to the full fixture set when fixtures age past the lookback window, so the
  // demo report stays non-empty regardless of the current date (matches dead-letter-report).
  const rows = (withinLookback.length > 0 ? withinLookback : SEARCH_ANALYTICS_FIXTURE_ROWS).map((row) => ({
    ...row,
    zeroResultRate: pct(row.zeroResultCount, row.searchCount),
    clickThroughRate: pct(row.resultClickCount, row.searchCount),
    productOpenRate: pct(row.productOpenCount, row.searchCount)
  }));

  return {
    ...buildReportShell({ reportType: 'search_analytics_report', mode: 'fixture' }),
    lookbackHours,
    productionClaim: false,
    rows,
    summary: summarizeSearchAnalytics(rows)
  };
}

export async function buildSearchAnalyticsDatabaseReport(env = process.env, options = {}) {
  const resolved = resolveDatabaseUrl(env);
  if (!resolved) throw new Error('DATABASE_URL is required for database mode.');

  const lookbackHours = parsePositiveInteger(env.GROCERYVIEW_SEARCH_ANALYTICS_REPORT_LOOKBACK_HOURS, 24);
  const Pool = options.Pool ?? PgPool;
  const pool = new Pool(buildPostgresPoolConfig(resolved.connectionString));

  try {
    const relationCheck = await pool.query("select to_regclass('public.analytics_events') as relation");
    if (!relationCheck.rows[0]?.relation) {
      return buildUnavailableReport({
        reportType: 'search_analytics_report',
        databaseSource: resolved.source,
        missingRelation: 'analytics_events',
        extra: { lookbackHours, summary: summarizeSearchAnalytics([]) }
      });
    }

    const result = await pool.query(
      `
        select
          coalesce(nullif(event_properties->>'query', ''), '(empty)') as query,
          coalesce(event_properties->>'domain', 'grocery') as domain,
          count(*) filter (where event_name = 'search_submitted')::int as search_count,
          count(*) filter (where event_name = 'search_submitted' and coalesce((event_properties->>'resultCount')::int, 0) = 0)::int as zero_result_count,
          count(*) filter (where event_name = 'search_result_clicked')::int as result_click_count,
          count(*) filter (where event_name in ('product_opened', 'pharmacy_product_clicked', 'fuel_grade_selected'))::int as product_open_count,
          max(created_at) as last_seen_at
        from analytics_events
        where created_at >= now() - make_interval(hours => $1)
          and event_name in ('search_submitted', 'search_result_clicked', 'product_opened', 'pharmacy_product_clicked', 'fuel_grade_selected')
        group by 1, 2
        order by search_count desc, last_seen_at desc
        limit 200
      `,
      [lookbackHours]
    );

    const rows = result.rows.map((row) => {
      const searchCount = Number(row.search_count);
      const zeroResultCount = Number(row.zero_result_count);
      const resultClickCount = Number(row.result_click_count);
      const productOpenCount = Number(row.product_open_count);
      return {
        query: String(row.query),
        domain: String(row.domain),
        searchCount,
        zeroResultCount,
        resultClickCount,
        productOpenCount,
        lastSeenAt: row.last_seen_at instanceof Date ? row.last_seen_at.toISOString() : String(row.last_seen_at),
        zeroResultRate: pct(zeroResultCount, searchCount),
        clickThroughRate: pct(resultClickCount, searchCount),
        productOpenRate: pct(productOpenCount, searchCount)
      };
    });

    return {
      ...buildReportShell({
        reportType: 'search_analytics_report',
        mode: 'database',
        databaseSource: resolved.source
      }),
      lookbackHours,
      productionClaim: true,
      rows,
      summary: summarizeSearchAnalytics(rows)
    };
  } finally {
    await pool.end();
  }
}

export async function buildSearchAnalyticsReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildSearchAnalyticsFixtureReport(env, options.now ?? new Date());
  return buildSearchAnalyticsDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildSearchAnalyticsReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
