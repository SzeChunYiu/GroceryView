#!/usr/bin/env node

const DATABASE_URL_KEYS = [
  'GROCERYVIEW_EFFECTIVE_DATABASE_URL',
  'DIRECT_DATABASE_URL',
  'REPLACEMENT_DATABASE_URL',
  'CANDIDATE_DATABASE_URL',
  'DATABASE_URL'
];

export const REPORT_ENV_VARS = {
  GROCERYVIEW_REPORT_MODE: 'fixture | database — force report data source',
  DATABASE_URL: 'PostgreSQL URL for database mode (also GROCERYVIEW_EFFECTIVE_DATABASE_URL, DIRECT_DATABASE_URL, …)',
  GROCERYVIEW_SOURCE_RUN_REPORT_LOOKBACK_HOURS: 'Hours to include in source run report (default 24)',
  GROCERYVIEW_QUALITY_REPORT_DOMAIN: 'Domain filter for quality report (default grocery)',
  GROCERYVIEW_DEAD_LETTER_REPORT_LOOKBACK_HOURS: 'Hours to include in dead-letter report (default 24)',
  GROCERYVIEW_SEARCH_ANALYTICS_REPORT_LOOKBACK_HOURS: 'Hours to include in search analytics report (default 24)',
  GROCERYVIEW_GOLD_PUBLISH_DOMAIN: 'Domain for gold publish gate (default grocery)',
  GROCERYVIEW_GOLD_PUBLISH_REGION: 'Region code for gold publish gate (default SE)',
  GROCERYVIEW_GOLD_PUBLISH_FIXTURE_SCENARIO: 'fixture scenario for check-gold-publish-gate: ready | blocked'
};

export function resolveDatabaseUrl(env = process.env) {
  for (const key of DATABASE_URL_KEYS) {
    const value = env[key]?.trim();
    if (value) return { connectionString: value, source: key };
  }
  return null;
}

export function resolveReportMode(env = process.env) {
  const forced = env.GROCERYVIEW_REPORT_MODE?.trim().toLowerCase();
  if (forced === 'fixture' || forced === 'database') return forced;
  return resolveDatabaseUrl(env) ? 'database' : 'fixture';
}

export function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Postgres "undefined_table" SQLSTATE. A report whose backing table is not provisioned
// in the connected database should return status "unavailable" (per the source-run
// contract) rather than crash, so admin pages can show a clear provenance state.
export const UNDEFINED_TABLE_SQLSTATE = '42P01';

export function isUndefinedTableError(error) {
  if (!error || typeof error !== 'object') return false;
  if (error.code === UNDEFINED_TABLE_SQLSTATE) return true;
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return /relation ".*" does not exist/.test(message);
}

export function buildUnavailableReport({ reportType, databaseSource = null, missingRelation, nextIntegration = undefined, extra = {} }) {
  return {
    reportType,
    mode: 'database',
    status: 'unavailable',
    generatedAt: new Date().toISOString(),
    envVars: REPORT_ENV_VARS,
    sourceLabel: 'database',
    databaseConfigured: true,
    databaseUrlSource: databaseSource,
    productionClaim: false,
    unavailableReason: `Relation "${missingRelation}" is not provisioned in the connected database.`,
    nextIntegration:
      nextIntegration ??
      `Apply the data-platform migration that creates "${missingRelation}" to enable this report.`,
    rows: [],
    ...extra
  };
}

export function buildReportShell({ reportType, mode, databaseSource = null, nextIntegration = undefined }) {
  const status = mode === 'database' ? 'live' : 'generated';
  return {
    reportType,
    mode,
    status,
    generatedAt: new Date().toISOString(),
    envVars: REPORT_ENV_VARS,
    ...(mode === 'fixture'
      ? {
          sourceLabel: 'local fixture',
          nextIntegration: nextIntegration ?? 'Set DATABASE_URL or GROCERYVIEW_REPORT_MODE=database for live PostgreSQL evidence.',
          fixtureNotice:
            'No DATABASE_URL configured (or GROCERYVIEW_REPORT_MODE=fixture). Using generated fixture data; set DATABASE_URL for live reports.'
        }
      : {
          sourceLabel: 'database',
          nextIntegration: nextIntegration ?? 'Live PostgreSQL report is enabled.',
          databaseConfigured: true,
          databaseUrlSource: databaseSource
        })
  };
}
