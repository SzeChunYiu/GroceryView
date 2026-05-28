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

export const DB_INDEX_HEALTH_FIXTURE_ROWS = [
  {
    tableName: 'observations',
    indexName: 'observations_connector_idempotency_idx',
    indexScans: 128_420,
    indexTuplesRead: 512_000,
    indexTuplesFetched: 498_000,
    indexBytes: 96_000_000,
    health: 'healthy'
  },
  {
    tableName: 'latest_prices',
    indexName: 'latest_prices_product_chain_store_idx',
    indexScans: 84_110,
    indexTuplesRead: 210_000,
    indexTuplesFetched: 205_000,
    indexBytes: 24_000_000,
    health: 'healthy'
  },
  {
    tableName: 'raw_records',
    indexName: 'raw_records_payload_hash_idx',
    indexScans: 0,
    indexTuplesRead: 0,
    indexTuplesFetched: 0,
    indexBytes: 18_000_000,
    health: 'unused'
  }
];

function classifyIndexHealth(row) {
  if (row.indexScans === 0 && row.indexBytes >= 1_048_576) return 'unused';
  if (row.indexScans < 10 && row.indexBytes >= 8_388_608) return 'low_usage';
  return 'healthy';
}

function summarizeIndexHealth(rows) {
  const unusedIndexes = rows.filter((row) => row.health === 'unused');
  const lowUsageIndexes = rows.filter((row) => row.health === 'low_usage');
  return {
    indexCount: rows.length,
    unusedIndexCount: unusedIndexes.length,
    lowUsageIndexCount: lowUsageIndexes.length,
    totalIndexBytes: rows.reduce((sum, row) => sum + row.indexBytes, 0)
  };
}

export function buildDbIndexHealthFixtureReport(env = process.env) {
  const limit = parsePositiveInteger(env.GROCERYVIEW_DB_INDEX_HEALTH_LIMIT, 100);
  const rows = DB_INDEX_HEALTH_FIXTURE_ROWS.slice(0, limit).map((row) => ({
    ...row,
    health: classifyIndexHealth(row)
  }));

  return {
    ...buildReportShell({ reportType: 'db_index_health_report', mode: 'fixture' }),
    limit,
    productionClaim: false,
    rows,
    summary: summarizeIndexHealth(rows)
  };
}

export async function buildDbIndexHealthDatabaseReport(env = process.env, options = {}) {
  const resolved = resolveDatabaseUrl(env);
  if (!resolved) throw new Error('DATABASE_URL is required for database mode.');

  const limit = parsePositiveInteger(env.GROCERYVIEW_DB_INDEX_HEALTH_LIMIT, 100);
  const Pool = options.Pool ?? PgPool;
  const pool = new Pool(buildPostgresPoolConfig(resolved.connectionString));

  try {
    const result = await pool.query(
      `
        select
          schemaname,
          relname as table_name,
          indexrelname as index_name,
          idx_scan::bigint as index_scans,
          idx_tup_read::bigint as index_tuples_read,
          idx_tup_fetch::bigint as index_tuples_fetched,
          pg_relation_size(indexrelid)::bigint as index_bytes
        from pg_stat_user_indexes
        where schemaname = 'public'
        order by idx_scan asc, pg_relation_size(indexrelid) desc
        limit $1
      `,
      [limit]
    );

    const rows = result.rows.map((row) => {
      const mapped = {
        tableName: String(row.table_name),
        indexName: String(row.index_name),
        indexScans: Number(row.index_scans),
        indexTuplesRead: Number(row.index_tuples_read),
        indexTuplesFetched: Number(row.index_tuples_fetched),
        indexBytes: Number(row.index_bytes)
      };
      return { ...mapped, health: classifyIndexHealth(mapped) };
    });

    return {
      ...buildReportShell({
        reportType: 'db_index_health_report',
        mode: 'database',
        databaseSource: resolved.source
      }),
      limit,
      productionClaim: true,
      rows,
      summary: summarizeIndexHealth(rows)
    };
  } finally {
    await pool.end();
  }
}

export async function buildDbIndexHealthReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildDbIndexHealthFixtureReport(env);
  return buildDbIndexHealthDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildDbIndexHealthReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.summary.unusedIndexCount > 0 && process.env.GROCERYVIEW_DB_INDEX_HEALTH_ALLOW_UNUSED !== '1') {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
