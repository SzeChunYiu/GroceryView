import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('web health API route', () => {
  it('returns the health contract with a fast bounded DB ping and no secret leakage', async () => {
    const route = await read('src/app/api/health/route.ts');
    const health = await read('src/lib/health.ts');

    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /export async function GET/);
    assert.match(route, /status: 'ok'/);
    assert.match(route, /version: packageJson\.version/);
    assert.match(route, /time: new Date\(\)\.toISOString\(\)/);
    assert.match(route, /db: await pingDatabase\(\)/);
    assert.match(health, /export async function pingDatabase\(timeoutMs = 200\)/);
    assert.match(health, /pool\.query\('select 1'\)/);
    assert.match(health, /connectionTimeoutMillis: timeoutMs/);
    assert.match(health, /query_timeout: timeoutMs/);
    assert.match(health, /statement_timeout: timeoutMs/);
    assert.match(health, /return 'down'/);
    const responsePayload = route.match(/NextResponse\.json\(\{([\s\S]*?)\}\);/)?.[1] ?? '';
    assert.doesNotMatch(responsePayload, /DATABASE_URL|databaseUrl|connectionString/);
  });
});
