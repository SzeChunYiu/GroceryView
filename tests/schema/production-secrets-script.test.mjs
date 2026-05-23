import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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
    assert.match(script, /process\.argv\.indexOf\('--env'\)/);
    assert.match(script, /process\.argv\.includes\('--from-env'\)/);
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
      'GROCERYVIEW_TERMINAL_PRODUCT_ID',
      'GROCERYVIEW_SCANNER_USER_ID'
    ]);
    assert.deepEqual(output.missingGithubActionSecrets, [
      'GROCERYVIEW_SERVER_URL',
      'GROCERYVIEW_API_BASE_URL',
      'EXPO_TOKEN',
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'GROCERYVIEW_SCANNER_BEARER_TOKEN'
    ]);
    assert.ok(output.missingRuntimeSecrets.includes('STRIPE_SECRET_KEY'));
    assert.deepEqual(output.replacementDbCandidateSecrets, ['REPLACEMENT_DATABASE_URL', 'CANDIDATE_DATABASE_URL']);
    assert.equal(output.hasReplacementDbCandidate, false);
    assert.deepEqual(output.missingDbCutoverCandidateSecrets, ['REPLACEMENT_DATABASE_URL', 'CANDIDATE_DATABASE_URL']);
    assert.deepEqual(output.missingDbRecoverySecrets, ['SUPABASE_ACCESS_TOKEN']);
    assert.deepEqual(output.missingDbRecoveryVariables, ['SUPABASE_PROJECT_REF']);
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
    assert.equal(JSON.stringify(output).includes('postgres://candidate'), false);
    assert.equal(JSON.stringify(output).includes('sbp_secret'), false);
  });

  it('self-test reports missing required secrets', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), { missing: ['METRICS_TOKEN'] });
  });
});
