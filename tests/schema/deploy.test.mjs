import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../../deploy/groceryview.manifest.json', import.meta.url), 'utf8'));

describe('deployment manifest', () => {
  it('declares web and server services with health checks and required env', () => {
    assert.deepEqual(manifest.services.map((service) => service.name), ['groceryview-server', 'groceryview-web']);
    const server = manifest.services[0];
    assert.equal(server.healthCheck.path, '/api/health');
    assert.deepEqual(server.requiredEnv, ['AUTH_SECRET', 'DATABASE_URL', 'PUBLIC_WEB_URL']);
  });
});
