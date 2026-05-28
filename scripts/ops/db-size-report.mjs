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

export const DB_SIZE_FIXTURE_ROWS = [
  { relationName: 'observations', tableBytes: 1_024_000_000, indexBytes: 512_000_000, totalBytes: 1_536_000_000 },
  { relationName: 'latest_prices', tableBytes: 256_000_000, indexBytes: 96_000_000, totalBytes: 352_000_000 },
  { relationName: 'raw_records', tableBytes: 640_000_000, indexBytes: 128_000_000, totalBytes: 768_000_000 },
  { relationName: 'source_runs', tableBytes: 12_000_000, indexBytes: 4_000_000, totalBytes: 16_000_000 },
  { relationName: 'products', tableBytes: 48_000_000, indexBytes: 16_000_000, totalBytes: 64_000_000 }
];

function summarizeSizes(rows) {
  const totalBytes = rows.reduce((sum, row) => sum + row.totalBytes, 0);
  const tableBytes = rows.reduce((sum, row) => sum + row.tableBytes, 0);
  const indexBytes = rows.reduce((sum, row) => sum + row.indexBytes, 0);
  return {
    relationCount: rows.length,
    totalBytes,
    tableBytes,
    indexBytes,
    largestRelation: rows[0]?.relationName ?? null
  };
}

export function buildDbSizeFixtureReport(env = process.env) {
  const limit = parsePositiveInteger(env.GROCERYVIEW_DB_SIZE_REPORT_LIMIT, 50);
  const rows = DB_SIZE_FIXTURE_ROWS.slice(0, limit);
  return {
    ...buildReportShell({ reportType: 'db_size_report', mode: 'fixture' }),
    limit,
    productionClaim: false,
    rows,
    summary: summarizeSizes(rows)
  };
}

export async function buildDbSizeDatabaseReport(env = process.env, options = {}) {
  const resolved = resolveDatabaseUrl(env);
  if (!resolved) throw new Error('DATABASE_URL is required for database mode.');

  const limit = parsePositiveInteger(env.GROCERYVIEW_DB_SIZE_REPORT_LIMIT, 50);
  const Pool = options.Pool ?? PgPool;
  const pool = new Pool(buildPostgresPoolConfig(resolved.connectionString));

  try {
    const result = await pool.query(
      `
        select
          c.relname as relation_name,
          pg_relation_size(c.oid)::bigint as table_bytes,
          pg_indexes_size(c.oid)::bigint as index_bytes,
          pg_total_relation_size(c.oid)::bigint as total_bytes
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind = 'r'
        order by pg_total_relation_size(c.oid) desc
        limit $1
      `,
      [limit]
    );

    const rows = result.rows.map((row) => ({
      relationName: String(row.relation_name),
      tableBytes: Number(row.table_bytes),
      indexBytes: Number(row.index_bytes),
      totalBytes: Number(row.total_bytes)
    }));

    return {
      ...buildReportShell({
        reportType: 'db_size_report',
        mode: 'database',
        databaseSource: resolved.source
      }),
      limit,
      productionClaim: true,
      rows,
      summary: summarizeSizes(rows)
    };
  } finally {
    await pool.end();
  }
}

export async function buildDbSizeReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildDbSizeFixtureReport(env);
  return buildDbSizeDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildDbSizeReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
