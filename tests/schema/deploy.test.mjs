import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../../deploy/groceryview.manifest.json', import.meta.url), 'utf8'));
const deployWorkflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const visibleArtifactScript = readFileSync(new URL('../../apps/web/scripts/check-production-visible-artifact.mjs', import.meta.url), 'utf8');

describe('deployment manifest', () => {
  it('declares web and server services with health checks and required env', () => {
    assert.deepEqual(manifest.services.map((service) => service.name), ['groceryview-server', 'groceryview-web']);
    const server = manifest.services[0];
    assert.equal(server.healthCheck.path, '/api/health');
    assert.deepEqual(server.requiredEnv, [
      'AUTH_SECRET',
      'DATABASE_URL',
      'PUBLIC_WEB_URL',
      'NOTIFICATION_WEBHOOK_SECRET',
      'BILLING_WEBHOOK_SECRET',
      'METRICS_TOKEN',
      'CATALOG_COVERAGE_TARGETS_JSON'
    ]);
  });

  it('fails closed on a stale production visible artifact after deployment verification', () => {
    assert.match(deployWorkflow, /Verify production visible artifact/);
    assert.match(deployWorkflow, /apps\/web\/scripts\/check-production-visible-artifact\.mjs/);
    assert.match(deployWorkflow, /GROCERYVIEW_PRODUCTION_URL/);
    assert.match(visibleArtifactScript, /https:\/\/grocery-web-mu\.vercel\.app\//);
    assert.match(visibleArtifactScript, /willys-odenplan/);
    assert.match(visibleArtifactScript, /ica-nara-sergels-torg/);
    assert.match(visibleArtifactScript, /coop-swedenborgsgatan/);
    assert.match(visibleArtifactScript, /lidl-sveavagen/);
    assert.match(visibleArtifactScript, /process\.exitCode = 1/);
  });
});
