#!/usr/bin/env node
import dns from 'node:dns';

const DAILY_WRITE_DATABASE_URL_KEYS = [
  'GROCERYVIEW_EFFECTIVE_DATABASE_URL',
  'DIRECT_DATABASE_URL',
  'REPLACEMENT_DATABASE_URL',
  'CANDIDATE_DATABASE_URL',
  'DATABASE_URL'
];

export function createIpv4Lookup() {
  return (hostname, _options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  };
}

export function transformSupabasePoolerForDailyWrites(rawUrl) {
  const url = new URL(rawUrl);
  if (url.hostname.endsWith('.pooler.supabase.com') && url.port === '6543') {
    url.port = '5432';
  }
  return url.toString();
}

export function resolveDailyWriteDatabaseUrl(env = process.env) {
  for (const key of DAILY_WRITE_DATABASE_URL_KEYS) {
    const value = env[key]?.trim();
    if (value) {
      return {
        connectionString: transformSupabasePoolerForDailyWrites(value),
        source: key,
        configuredUrl: value
      };
    }
  }
  throw new Error('DATABASE_URL is required.');
}

export function buildPostgresPoolConfig(connectionString, options = {}) {
  const normalized = options.transformSupabasePooler === false
    ? connectionString
    : transformSupabasePoolerForDailyWrites(connectionString);
  return {
    connectionString: normalized,
    max: options.max ?? 1,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 1_000,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 15_000,
    lookup: createIpv4Lookup(),
    ...(options.ssl === undefined ? {} : { ssl: options.ssl })
  };
}
