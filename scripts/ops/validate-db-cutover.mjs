#!/usr/bin/env node
import process from 'node:process';

import { checkDailyDatabaseConnectivity, classifyDatabaseUrl, redactDatabaseUrl } from './check-daily-db-connectivity.mjs';

function sameNormalizedUrl(left, right) {
  if (!left || !right) return false;
  try {
    const l = new URL(left);
    const r = new URL(right);
    l.password = '';
    r.password = '';
    return l.toString() === r.toString();
  } catch {
    return left === right;
  }
}

function candidateProjectRef(classification) {
  const usernameMatch = classification.username.match(/^postgres\.([a-z0-9]{20})$/i);
  if (usernameMatch) return usernameMatch[1];
  const hostMatch = classification.host.match(/^db\.([a-z0-9]{20})\.supabase\.co$/i);
  if (hostMatch) return hostMatch[1];
  return null;
}

export async function validateDatabaseCutover(env = process.env, options = {}) {
  const candidateUrl = env.REPLACEMENT_DATABASE_URL?.trim() || env.CANDIDATE_DATABASE_URL?.trim();
  if (!candidateUrl) throw new Error('REPLACEMENT_DATABASE_URL is required.');
  const currentUrl = env.DATABASE_URL?.trim();
  if (currentUrl && sameNormalizedUrl(currentUrl, candidateUrl)) {
    return {
      status: 'blocked',
      generatedAt: options.generatedAt ?? new Date().toISOString(),
      blockers: ['replacement_database_url_matches_current_database_url'],
      candidate: classifyDatabaseUrl(candidateUrl),
      current: { redactedUrl: redactDatabaseUrl(currentUrl) },
      nextActions: ['Provide a distinct writable replacement DATABASE_URL before changing production secrets.']
    };
  }

  const connectivity = await checkDailyDatabaseConnectivity(
    {
      ...env,
      DATABASE_URL: candidateUrl,
      GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS: env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS ?? '3',
      GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS: env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS ?? '1000',
      GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS: env.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS ?? '5000'
    },
    options
  );
  const candidate = classifyDatabaseUrl(candidateUrl);
  const blockers = connectivity.status === 'ready' ? [] : ['replacement_database_not_writable', ...(connectivity.blockers ?? [])];
  const projectRef = candidateProjectRef(candidate);
  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    candidate: {
      ...candidate,
      ...(projectRef ? { projectRef } : {})
    },
    connectivity,
    blockers,
    nextActions: blockers.length === 0
      ? [
          'Store REPLACEMENT_DATABASE_URL securely as the repository DATABASE_URL secret.',
          'Run npm run ops:apply-db-migrations with the replacement DATABASE_URL.',
          'Run npm run ops:db-recovery-packet and npm run ops:check-daily-db-connectivity against the replacement DATABASE_URL.',
          'Rerun the Daily ingestion readiness workflow on main and verify ingestion, DB snapshot, and deployed readiness artifacts.'
        ]
      : [
          'Do not update production DATABASE_URL yet.',
          'Fix or replace the candidate database until ops:validate-db-cutover reports ready.'
        ]
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await validateDatabaseCutover(process.env);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'ready') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
