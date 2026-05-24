import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('health API route', () => {
  it('returns status, version, time, and a bounded database ping without new dependencies', async () => {
    const route = await read('src/app/api/health/route.ts');
    const packageJson = await read('package.json');

    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /export const dynamic = 'force-dynamic'/);
    assert.match(route, /DB_PING_TIMEOUT_MS = 175/);
    assert.match(route, /DATABASE_URL/);
    assert.match(route, /select 1/);
    assert.match(route, /Promise\.race/);
    assert.match(route, /status: 'ok'/);
    assert.match(route, /version: versionLabel\(\)/);
    assert.match(route, /time: new Date\(\)\.toISOString\(\)/);
    assert.match(route, /db/);
    assert.doesNotMatch(packageJson, /@sentry|prom-client|healthcheck/);
  });
});
