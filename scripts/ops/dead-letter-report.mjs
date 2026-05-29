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

export const DEAD_LETTER_FIXTURE_ROWS = [
  {
    id: 'dl-ica-2026-05-28-001',
    sourceRunId: '00000000-0000-4000-8000-000000000102',
    domain: 'grocery',
    sourceId: 'ica-store-promotions-default-stores',
    errorClass: 'schema_version_mismatch',
    severity: 'high',
    firstSeenAt: '2026-05-28T03:07:11.000Z',
    lastSeenAt: '2026-05-28T03:28:44.000Z',
    retryCount: 0,
    replayHref: '/admin/sources/dead-letters?sourceRunId=00000000-0000-4000-8000-000000000102'
  },
  {
    id: 'dl-apotek-2026-05-28-001',
    sourceRunId: '00000000-0000-4000-8000-000000000103',
    domain: 'pharmacy',
    sourceId: 'apotek-hjartat-se',
    errorClass: 'otc_contract_parse_failure',
    severity: 'critical',
    firstSeenAt: '2026-05-28T01:10:42.000Z',
    lastSeenAt: '2026-05-28T01:12:03.000Z',
    retryCount: 2,
    replayHref: '/admin/sources/dead-letters?sourceRunId=00000000-0000-4000-8000-000000000103'
  }
];

function summarizeDeadLetters(rows) {
  const bySeverity = {};
  const byDomain = {};
  for (const row of rows) {
    bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1;
    byDomain[row.domain] = (byDomain[row.domain] ?? 0) + 1;
  }
  return {
    deadLetterCount: rows.length,
    criticalCount: bySeverity.critical ?? 0,
    highCount: bySeverity.high ?? 0,
    bySeverity,
    byDomain
  };
}

export function buildDeadLetterFixtureReport(env = process.env, now = new Date()) {
  const lookbackHours = parsePositiveInteger(env.GROCERYVIEW_DEAD_LETTER_REPORT_LOOKBACK_HOURS, 24);
  const lookbackRows = DEAD_LETTER_FIXTURE_ROWS.filter((row) => {
    const seenMs = Date.parse(row.lastSeenAt);
    return Number.isFinite(seenMs) && now.getTime() - seenMs <= lookbackHours * 60 * 60 * 1000;
  });
  const rows = lookbackRows.length > 0 ? lookbackRows : DEAD_LETTER_FIXTURE_ROWS;
  return {
    ...buildReportShell({ reportType: 'dead_letter_report', mode: 'fixture' }),
    lookbackHours,
    productionClaim: false,
    rows,
    summary: summarizeDeadLetters(rows)
  };
}

export async function buildDeadLetterDatabaseReport(env = process.env, options = {}) {
  const resolved = resolveDatabaseUrl(env);
  if (!resolved) throw new Error('DATABASE_URL is required for database mode.');

  const lookbackHours = parsePositiveInteger(env.GROCERYVIEW_DEAD_LETTER_REPORT_LOOKBACK_HOURS, 24);
  const Pool = options.Pool ?? PgPool;
  const pool = new Pool(buildPostgresPoolConfig(resolved.connectionString));

  try {
    const result = await pool.query(
      `
        select
          dl.id::text,
          dl.source_run_id::text,
          coalesce(dl.domain, sr.provenance->>'domain', 'grocery') as domain,
          coalesce(dl.source_id, sr.source_name) as source_id,
          coalesce(dl.error_class, dl.reason, 'unknown') as error_class,
          coalesce(dl.severity, 'medium') as severity,
          dl.created_at as first_seen_at,
          coalesce(dl.updated_at, dl.created_at) as last_seen_at,
          coalesce(dl.retry_count, 0)::int as retry_count
        from dead_letters dl
        left join source_runs sr on sr.id = dl.source_run_id
        where coalesce(dl.updated_at, dl.created_at) >= now() - make_interval(hours => $1)
        order by coalesce(dl.updated_at, dl.created_at) desc
        limit 500
      `,
      [lookbackHours]
    );

    const rows = result.rows.map((row) => ({
      id: String(row.id),
      sourceRunId: String(row.source_run_id),
      domain: String(row.domain),
      sourceId: String(row.source_id),
      errorClass: String(row.error_class),
      severity: String(row.severity),
      firstSeenAt: row.first_seen_at instanceof Date ? row.first_seen_at.toISOString() : String(row.first_seen_at),
      lastSeenAt: row.last_seen_at instanceof Date ? row.last_seen_at.toISOString() : String(row.last_seen_at),
      retryCount: Number(row.retry_count),
      replayHref: `/admin/sources/dead-letters?sourceRunId=${encodeURIComponent(String(row.source_run_id))}`
    }));

    return {
      ...buildReportShell({
        reportType: 'dead_letter_report',
        mode: 'database',
        databaseSource: resolved.source
      }),
      lookbackHours,
      productionClaim: true,
      rows,
      summary: summarizeDeadLetters(rows)
    };
  } finally {
    await pool.end();
  }
}

export async function buildDeadLetterReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildDeadLetterFixtureReport(env, options.now ?? new Date());
  return buildDeadLetterDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildDeadLetterReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.summary.criticalCount > 0 && process.env.GROCERYVIEW_DEAD_LETTER_ALLOW_CRITICAL !== '1') {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
