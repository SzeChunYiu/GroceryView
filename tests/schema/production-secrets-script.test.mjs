import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const scriptPath = new URL('../../scripts/ops/check-production-secrets.mjs', import.meta.url);
const script = readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('production secret audit script', () => {
  it('tracks every secret needed by daily ingestion and runtime readiness', () => {
    for (const secret of [
      'DATABASE_URL',
      'GROCERYVIEW_DAILY_CONNECTORS_JSON',
      'GROCERYVIEW_SERVER_URL',
      'METRICS_TOKEN',
      'AUTH_SECRET',
      'PUBLIC_WEB_URL',
      'NOTIFICATION_WEBHOOK_SECRET',
      'BILLING_WEBHOOK_SECRET',
      'CATALOG_COVERAGE_TARGETS_JSON'
    ]) {
      assert.match(script, new RegExp(`['"]${secret}['"]`));
    }
    assert.equal(pkg.scripts['ops:check-production-secrets'], 'node scripts/ops/check-production-secrets.mjs');
  });

  it('self-test reports missing required secrets', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), { missing: ['METRICS_TOKEN'] });
  });
});
