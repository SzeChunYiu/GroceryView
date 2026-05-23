#!/usr/bin/env node
import process from 'node:process';
import pg from 'pg';

const { Pool: PgPool } = pg;

const DEFAULT_RETRY_ATTEMPTS = 30;
const DEFAULT_RETRY_BASE_DELAY_MS = 10_000;
const DEFAULT_RETRY_MAX_DELAY_MS = 30_000;

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
    'edbhandlerexited',
    'timeout',
    'epipe'
  ].some((signature) => text.includes(signature));
}

function blockerForError(error) {
  const text = errorText(error).toLowerCase();
  if (text.includes('database system is not accepting connections')) return 'database_not_accepting_connections';
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

export async function checkDailyDatabaseConnectivity(env = process.env, options = {}) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl?.trim()) throw new Error('DATABASE_URL is required.');

  const classification = classifyDatabaseUrl(databaseUrl);
  const retryAttempts = parsePositiveInteger(env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS, DEFAULT_RETRY_ATTEMPTS);
  const retryBaseDelayMs = parseNonNegativeInteger(env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS, DEFAULT_RETRY_BASE_DELAY_MS);
  const retryMaxDelayMs = parseNonNegativeInteger(env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS, DEFAULT_RETRY_MAX_DELAY_MS);
  const Pool = options.Pool ?? PgPool;
  const wait = options.sleep ?? sleep;

  let lastError;
  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    const pool = new Pool({
      connectionString: buildDailyWriteConnectionString(databaseUrl),
      max: 1,
      idleTimeoutMillis: 1_000,
      connectionTimeoutMillis: 15_000
    });
    try {
      await pool.query('set default_transaction_read_only=off');
      await pool.query('select 1 as ok');
      await pool.end();
      return {
        status: 'ready',
        attempts: attempt,
        retryAttempts,
        retryBaseDelayMs,
        retryMaxDelayMs,
        ...classification
      };
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
    attempts: retryAttempts,
    retryAttempts,
    retryBaseDelayMs,
    retryMaxDelayMs,
    ...classification,
    blockers: [blockerForError(lastError)],
    error: sanitizeError(lastError)
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await checkDailyDatabaseConnectivity(process.env);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'ready') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
