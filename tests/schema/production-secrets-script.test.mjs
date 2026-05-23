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
      'GROCERYVIEW_SERVER_URL',
      'GROCERYVIEW_API_BASE_URL',
      'EXPO_TOKEN',
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'METRICS_TOKEN',
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
      'CATALOG_COVERAGE_TARGETS_JSON'
    ]) {
      assert.match(script, new RegExp(`['"]${secret}['"]`));
    }
    assert.doesNotMatch(script, /['"]GROCERYVIEW_DAILY_CONNECTORS_JSON['"]/);
    assert.match(script, /process\.argv\.indexOf\('--env'\)/);
    assert.match(script, /process\.argv\.includes\('--from-env'\)/);
    assert.match(script, /process\.env\[name\]/);
    assert.match(script, /push\('--env', environment\)/);
    assert.match(script, /new Set\(parseGhSecretList/);
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
    assert.deepEqual(output.missingGithubActionSecrets, [
      'GROCERYVIEW_SERVER_URL',
      'GROCERYVIEW_API_BASE_URL',
      'EXPO_TOKEN',
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID'
    ]);
    assert.ok(output.missingRuntimeSecrets.includes('STRIPE_SECRET_KEY'));
  });

  it('self-test reports missing required secrets', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), { missing: ['METRICS_TOKEN'] });
  });
});
