#!/usr/bin/env node
import process from 'node:process';

import { checkSupabaseProjectHealth } from './check-supabase-project-health.mjs';

const SUPABASE_MANAGEMENT_API_BASE_URL = 'https://api.supabase.com/v1';
const DATABASE_URL_PATTERN = /postgres(?:ql)?:\/\/[^\s'"}]+/gi;
const PASSWORD_PATTERN = /(:\/\/[^:\s]+:)([^@\s]+)(@)/g;

function redact(value) {
  return String(value ?? '')
    .replace(DATABASE_URL_PATTERN, '[redacted_database_url]')
    .replace(PASSWORD_PATTERN, '$1***$3')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]');
}

function sanitizeBody(body) {
  if (body === null || body === undefined) return body;
  if (typeof body === 'string') return redact(body);
  if (Array.isArray(body)) return body.map(sanitizeBody);
  if (typeof body === 'object') {
    return Object.fromEntries(Object.entries(body).map(([key, value]) => [key, sanitizeBody(value)]));
  }
  return body;
}

async function fetchJson(fetchImpl, url, token, init = {}) {
  const response = await fetchImpl(url, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: text };
  }
  return { ok: response.ok, status: response.status, body: sanitizeBody(body) };
}

function hasDatabaseNotAcceptingConnections(health) {
  const joined = JSON.stringify(health.serviceHealth ?? []).toLowerCase();
  return joined.includes('database system is not accepting connections') || joined.includes('57p03');
}

function buildRecommendedActions(health, queryDiagnostic) {
  const actions = [];
  if (hasDatabaseNotAcceptingConnections(health)) {
    actions.push({
      id: 'supabase-platform-recovery',
      owner: 'supabase_support_or_dashboard_operator',
      action: 'Restart or recover the Supabase Postgres service for the existing project; if it remains 57P03, open a Supabase support ticket with this packet.'
    });
    actions.push({
      id: 'replacement-db-cutover',
      owner: 'operator_after_approval',
      action: 'If the provider cannot recover the existing DB promptly, create or select a replacement Supabase project, store its connection string as REPLACEMENT_DATABASE_URL or CANDIDATE_DATABASE_URL, run the Production DB cutover validation workflow to prove write connectivity, migrations, all-store ingestion, and DB-backed snapshot evidence, then update DATABASE_URL and rerun Daily ingestion readiness on main.'
    });
  } else if (health.status !== 'ready' || queryDiagnostic.status !== 'ready') {
    actions.push({
      id: 'investigate-unhealthy-services',
      owner: 'operator',
      action: 'Investigate the reported unhealthy Supabase services before applying migrations or daily writes.'
    });
  } else {
    actions.push({
      id: 'rerun-daily-ingestion-readiness',
      owner: 'operator',
      action: 'Run the Daily ingestion readiness workflow on main to apply migrations, ingest all configured stores, export the DB-backed snapshot, and verify deployed readiness.'
    });
  }
  return actions;
}

async function runManagementSqlDiagnostic(env, options = {}) {
  const token = env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = env.SUPABASE_PROJECT_REF?.trim();
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiBaseUrl = (options.apiBaseUrl ?? SUPABASE_MANAGEMENT_API_BASE_URL).replace(/\/$/, '');
  const queryUrl = `${apiBaseUrl}/projects/${projectRef}/database/query`;
  const result = await fetchJson(fetchImpl, queryUrl, token, {
    method: 'POST',
    body: JSON.stringify({ query: 'select now() as groceryview_recovery_probe', read_only: false })
  });
  return {
    status: result.ok ? 'ready' : 'blocked',
    endpoint: `/projects/${projectRef}/database/query`,
    httpStatus: result.status,
    result: result.body
  };
}

export async function createProductionDbRecoveryPacket(env = process.env, options = {}) {
  const token = env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = env.SUPABASE_PROJECT_REF?.trim();
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required.');
  if (!projectRef) throw new Error('SUPABASE_PROJECT_REF is required.');

  const health = await checkSupabaseProjectHealth(
    { ...env, SUPABASE_HEALTH_SERVICES: env.SUPABASE_HEALTH_SERVICES ?? 'db,db_postgres_user,pooler,rest' },
    options
  ).catch((error) => ({
    status: 'blocked',
    projectRef,
    blockers: ['supabase_health_check_failed'],
    error: redact(error instanceof Error ? error.message : String(error))
  }));

  const queryDiagnostic = await runManagementSqlDiagnostic(env, options).catch((error) => ({
    status: 'blocked',
    endpoint: `/projects/${projectRef}/database/query`,
    error: redact(error instanceof Error ? error.message : String(error))
  }));

  const blockers = [
    ...(health.blockers ?? []),
    ...(queryDiagnostic.status === 'ready' ? [] : ['supabase_management_sql_unavailable'])
  ];

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    projectRef,
    projectName: health.projectName,
    projectStatus: health.projectStatus,
    region: health.region,
    evidence: {
      health,
      managementSqlProbe: queryDiagnostic,
      recentDailyReadinessRun: env.GITHUB_RUN_ID ? { runId: env.GITHUB_RUN_ID } : undefined
    },
    blockers,
    recommendedActions: buildRecommendedActions(health, queryDiagnostic),
    completionGate: 'Do not run production migrations or all-store daily ingestion against the production DATABASE_URL until this packet status is ready, or until a replacement DB passes the Production DB cutover validation workflow and DATABASE_URL is updated to that validated target.'
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await createProductionDbRecoveryPacket(process.env);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'ready') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
