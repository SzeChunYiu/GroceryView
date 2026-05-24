#!/usr/bin/env node
import process from 'node:process';
import pg from 'pg';

const { Pool: PgPool } = pg;

const DEFAULT_RETRY_ATTEMPTS = 30;
const DEFAULT_RETRY_BASE_DELAY_MS = 10_000;
const DEFAULT_RETRY_MAX_DELAY_MS = 30_000;
const DEFAULT_DIRECT_PROBE_ATTEMPTS = 1;
const DEFAULT_ALTERNATE_POOLER_PROBE_ATTEMPTS = 1;
const DEFAULT_IO_HOTSPOTS_LIMIT = 20;
const DEFAULT_IO_HOTSPOTS_SNIPPET_LENGTH = 180;

export function redactDatabaseUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.password) url.password = '***';
  return url.toString();
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function classifyDatabaseUrl(rawUrl) {
  const url = new URL(rawUrl);
  const originalPort = url.port ? Number.parseInt(url.port, 10) : 5432;
  const isSupabasePooler = url.hostname.endsWith('.pooler.supabase.com');
  const transformedForDailyWrites = isSupabasePooler && originalPort === 6543;
  const port = transformedForDailyWrites ? 5432 : originalPort;
  const poolerMode = isSupabasePooler ? (port === 5432 ? 'session' : 'transaction') : 'direct';
  return {
    host: url.hostname,
    port,
    originalPort,
    database: url.pathname.replace(/^\//, '') || null,
    username: decodeURIComponent(url.username),
    isSupabasePooler,
    poolerMode,
    transformedForDailyWrites,
    redactedUrl: redactDatabaseUrl(rawUrl)
  };
}

export function buildSupabaseTransactionPoolerConnectionString(rawUrl) {
  const classification = classifyDatabaseUrl(rawUrl);
  if (!classification.transformedForDailyWrites) return null;
  const url = new URL(rawUrl);
  url.port = String(classification.originalPort);
  return url.toString();
}

export function buildSupabaseDirectConnectionString(rawUrl) {
  const classification = classifyDatabaseUrl(rawUrl);
  if (!classification.isSupabasePooler) return null;
  const projectRefMatch = classification.username.match(/^postgres\.([a-z0-9]{20})$/i);
  if (!projectRefMatch) return null;
  const url = new URL(rawUrl);
  url.hostname = `db.${projectRefMatch[1]}.supabase.co`;
  url.username = 'postgres';
  url.port = '5432';
  return url.toString();
}

function buildDailyWriteConnectionString(rawUrl) {
  const classification = classifyDatabaseUrl(rawUrl);
  const url = new URL(rawUrl);
  if (classification.transformedForDailyWrites) url.port = String(classification.port);
  return url.toString();
}

function errorText(error) {
  if (error instanceof Error) return `${error.name}: ${error.message} ${error.code ?? ''}`.trim();
  return String(error);
}

export function isTransientDailyDatabaseError(error) {
  const text = errorText(error).toLowerCase();
  // Production signatures seen in GitHub Actions include ECONNREFUSED/econnrefused
  // and "Connection terminated unexpectedly"; keep these explicit for auditability.
  return [
    'database system is not accepting connections',
    'econnrefused',
    'econnreset',
    'connection terminated unexpectedly',
    'terminating connection',
    'connection to database closed',
    'db_connection_closed_in_auth',
    'hot standby mode is disabled',
    'edbhandlerexited',
    'eauthquery',
    'ecircuitbreaker',
    'connection to database not available',
    'new connections are temporarily blocked',
    'timeout',
    'epipe'
  ].some((signature) => text.includes(signature));
}

function blockerForError(error) {
  const text = errorText(error).toLowerCase();
  if (text.includes('ecircuitbreaker') && text.includes('new connections are temporarily blocked')) return 'supabase_pooler_circuit_breaker';
  if (text.includes('eauthquery') && text.includes('connection to database not available')) return 'supabase_pooler_database_unavailable';
  if (text.includes('database system is not accepting connections')) return 'database_not_accepting_connections';
  if (text.includes('db_connection_closed_in_auth')) return 'supabase_pooler_auth_closed';
  if (text.includes('hot standby mode is disabled')) return 'supabase_database_hot_standby_disabled';
  if (text.includes('econnrefused')) return 'database_connection_refused';
  if (text.includes('timeout')) return 'database_connection_timeout';
  if (text.includes('connection terminated unexpectedly') || text.includes('terminating connection')) return 'database_connection_terminated';
  return 'database_connectivity_failed';
}

function sanitizeError(error) {
  const text = errorText(error);
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted_database_url]')
    .replace(/password=[^\s]+/gi, 'password=[redacted]');
}

function sanitizeQuerySnippet(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted_database_url]')
    .replace(/password\s*=\s*[^\s,)]+/gi, 'password=[redacted]')
    .trim();
}

async function probeConnection({ connectionString, retryAttempts, retryBaseDelayMs, retryMaxDelayMs, Pool, wait }) {
  let lastError;
  let attempts = 0;
  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    attempts = attempt;
    const pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 1_000,
      connectionTimeoutMillis: 15_000
    });
    try {
      await pool.query('set default_transaction_read_only=off');
      await pool.query('select 1 as ok');
      await pool.end();
      return { status: 'ready', attempts: attempt };
    } catch (error) {
      lastError = error;
      try {
        await pool.end();
      } catch {
        // Ignore cleanup errors; the connectivity failure is reported below.
      }
      const transient = isTransientDailyDatabaseError(error);
      if (!transient || attempt === retryAttempts) break;
      await wait(Math.min(retryBaseDelayMs * attempt, retryMaxDelayMs));
    }
  }
  return {
    status: 'blocked',
    attempts,
    blockers: [blockerForError(lastError)],
    error: sanitizeError(lastError)
  };
}

export async function checkDailyDatabaseConnectivity(env = process.env, options = {}) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl?.trim()) throw new Error('DATABASE_URL is required.');

  const classification = classifyDatabaseUrl(databaseUrl);
  const retryAttempts = parsePositiveInteger(env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS, DEFAULT_RETRY_ATTEMPTS);
  const retryBaseDelayMs = parseNonNegativeInteger(env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS, DEFAULT_RETRY_BASE_DELAY_MS);
  const retryMaxDelayMs = parseNonNegativeInteger(env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS, DEFAULT_RETRY_MAX_DELAY_MS);
  const Pool = options.Pool ?? PgPool;
  const wait = options.sleep ?? sleep;

  const primary = await probeConnection({
    connectionString: buildDailyWriteConnectionString(databaseUrl),
    retryAttempts,
    retryBaseDelayMs,
    retryMaxDelayMs,
    Pool,
    wait
  });

  if (primary.status === 'ready') {
    return {
      status: 'ready',
      attempts: primary.attempts,
      retryAttempts,
      retryBaseDelayMs,
      retryMaxDelayMs,
      ...classification
    };
  }

  const alternateConnections = [];
  const transactionPoolerConnectionString = buildSupabaseTransactionPoolerConnectionString(databaseUrl);
  if (transactionPoolerConnectionString) {
    const transactionProbeAttempts = parsePositiveInteger(env.GROCERYVIEW_DAILY_DB_ALTERNATE_POOLER_PROBE_ATTEMPTS, DEFAULT_ALTERNATE_POOLER_PROBE_ATTEMPTS);
    const transactionClassification = classifyDatabaseUrl(transactionPoolerConnectionString);
    const transactionProbe = await probeConnection({
      connectionString: transactionPoolerConnectionString,
      retryAttempts: transactionProbeAttempts,
      retryBaseDelayMs,
      retryMaxDelayMs,
      Pool,
      wait
    });
    alternateConnections.push({
      name: 'supabase_transaction_pooler',
      status: transactionProbe.status,
      attempts: transactionProbe.attempts,
      host: transactionClassification.host,
      port: transactionClassification.originalPort,
      originalPort: transactionClassification.originalPort,
      database: transactionClassification.database,
      username: transactionClassification.username,
      poolerMode: 'transaction',
      redactedUrl: transactionClassification.redactedUrl,
      blockers: transactionProbe.blockers,
      error: transactionProbe.error,
      action: transactionProbe.status === 'ready'
        ? 'Transaction pooler accepts writes; the session-pooler endpoint is the blocker, but run migrations and ingestion only through a validated session/direct/replacement DB path.'
        : 'Transaction pooler also failed; continue provider recovery or replacement DB cutover.'
    });
  }

  const directConnectionString = buildSupabaseDirectConnectionString(databaseUrl);
  if (directConnectionString) {
    const directProbeAttempts = parsePositiveInteger(env.GROCERYVIEW_DAILY_DB_DIRECT_PROBE_ATTEMPTS, DEFAULT_DIRECT_PROBE_ATTEMPTS);
    const directClassification = classifyDatabaseUrl(directConnectionString);
    const directProbe = await probeConnection({
      connectionString: directConnectionString,
      retryAttempts: directProbeAttempts,
      retryBaseDelayMs,
      retryMaxDelayMs,
      Pool,
      wait
    });
    alternateConnections.push({
      name: 'supabase_direct_host',
      status: directProbe.status,
      attempts: directProbe.attempts,
      host: directClassification.host,
      port: directClassification.port,
      database: directClassification.database,
      username: directClassification.username,
      redactedUrl: directClassification.redactedUrl,
      blockers: directProbe.blockers,
      error: directProbe.error,
      action: directProbe.status === 'ready'
        ? 'Direct Supabase host accepts writes; update DATABASE_URL to the direct host or use a replacement DB before rerunning Daily ingestion readiness.'
        : 'Direct Supabase host also failed; continue provider recovery or replacement DB cutover.'
    });
  }

  return {
    status: 'blocked',
    attempts: primary.attempts,
    retryAttempts,
    retryBaseDelayMs,
    retryMaxDelayMs,
    ...classification,
    blockers: primary.blockers,
    error: primary.error,
    alternateConnections
  };
}

export async function printDailyDatabaseIoHotspots(env = process.env, options = {}) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl?.trim()) throw new Error('DATABASE_URL is required.');

  const limit = parsePositiveInteger(env.GROCERYVIEW_DB_IO_HOTSPOTS_LIMIT, DEFAULT_IO_HOTSPOTS_LIMIT);
  const snippetLength = parsePositiveInteger(
    env.GROCERYVIEW_DB_IO_HOTSPOTS_SNIPPET_LENGTH,
    DEFAULT_IO_HOTSPOTS_SNIPPET_LENGTH
  );
  const Pool = options.Pool ?? PgPool;
  const classification = classifyDatabaseUrl(databaseUrl);
  const pool = new Pool({
    connectionString: buildDailyWriteConnectionString(databaseUrl),
    max: 1,
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 15_000
  });

  try {
    const result = await pool.query(
      `
        select
          queryid::text as queryid,
          calls::bigint as calls,
          shared_blks_read::bigint as shared_blks_read,
          shared_blks_written::bigint as shared_blks_written,
          local_blks_read::bigint as local_blks_read,
          local_blks_written::bigint as local_blks_written,
          temp_blks_read::bigint as temp_blks_read,
          temp_blks_written::bigint as temp_blks_written,
          coalesce(blk_read_time, 0)::double precision as blk_read_time_ms,
          coalesce(blk_write_time, 0)::double precision as blk_write_time_ms,
          left(regexp_replace(query, '\\s+', ' ', 'g'), $1)::text as query_snippet
        from pg_stat_statements
        where coalesce(shared_blks_read, 0)
          + coalesce(shared_blks_written, 0)
          + coalesce(local_blks_read, 0)
          + coalesce(local_blks_written, 0)
          + coalesce(temp_blks_read, 0)
          + coalesce(temp_blks_written, 0) > 0
        order by
          coalesce(shared_blks_read, 0)
          + coalesce(shared_blks_written, 0)
          + coalesce(local_blks_read, 0)
          + coalesce(local_blks_written, 0)
          + coalesce(temp_blks_read, 0)
          + coalesce(temp_blks_written, 0) desc,
          calls desc
        limit $2
      `,
      [snippetLength, limit]
    );

    return {
      status: 'ready',
      evidence: 'pg_stat_statements_io_hotspots',
      limit,
      snippetLength,
      collectedAt: new Date().toISOString(),
      host: classification.host,
      port: classification.port,
      database: classification.database,
      username: classification.username,
      redactedUrl: classification.redactedUrl,
      hotspots: result.rows.map((row) => ({
        queryid: String(row.queryid),
        calls: Number(row.calls),
        sharedBlksRead: Number(row.shared_blks_read),
        sharedBlksWritten: Number(row.shared_blks_written),
        localBlksRead: Number(row.local_blks_read),
        localBlksWritten: Number(row.local_blks_written),
        tempBlksRead: Number(row.temp_blks_read),
        tempBlksWritten: Number(row.temp_blks_written),
        blkReadTimeMs: Number(row.blk_read_time_ms),
        blkWriteTimeMs: Number(row.blk_write_time_ms),
        querySnippet: sanitizeQuerySnippet(row.query_snippet)
      }))
    };
  } finally {
    await pool.end();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = process.argv.includes('--pg-stat-statements-io')
      ? await printDailyDatabaseIoHotspots(process.env)
      : await checkDailyDatabaseConnectivity(process.env);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'ready') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
