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
  'METRICS_TOKEN'
];

export const requiredRuntimeSecrets = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'PUBLIC_WEB_URL',
  'NOTIFICATION_WEBHOOK_SECRET',
  'BILLING_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_PREMIUM_MONTHLY',
  'STRIPE_PRICE_PREMIUM_YEARLY',
  'METRICS_TOKEN',
  'CATALOG_COVERAGE_TARGETS_JSON'
];

export function findMissingSecrets(requiredNames, listedNames) {
  const listed = new Set(listedNames);
  return requiredNames.filter((name) => !listed.has(name));
}

function parseGhSecretList(output) {
  return output
    .split('\n')
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function readGithubSecretNames(repo, environment) {
  const args = ['secret', 'list'];
  if (repo) args.push('--repo', repo);
  const names = new Set(parseGhSecretList(execFileSync('gh', args, { encoding: 'utf8' })));
  if (environment) {
    const environmentArgs = [...args];
    environmentArgs.push('--env', environment);
    for (const name of parseGhSecretList(execFileSync('gh', environmentArgs, { encoding: 'utf8' }))) {
      names.add(name);
    }
  }
  return Array.from(names);
}

function main() {
  if (process.argv.includes('--self-test')) {
    const missing = findMissingSecrets(['DATABASE_URL', 'METRICS_TOKEN'], ['DATABASE_URL']);
    process.stdout.write(`${JSON.stringify({ missing })}\n`);
    return;
  }

  const repoIndex = process.argv.indexOf('--repo');
  const repo = repoIndex >= 0 ? process.argv[repoIndex + 1] : undefined;
  const envIndex = process.argv.indexOf('--env');
  const environment = envIndex >= 0 ? process.argv[envIndex + 1] : undefined;
  const secretNames = readGithubSecretNames(repo, environment);
  const missingGithubActionSecrets = findMissingSecrets(requiredGithubActionSecrets, secretNames);
  const missingRuntimeSecrets = findMissingSecrets(requiredRuntimeSecrets, secretNames);
  const result = {
    status: missingGithubActionSecrets.length === 0 && missingRuntimeSecrets.length === 0 ? 'ready' : 'blocked',
    checkedSecretNames: secretNames.sort(),
    environment: environment ?? null,
    missingGithubActionSecrets,
    missingRuntimeSecrets
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
