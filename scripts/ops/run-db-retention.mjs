#!/usr/bin/env node
import process from 'node:process';
import pg from 'pg';

const { Pool } = pg;

const DEFAULT_OBSERVATION_RETENTION_DAYS = 400;
const DEFAULT_RAW_RECORD_RETENTION_DAYS = 90;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sanitizeError(error) {
  const text = error instanceof Error ? `${error.name}: ${error.message} ${error.code ?? ''}`.trim() : String(error);
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted_database_url]')
    .replace(/password=[^\s]+/gi, 'password=[redacted]');
}

function shouldExecute(env, argv) {
  return argv.includes('--execute') || env.GROCERYVIEW_DB_RETENTION_DRY_RUN === '0';
}

function requireDatabaseUrl(env) {
  if (!env.DATABASE_URL?.trim()) throw new Error('DATABASE_URL is required.');
  return env.DATABASE_URL.trim();
}

export async function runDatabaseRetention(env = process.env, options = {}) {
  const databaseUrl = requireDatabaseUrl(env);
  const retainObservationsDays = parsePositiveInteger(
    env.GROCERYVIEW_DB_RETENTION_OBSERVATION_DAYS,
    DEFAULT_OBSERVATION_RETENTION_DAYS
  );
  const retainRawRecordsDays = parsePositiveInteger(
    env.GROCERYVIEW_DB_RETENTION_RAW_RECORD_DAYS,
    DEFAULT_RAW_RECORD_RETENTION_DAYS
  );
  const dryRun = options.execute === true ? false : !shouldExecute(env, options.argv ?? process.argv.slice(2));
  const PgPool = options.Pool ?? Pool;
  const pool = new PgPool({
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 15_000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const runResult = await pool.query(
      'select run_observation_retention($1::integer, $2::integer, $3::boolean) as run_id',
      [retainObservationsDays, retainRawRecordsDays, dryRun]
    );
    const runId = runResult.rows[0]?.run_id;
    if (!runId) throw new Error('Retention function did not return a run id.');
    const auditResult = await pool.query('select * from retention_runs where id = $1::uuid', [runId]);
    const audit = auditResult.rows[0];
    if (!audit) throw new Error(`Retention audit row not found for run ${runId}.`);
    return {
      status: dryRun ? 'planned' : 'applied',
      runId,
      dryRun,
      retainObservationsDays,
      retainRawRecordsDays,
      observationsCandidateCount: Number(audit.observations_candidate_count),
      observationsDeletedCount: Number(audit.observations_deleted_count),
      rawRecordsCandidateCount: Number(audit.raw_records_candidate_count),
      rawRecordsDeletedCount: Number(audit.raw_records_deleted_count),
      observationsCutoff: audit.observations_cutoff,
      rawRecordsCutoff: audit.raw_records_cutoff
    };
  } finally {
    await pool.end();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await runDatabaseRetention(process.env, { argv: process.argv.slice(2) });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${sanitizeError(error)}\n`);
    process.exitCode = 1;
  }
}
