import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  findMissingRuntimeSecrets,
  isSupabaseManagementAccessTokenShape,
  requiredRuntimeSecrets,
  runtimeSecretsSatisfiableByVariables
} from '../../scripts/ops/check-production-secrets.mjs';

const scriptPath = new URL('../../scripts/ops/check-production-secrets.mjs', import.meta.url);
const script = readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('production secret audit script', () => {
  it('tracks every secret needed by daily ingestion and runtime readiness', () => {
    for (const secret of [
      'DATABASE_URL',
      'REPLACEMENT_DATABASE_URL',
      'CANDIDATE_DATABASE_URL',
      'SUPABASE_ACCESS_TOKEN',
      'SUPABASE_PROJECT_REF',
      'GROCERYVIEW_SERVER_URL',
      'GROCERYVIEW_API_BASE_URL',
      'EXPO_TOKEN',
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'METRICS_TOKEN',
      'RESEND_API_KEY',
      'WEEKLY_DIGEST_FROM_EMAIL',
      'GROCERYVIEW_SCANNER_BEARER_TOKEN',
      'AUTH_SECRET',
      'PUBLIC_WEB_URL',
      'NOTIFICATION_WEBHOOK_SECRET',
      'EXPO_PUSH_ACCESS_TOKEN',
      'SENDGRID_FROM_EMAIL',
      'SENDGRID_API_KEY',
      'BILLING_WEBHOOK_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_PRICE_PREMIUM_MONTHLY',
      'STRIPE_PRICE_PREMIUM_YEARLY',
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
    ]) {
      assert.match(script, new RegExp(`['"]${secret}['"]`));
    }
    assert.doesNotMatch(script, /['"]GROCERYVIEW_DAILY_CONNECTORS_JSON['"]/);
    for (const variable of [
      'GROCERYVIEW_PRODUCTION_URL',
      'GROCERYVIEW_TERMINAL_PRODUCT_ID',
      'GROCERYVIEW_SCANNER_USER_ID'
    ]) {
      assert.match(script, new RegExp(`['"]${variable}['"]`));
    }
    assert.match(script, /readOption\('--env'\)/);
    assert.match(script, /process\.argv\.includes\('--from-env'\)/);
    assert.match(script, /readOption\('--scope'\)/);
    assert.match(script, /process\.env\[name\]/);
    assert.match(script, /push\('--env', environment\)/);
    assert.match(script, /new Set\(parseGhList/);
    assert.match(script, /readGithubNames\('variable'/);
    assert.equal(pkg.scripts['ops:check-production-secrets'], 'node scripts/ops/check-production-secrets.mjs');
  });

  it('can audit injected workflow secret environment values without listing repository secrets', () => {
    const result = spawnSync(process.execPath, [scriptPath.pathname, '--from-env'], {
      encoding: 'utf8',
      env: {
        DATABASE_URL: 'postgres://example',
        METRICS_TOKEN: 'metrics-token'
      }
    });
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    const output = JSON.parse(result.stdout);
    assert.equal(output.source, 'environment');
    assert.deepEqual(output.checkedSecretNames, ['DATABASE_URL', 'METRICS_TOKEN']);
    assert.deepEqual(output.checkedVariableNames, []);
    assert.deepEqual(output.missingGithubActionVariables, [
      'GROCERYVIEW_PRODUCTION_URL',
      'GROCERYVIEW_TERMINAL_PRODUCT_ID'
    ]);
    assert.deepEqual(output.missingGithubActionSecrets, [
      'GROCERYVIEW_SERVER_URL',
      'GROCERYVIEW_API_BASE_URL',
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'WEEKLY_DIGEST_FROM_EMAIL',
      'GROCERYVIEW_SCANNER_BEARER_TOKEN'
    ]);
    assert.ok(output.pendingRuntimeSecretsMissing.includes('STRIPE_SECRET_KEY'));
    assert.deepEqual(output.replacementDbCandidateSecrets, ['REPLACEMENT_DATABASE_URL', 'CANDIDATE_DATABASE_URL']);
    assert.equal(output.hasReplacementDbCandidate, false);
    assert.deepEqual(output.missingDbCutoverCandidateSecrets, ['REPLACEMENT_DATABASE_URL', 'CANDIDATE_DATABASE_URL']);
    assert.deepEqual(output.missingDbRecoverySecrets, ['SUPABASE_ACCESS_TOKEN']);
    assert.deepEqual(output.missingDbRecoveryVariables, ['SUPABASE_PROJECT_REF']);
    assert.deepEqual(output.invalidDbRecoverySecrets, []);
    assert.equal(output.dbRecoverySecretValidation.validated, true);
  });

  it('requires a Supabase Management API personal access token shape for DB recovery', () => {
    assert.equal(isSupabaseManagementAccessTokenShape('sbp_secret'), true);
    assert.equal(isSupabaseManagementAccessTokenShape(' sbp_secret\n'), true);
    assert.equal(isSupabaseManagementAccessTokenShape('go-k_keychain_session_value'), false);
    assert.equal(isSupabaseManagementAccessTokenShape('service_role.jwt.payload'), false);
    assert.equal(isSupabaseManagementAccessTokenShape('sb_publishable_example'), false);
  });

  it('treats only selected runtime secrets as satisfiable by GitHub variables', () => {
    const listedSecrets = requiredRuntimeSecrets.filter((name) => !runtimeSecretsSatisfiableByVariables.includes(name));
    const missingWithVariables = findMissingRuntimeSecrets(
      requiredRuntimeSecrets,
      listedSecrets,
      runtimeSecretsSatisfiableByVariables
    );
    assert.deepEqual(missingWithVariables, []);

    const [variableBackedName] = runtimeSecretsSatisfiableByVariables;
    const missingWithoutVariable = findMissingRuntimeSecrets(
      requiredRuntimeSecrets,
      listedSecrets,
      runtimeSecretsSatisfiableByVariables.filter((name) => name !== variableBackedName)
    );
    assert.deepEqual(missingWithoutVariable, [variableBackedName]);
  });

  it('accepts runtime readiness values supplied as GitHub variables when the workflow supports vars or secrets', async () => {
    const productionSecrets = await import(scriptPath.href);
    const variableBackedRuntimeNames = runtimeSecretsSatisfiableByVariables;
    assert.ok(variableBackedRuntimeNames.includes('PUBLIC_WEB_URL'));
    assert.ok(variableBackedRuntimeNames.includes('GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN'));
    const fakeSecretNames = new Set([
      ...productionSecrets.requiredGithubActionSecrets,
      ...productionSecrets.requiredRuntimeSecrets,
      ...productionSecrets.requiredDbCutoverSecrets,
      ...productionSecrets.requiredDbRecoverySecrets,
      productionSecrets.replacementDbCandidateSecrets[0]
    ]);
    for (const name of variableBackedRuntimeNames) fakeSecretNames.delete(name);
    const fakeVariableNames = new Set([
      ...productionSecrets.requiredGithubActionVariables,
      ...productionSecrets.requiredDbRecoveryVariables,
      ...variableBackedRuntimeNames
    ]);
    const tempDir = mkdtempSync(join(tmpdir(), 'groceryview-fake-gh-'));
    try {
      const fakeGhPath = join(tempDir, 'gh');
      writeFileSync(fakeGhPath, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'secret' && args[1] === 'list') {
  process.stdout.write(process.env.FAKE_GH_SECRETS.split(',').filter(Boolean).map((name) => name + '\\t2026-05-23T00:00:00Z').join('\\n'));
  process.exit(0);
}
if (args[0] === 'variable' && args[1] === 'list') {
  process.stdout.write(process.env.FAKE_GH_VARIABLES.split(',').filter(Boolean).map((name) => name + '\\t2026-05-23T00:00:00Z').join('\\n'));
  process.exit(0);
}
process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
process.exit(1);
`);
      chmodSync(fakeGhPath, 0o755);
      const result = spawnSync(process.execPath, [scriptPath.pathname], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${tempDir}:${process.env.PATH}`,
          FAKE_GH_SECRETS: Array.from(fakeSecretNames).join(','),
          FAKE_GH_VARIABLES: Array.from(fakeVariableNames).join(',')
        }
      });
      assert.equal(result.stderr, '');
      const output = JSON.parse(result.stdout);
      assert.equal(result.status, 0);
      assert.equal(output.status, 'ready');
      for (const name of variableBackedRuntimeNames) {
        assert.equal(output.checkedSecretNames.includes(name), false);
        assert.equal(output.checkedVariableNames.includes(name), true);
        assert.equal(output.missingRuntimeSecrets.includes(name), false);
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });


  it('treats either replacement DB candidate secret as satisfying cutover candidate readiness', () => {
    const result = spawnSync(process.execPath, [scriptPath.pathname, '--from-env'], {
      encoding: 'utf8',
      env: {
        DATABASE_URL: 'postgres://current',
        CANDIDATE_DATABASE_URL: 'postgres://candidate',
        SUPABASE_ACCESS_TOKEN: 'sbp_secret',
        SUPABASE_PROJECT_REF: 'dgsoqwanrkqgdichtgzl'
      }
    });
    const output = JSON.parse(result.stdout);
    assert.equal(output.hasReplacementDbCandidate, true);
    assert.deepEqual(output.missingDbCutoverSecrets, []);
    assert.deepEqual(output.missingDbCutoverCandidateSecrets, []);
    assert.deepEqual(output.missingDbRecoverySecrets, []);
    assert.deepEqual(output.missingDbRecoveryVariables, []);
    assert.deepEqual(output.invalidDbRecoverySecrets, []);
    assert.equal(JSON.stringify(output).includes('postgres://candidate'), false);
    assert.equal(JSON.stringify(output).includes('sbp_secret'), false);
  });

  it('can focus status on DB recovery prerequisites without unrelated deploy blockers', () => {
    const result = spawnSync(process.execPath, [scriptPath.pathname, '--from-env', '--scope', 'db-recovery'], {
      encoding: 'utf8',
      env: {
        SUPABASE_PROJECT_REF: 'dgsoqwanrkqgdichtgzl'
      }
    });
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    const output = JSON.parse(result.stdout);
    assert.equal(output.scope, 'db-recovery');
    assert.equal(output.status, 'blocked');
    assert.deepEqual(output.missingDbRecoverySecrets, ['SUPABASE_ACCESS_TOKEN']);
    assert.deepEqual(output.missingDbRecoveryVariables, []);
    assert.deepEqual(output.invalidDbRecoverySecrets, []);

    const invalidTokenResult = spawnSync(process.execPath, [scriptPath.pathname, '--from-env', '--scope', 'db-recovery'], {
      encoding: 'utf8',
      env: {
        SUPABASE_PROJECT_REF: 'dgsoqwanrkqgdichtgzl',
        SUPABASE_ACCESS_TOKEN: 'go-k_keychain_session_value'
      }
    });
    const invalidTokenOutput = JSON.parse(invalidTokenResult.stdout);
    assert.equal(invalidTokenResult.status, 1);
    assert.equal(invalidTokenOutput.scope, 'db-recovery');
    assert.equal(invalidTokenOutput.status, 'blocked');
    assert.equal(invalidTokenOutput.blocker, 'db_recovery_secret_invalid_format');
    assert.deepEqual(invalidTokenOutput.missingDbRecoverySecrets, []);
    assert.deepEqual(invalidTokenOutput.missingDbRecoveryVariables, []);
    assert.deepEqual(invalidTokenOutput.invalidDbRecoverySecrets, ['SUPABASE_ACCESS_TOKEN']);
    assert.match(invalidTokenOutput.dbRecoverySecretValidation.requirement, /sbp_/);
    assert.equal(JSON.stringify(invalidTokenOutput).includes('go-k_keychain_session_value'), false);

    const readyResult = spawnSync(process.execPath, [scriptPath.pathname, '--from-env', '--scope', 'db-recovery'], {
      encoding: 'utf8',
      env: {
        SUPABASE_PROJECT_REF: 'dgsoqwanrkqgdichtgzl',
        SUPABASE_ACCESS_TOKEN: 'sbp_secret'
      }
    });
    const readyOutput = JSON.parse(readyResult.stdout);
    assert.equal(readyResult.status, 0);
    assert.equal(readyOutput.scope, 'db-recovery');
    assert.equal(readyOutput.status, 'ready');
    assert.equal(readyOutput.missingGithubActionSecrets.length > 0, true);
    assert.equal(readyOutput.missingRuntimeSecrets.length > 0, true);
    assert.deepEqual(readyOutput.invalidDbRecoverySecrets, []);
  });

  it('can focus status on DB cutover prerequisites and either candidate secret', () => {
    const result = spawnSync(process.execPath, [scriptPath.pathname, '--from-env', '--scope', 'db-cutover'], {
      encoding: 'utf8',
      env: {
        DATABASE_URL: 'postgres://current',
        SUPABASE_ACCESS_TOKEN: 'not-a-management-token'
      }
    });
    assert.equal(result.status, 1);
    const output = JSON.parse(result.stdout);
    assert.equal(output.scope, 'db-cutover');
    assert.equal(output.status, 'blocked');
    assert.equal(output.blocker, 'db_cutover_prerequisites_missing');
    assert.deepEqual(output.missingDbCutoverSecrets, []);
    assert.deepEqual(output.missingDbCutoverCandidateSecrets, ['REPLACEMENT_DATABASE_URL', 'CANDIDATE_DATABASE_URL']);
    assert.deepEqual(output.invalidDbRecoverySecrets, ['SUPABASE_ACCESS_TOKEN']);

    const readyResult = spawnSync(process.execPath, [scriptPath.pathname, '--from-env', '--scope', 'db-cutover'], {
      encoding: 'utf8',
      env: {
        DATABASE_URL: 'postgres://current',
        REPLACEMENT_DATABASE_URL: 'postgres://replacement'
      }
    });
    const readyOutput = JSON.parse(readyResult.stdout);
    assert.equal(readyResult.status, 0);
    assert.equal(readyOutput.scope, 'db-cutover');
    assert.equal(readyOutput.status, 'ready');
    assert.deepEqual(readyOutput.missingDbCutoverSecrets, []);
    assert.deepEqual(readyOutput.missingDbCutoverCandidateSecrets, []);
  });


  it('self-test reports missing required secrets', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), { missing: ['METRICS_TOKEN'] });
  });
});
