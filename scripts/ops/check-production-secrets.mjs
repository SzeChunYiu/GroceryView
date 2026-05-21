#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import process from 'node:process';

export const requiredGithubActionSecrets = [
  'DATABASE_URL',
  'GROCERYVIEW_DAILY_CONNECTORS_JSON',
  'GROCERYVIEW_SERVER_URL',
  'METRICS_TOKEN'
];

export const requiredRuntimeSecrets = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'PUBLIC_WEB_URL',
  'NOTIFICATION_WEBHOOK_SECRET',
  'BILLING_WEBHOOK_SECRET',
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

function readGithubSecretNames(repo) {
  const args = ['secret', 'list'];
  if (repo) args.push('--repo', repo);
  return parseGhSecretList(execFileSync('gh', args, { encoding: 'utf8' }));
}

function main() {
  if (process.argv.includes('--self-test')) {
    const missing = findMissingSecrets(['DATABASE_URL', 'METRICS_TOKEN'], ['DATABASE_URL']);
    process.stdout.write(`${JSON.stringify({ missing })}\n`);
    return;
  }

  const repoIndex = process.argv.indexOf('--repo');
  const repo = repoIndex >= 0 ? process.argv[repoIndex + 1] : undefined;
  const secretNames = readGithubSecretNames(repo);
  const missingGithubActionSecrets = findMissingSecrets(requiredGithubActionSecrets, secretNames);
  const missingRuntimeSecrets = findMissingSecrets(requiredRuntimeSecrets, secretNames);
  const result = {
    status: missingGithubActionSecrets.length === 0 && missingRuntimeSecrets.length === 0 ? 'ready' : 'blocked',
    checkedSecretNames: secretNames.sort(),
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
