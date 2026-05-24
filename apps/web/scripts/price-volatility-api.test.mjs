import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadVolatilityRoute() {
  const source = await readFile(new URL('../src/app/api/pricing/volatility/route.ts', import.meta.url), 'utf8');
  const executable = source
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = { json: (body, init) => Response.json(body, init) };')
    .replace('export function GET(request: Request)', 'function GET(request)');

  return Function(`${executable}; return { GET };`)();
}

test('pricing volatility route returns 304 for matching ETag with stable cache headers', async () => {
  const { GET } = await loadVolatilityRoute();
  const url = 'https://groceryview.test/api/pricing/volatility';
  const firstResponse = await GET(new Request(url));

  assert.equal(firstResponse.status, 200);
  const etag = firstResponse.headers.get('etag');
  const cacheControl = firstResponse.headers.get('cache-control');
  assert.ok(etag);
  assert.ok(cacheControl);

  const conditionalResponse = await GET(new Request(url, { headers: { 'If-None-Match': etag } }));

  assert.equal(conditionalResponse.status, 304);
  assert.equal(conditionalResponse.headers.get('etag'), etag);
  assert.equal(conditionalResponse.headers.get('cache-control'), cacheControl);
  assert.equal(await conditionalResponse.text(), '');
});
