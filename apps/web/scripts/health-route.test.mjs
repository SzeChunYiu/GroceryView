import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('web health API route', () => {
  it('returns the health contract with a fast bounded DB ping and no secret leakage', async () => {
    const route = await read('src/app/api/health/route.ts');

    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /export async function GET/);
    assert.match(route, /status: 'ok'/);
    assert.match(route, /version: packageJson\.version/);
    assert.match(route, /time: new Date\(\)\.toISOString\(\)/);
    assert.match(route, /db: await pingDatabase\(\)/);
    assert.match(route, /timeoutMs = 200/);
    assert.match(route, /pool\.query\('select 1'\)/);
    assert.match(route, /connectionTimeoutMillis: timeoutMs/);
    assert.match(route, /query_timeout: timeoutMs/);
    assert.match(route, /statement_timeout: timeoutMs/);
    assert.match(route, /return 'down'/);
    const responsePayload = route.match(/NextResponse\.json\(\{([\s\S]*?)\}\);/)?.[1] ?? '';
    assert.doesNotMatch(responsePayload, /DATABASE_URL|databaseUrl|connectionString/);
  });
});
