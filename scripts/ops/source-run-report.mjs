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

export const SOURCE_RUN_FIXTURE_ROWS = [
  {
    runId: '00000000-0000-4000-8000-000000000101',
    domain: 'grocery',
    sourceId: 'willys-products-all-stores',
    connectorId: 'willys-products-native-v1',
    status: 'succeeded',
    startedAt: '2026-05-28T02:15:00.000Z',
    finishedAt: '2026-05-28T02:42:11.000Z',
    rawRecordCount: 18420,
    acceptedRecordCount: 18102,
    rejectedRecordCount: 214,
    duplicateRecordCount: 104,
    deadLetterCount: 0,
    schemaVersion: 'ingest-row-v1',
    codeVersion: 'fixture',
    inputHash: 'sha256:fixture-willys-2026-05-28'
  },
  {
    runId: '00000000-0000-4000-8000-000000000102',
    domain: 'grocery',
    sourceId: 'ica-store-promotions-default-stores',
    connectorId: 'ica-store-promotions-native-v1',
    status: 'partial',
    startedAt: '2026-05-28T03:05:00.000Z',
    finishedAt: '2026-05-28T03:28:44.000Z',
    rawRecordCount: 9200,
    acceptedRecordCount: 8011,
    rejectedRecordCount: 1189,
    duplicateRecordCount: 0,
    deadLetterCount: 37,
    schemaVersion: 'ingest-row-v1',
    codeVersion: 'fixture',
    inputHash: 'sha256:fixture-ica-2026-05-28'
  },
  {
    runId: '00000000-0000-4000-8000-000000000103',
    domain: 'pharmacy',
    sourceId: 'apotek-hjartat-se',
    connectorId: 'apotek-hjartat-native-v1',
    status: 'failed',
    startedAt: '2026-05-28T01:10:00.000Z',
    finishedAt: '2026-05-28T01:12:03.000Z',
    rawRecordCount: 0,
    acceptedRecordCount: 0,
    rejectedRecordCount: 0,
    duplicateRecordCount: 0,
    deadLetterCount: 12,
    schemaVersion: 'ingest-row-v1',
    codeVersion: 'fixture',
    inputHash: 'sha256:fixture-apotek-failed-2026-05-28'
  }
];

function summarizeSourceRuns(rows) {
  const byStatus = {};
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }
  return {
    runCount: rows.length,
    byStatus,
    totalAccepted: rows.reduce((sum, row) => sum + row.acceptedRecordCount, 0),
    totalRejected: rows.reduce((sum, row) => sum + row.rejectedRecordCount, 0),
    totalDeadLetters: rows.reduce((sum, row) => sum + row.deadLetterCount, 0),
    failedRunCount: byStatus.failed ?? 0,
    partialRunCount: byStatus.partial ?? 0
  };
}

export function buildSourceRunFixtureReport(env = process.env, now = new Date()) {
  const lookbackHours = parsePositiveInteger(env.GROCERYVIEW_SOURCE_RUN_REPORT_LOOKBACK_HOURS, 24);
  const lookbackRows = SOURCE_RUN_FIXTURE_ROWS.filter((row) => {
    const startedMs = Date.parse(row.startedAt);
    return Number.isFinite(startedMs) && now.getTime() - startedMs <= lookbackHours * 60 * 60 * 1000;
  });
  const rows = lookbackRows.length > 0 ? lookbackRows : SOURCE_RUN_FIXTURE_ROWS;

  return {
    ...buildReportShell({ reportType: 'source_run_report', mode: 'fixture' }),
    lookbackHours,
    productionClaim: false,
    rows,
    summary: summarizeSourceRuns(rows)
  };
}

export async function buildSourceRunDatabaseReport(env = process.env, options = {}) {
  const resolved = resolveDatabaseUrl(env);
  if (!resolved) throw new Error('DATABASE_URL is required for database mode.');

  const lookbackHours = parsePositiveInteger(env.GROCERYVIEW_SOURCE_RUN_REPORT_LOOKBACK_HOURS, 24);
  const Pool = options.Pool ?? PgPool;
  const pool = new Pool(buildPostgresPoolConfig(resolved.connectionString));

  try {
    const result = await pool.query(
      `
        select
          id::text as run_id,
          coalesce(provenance->>'domain', 'grocery') as domain,
          source_name as source_id,
          coalesce(provenance->>'connectorId', source_name) as connector_id,
          status,
          started_at,
          finished_at,
          coalesce((provenance->>'rawRecordCount')::int, 0) as raw_record_count,
          coalesce((provenance->>'acceptedCount')::int, 0) as accepted_record_count,
          coalesce((provenance->>'rejectedCount')::int, 0) as rejected_record_count,
          coalesce((provenance->>'duplicateCount')::int, 0) as duplicate_record_count,
          coalesce((provenance->>'deadLetterCount')::int, 0) as dead_letter_count,
          provenance->>'schemaVersion' as schema_version,
          provenance->>'codeVersion' as code_version,
          provenance->>'inputHash' as input_hash
        from source_runs
        where started_at >= now() - make_interval(hours => $1)
        order by started_at desc
        limit 500
      `,
      [lookbackHours]
    );

    const rows = result.rows.map((row) => ({
      runId: String(row.run_id),
      domain: String(row.domain),
      sourceId: String(row.source_id),
      connectorId: String(row.connector_id),
      status: String(row.status),
      startedAt: row.started_at instanceof Date ? row.started_at.toISOString() : String(row.started_at),
      finishedAt: row.finished_at instanceof Date ? row.finished_at.toISOString() : row.finished_at ? String(row.finished_at) : null,
      rawRecordCount: Number(row.raw_record_count),
      acceptedRecordCount: Number(row.accepted_record_count),
      rejectedRecordCount: Number(row.rejected_record_count),
      duplicateRecordCount: Number(row.duplicate_record_count),
      deadLetterCount: Number(row.dead_letter_count),
      schemaVersion: row.schema_version ? String(row.schema_version) : null,
      codeVersion: row.code_version ? String(row.code_version) : null,
      inputHash: row.input_hash ? String(row.input_hash) : null
    }));

    return {
      ...buildReportShell({
        reportType: 'source_run_report',
        mode: 'database',
        databaseSource: resolved.source
      }),
      lookbackHours,
      productionClaim: true,
      rows,
      summary: summarizeSourceRuns(rows)
    };
  } finally {
    await pool.end();
  }
}

export async function buildSourceRunReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildSourceRunFixtureReport(env, options.now ?? new Date());
  return buildSourceRunDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildSourceRunReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.summary.failedRunCount > 0 && process.env.GROCERYVIEW_SOURCE_RUN_REPORT_ALLOW_FAILURES !== '1') {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
