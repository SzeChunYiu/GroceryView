#!/usr/bin/env node
import process from 'node:process';
import pg from 'pg';
import { buildPostgresPoolConfig } from './db-connection.mjs';
import {
  buildReportShell,
  parsePositiveInteger,
  resolveDatabaseUrl,
  resolveReportMode
} from './report-env.mjs';

const { Pool: PgPool } = pg;

export const SLOW_QUERY_FIXTURE_ROWS = [
  { fingerprint: 'search_documents:domain_query_rank', route: '/api/search', calls: 1240, meanMs: 42, p95Ms: 118, rowsExamined: 18_200, recommendation: 'Keep GIN/trigram search_documents indexes hot and cap query expansion.' },
  { fingerprint: 'latest_prices:product_chain_lookup', route: '/products/[slug]', calls: 980, meanMs: 28, p95Ms: 86, rowsExamined: 4_500, recommendation: 'Use latest_prices serving table; avoid observation history scans.' },
  { fingerprint: 'observations:history_chart', route: '/api/v1/products/[id]/history', calls: 310, meanMs: 68, p95Ms: 142, rowsExamined: 52_000, recommendation: 'Use monthly partition pruning and daily rollups for chart windows.' }
];

function summarizeSlowQueries(rows) {
  return {
    queryCount: rows.length,
    maxP95Ms: Math.max(0, ...rows.map((row) => row.p95Ms)),
    slowQueryCount: rows.filter((row) => row.p95Ms >= 100).length,
    totalCalls: rows.reduce((sum, row) => sum + row.calls, 0)
  };
}

export function buildSlowQueryFixtureReport(env = process.env) {
  const limit = parsePositiveInteger(env.GROCERYVIEW_SLOW_QUERY_REPORT_LIMIT, 50);
  const rows = SLOW_QUERY_FIXTURE_ROWS.slice(0, limit);
  return {
    ...buildReportShell({ reportType: 'slow_query_report', mode: 'fixture' }),
    limit,
    productionClaim: false,
    rows,
    summary: summarizeSlowQueries(rows)
  };
}

export async function buildSlowQueryDatabaseReport(env = process.env, options = {}) {
  const resolved = resolveDatabaseUrl(env);
  if (!resolved) throw new Error('DATABASE_URL is required for database mode.');

  const limit = parsePositiveInteger(env.GROCERYVIEW_SLOW_QUERY_REPORT_LIMIT, 50);
  const Pool = options.Pool ?? PgPool;
  const pool = new Pool(buildPostgresPoolConfig(resolved.connectionString));

  try {
    const result = await pool.query(
      `
        select
          md5(query) as fingerprint,
          left(query, 160) as route,
          calls::int as calls,
          round(mean_exec_time::numeric, 2)::float as mean_ms,
          round((mean_exec_time + (2 * stddev_exec_time))::numeric, 2)::float as p95_ms,
          rows::bigint as rows_examined
        from pg_stat_statements
        order by mean_exec_time desc
        limit $1
      `,
      [limit]
    );

    const rows = result.rows.map((row) => ({
      fingerprint: String(row.fingerprint),
      route: String(row.route),
      calls: Number(row.calls),
      meanMs: Number(row.mean_ms),
      p95Ms: Number(row.p95_ms),
      rowsExamined: Number(row.rows_examined),
      recommendation: 'Review EXPLAIN plans, partition pruning, and serving-table coverage before publish.'
    }));

    return {
      ...buildReportShell({
        reportType: 'slow_query_report',
        mode: 'database',
        databaseSource: resolved.source
      }),
      limit,
      productionClaim: true,
      rows,
      summary: summarizeSlowQueries(rows)
    };
  } finally {
    await pool.end();
  }
}

export async function buildSlowQueryReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildSlowQueryFixtureReport(env);
  return buildSlowQueryDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildSlowQueryReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
