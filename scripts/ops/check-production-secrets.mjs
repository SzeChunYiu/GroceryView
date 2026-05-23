#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import process from 'node:process';

export const requiredGithubActionSecrets = [
  'DATABASE_URL',
  'GROCERYVIEW_SERVER_URL',
  'GROCERYVIEW_API_BASE_URL',
  'EXPO_TOKEN',
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'METRICS_TOKEN',
  'GROCERYVIEW_SCANNER_BEARER_TOKEN'
];

export const requiredGithubActionVariables = [
  'GROCERYVIEW_PRODUCTION_URL',
  'GROCERYVIEW_TERMINAL_PRODUCT_ID',
  'GROCERYVIEW_SCANNER_USER_ID'
];

export const requiredDbCutoverSecrets = [
  'DATABASE_URL'
];

export const replacementDbCandidateSecrets = [
  'REPLACEMENT_DATABASE_URL',
  'CANDIDATE_DATABASE_URL'
];

export const requiredDbRecoverySecrets = [
  'SUPABASE_ACCESS_TOKEN'
];

export const requiredDbRecoveryVariables = [
  'SUPABASE_PROJECT_REF'
];

export const requiredRuntimeSecrets = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'PUBLIC_WEB_URL',
  'NOTIFICATION_WEBHOOK_SECRET',
  'EXPO_PUSH_ACCESS_TOKEN',
  'SENDGRID_FROM_EMAIL',
  'SENDGRID_API_KEY',
  'BILLING_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_PREMIUM_MONTHLY',
  'STRIPE_PRICE_PREMIUM_YEARLY',
  'METRICS_TOKEN',
  'OCR_SPACE_API_KEY',
  'OCR_SPACE_HEALTHCHECK_IMAGE_URL',
  'OPENFOODFACTS_USER_AGENT',
  'OPENFOODFACTS_HEALTHCHECK_BARCODE',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN',
  'CATALOG_COVERAGE_TARGETS_JSON'
];

export function findMissingSecrets(requiredNames, listedNames) {
  const listed = new Set(listedNames);
  return requiredNames.filter((name) => !listed.has(name));
}

function uniqueSecretNames() {
  return Array.from(new Set([
    ...requiredGithubActionSecrets,
    ...requiredRuntimeSecrets,
    ...requiredDbCutoverSecrets,
    ...replacementDbCandidateSecrets,
    ...requiredDbRecoverySecrets
  ]));
}

function uniqueVariableNames() {
  return Array.from(new Set([...requiredGithubActionVariables, ...requiredDbRecoveryVariables]));
}

function hasAnySecret(candidateNames, listedNames) {
  const listed = new Set(listedNames);
  return candidateNames.some((name) => listed.has(name));
}

function parseGhList(output) {
  return output
    .split('\n')
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function readGithubNames(kind, repo, environment) {
  const args = [kind, 'list'];
  if (repo) args.push('--repo', repo);
  const names = new Set(parseGhList(execFileSync('gh', args, { encoding: 'utf8' })));
  if (environment) {
    const environmentArgs = [...args];
    environmentArgs.push('--env', environment);
    for (const name of parseGhList(execFileSync('gh', environmentArgs, { encoding: 'utf8' }))) {
      names.add(name);
    }
  }
  return Array.from(names);
}

function readGithubSecretNames(repo, environment) {
  return readGithubNames('secret', repo, environment);
}

function readGithubVariableNames(repo, environment) {
  return readGithubNames('variable', repo, environment);
}

function readEnvironmentSecretNames(requiredNames) {
  return requiredNames.filter((name) => {
    const value = process.env[name];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function scopeStatus(scope, checks) {
  if (scope === 'db-recovery') {
    return checks.missingDbRecoverySecrets.length === 0 && checks.missingDbRecoveryVariables.length === 0
      ? 'ready'
      : 'blocked';
  }
  if (scope === 'db-cutover') {
    return checks.missingDbCutoverSecrets.length === 0 && checks.missingDbCutoverCandidateSecrets.length === 0
      ? 'ready'
      : 'blocked';
  }
  return checks.missingGithubActionSecrets.length === 0 &&
    checks.missingGithubActionVariables.length === 0 &&
    checks.missingRuntimeSecrets.length === 0 &&
    checks.missingDbCutoverSecrets.length === 0 &&
    checks.missingDbCutoverCandidateSecrets.length === 0 &&
    checks.missingDbRecoverySecrets.length === 0 &&
    checks.missingDbRecoveryVariables.length === 0
    ? 'ready'
    : 'blocked';
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readScope() {
  const scope = readOption('--scope') ?? 'all';
  const supportedScopes = new Set(['all', 'db-recovery', 'db-cutover']);
  if (!supportedScopes.has(scope)) {
    throw new Error(`Unsupported --scope ${scope}. Expected one of: ${Array.from(supportedScopes).join(', ')}.`);
  }
  return scope;
}

function main() {
  if (process.argv.includes('--self-test')) {
    const missing = findMissingSecrets(['DATABASE_URL', 'METRICS_TOKEN'], ['DATABASE_URL']);
    process.stdout.write(`${JSON.stringify({ missing })}\n`);
    return;
  }

  const fromEnvironment = process.argv.includes('--from-env');
  const repo = readOption('--repo');
  const environment = readOption('--env');
  const scope = readScope();
  const secretNames = fromEnvironment ? readEnvironmentSecretNames(uniqueSecretNames()) : readGithubSecretNames(repo, environment);
  const variableNames = fromEnvironment
    ? readEnvironmentSecretNames(uniqueVariableNames())
    : readGithubVariableNames(repo, environment);
  const missingGithubActionSecrets = findMissingSecrets(requiredGithubActionSecrets, secretNames);
  const missingGithubActionVariables = findMissingSecrets(requiredGithubActionVariables, variableNames);
  const missingRuntimeSecrets = findMissingSecrets(requiredRuntimeSecrets, secretNames);
  const missingDbCutoverSecrets = findMissingSecrets(requiredDbCutoverSecrets, secretNames);
  const hasReplacementDbCandidate = hasAnySecret(replacementDbCandidateSecrets, secretNames);
  const missingDbCutoverCandidateSecrets = hasReplacementDbCandidate ? [] : replacementDbCandidateSecrets;
  const missingDbRecoverySecrets = findMissingSecrets(requiredDbRecoverySecrets, secretNames);
  const missingDbRecoveryVariables = findMissingSecrets(requiredDbRecoveryVariables, variableNames);
  const checks = {
    missingGithubActionSecrets,
    missingGithubActionVariables,
    missingRuntimeSecrets,
    missingDbCutoverSecrets,
    missingDbCutoverCandidateSecrets,
    missingDbRecoverySecrets,
    missingDbRecoveryVariables
  };
  const result = {
    status: scopeStatus(scope, checks),
    scope,
    checkedSecretNames: secretNames.sort(),
    checkedVariableNames: variableNames.sort(),
    environment: environment ?? null,
    source: fromEnvironment ? 'environment' : 'github',
    missingGithubActionSecrets,
    missingGithubActionVariables,
    missingRuntimeSecrets,
    missingDbCutoverSecrets,
    replacementDbCandidateSecrets,
    hasReplacementDbCandidate,
    missingDbCutoverCandidateSecrets,
    missingDbRecoverySecrets,
    missingDbRecoveryVariables
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== 'ready') process.exitCode = 1;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
