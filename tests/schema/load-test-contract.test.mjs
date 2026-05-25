import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const scriptPath = new URL('../../scripts/load/products-api-10k.js', import.meta.url);
const docsPath = new URL('../../docs/testing/load.md', import.meta.url);

test('load test contract documents and enforces the 10k /api/products gate', async () => {
  const [script, docs] = await Promise.all([
    readFile(scriptPath, 'utf8'),
    readFile(docsPath, 'utf8')
  ]);

  assert.match(script, /from 'k6\/http'/);
  assert.match(script, /VUS \|\| '10000'/);
  assert.match(script, /\/api\/products\?q=/);
  assert.match(script, /http_req_duration\{endpoint:products\}': \['p\(95\)<800'\]/);
  assert.match(script, /http_req_failed\{endpoint:products\}': \['rate<0\.001'\]/);
  assert.match(script, /products API returns HTTP 200/);
  assert.match(script, /products API payload has results array/);

  assert.match(docs, /10,000 concurrent virtual users/);
  assert.match(docs, /scripts\/load\/products-api-10k\.js/);
  assert.match(docs, /GET \/api\/products/);
  assert.match(docs, /p95 latency under 800 ms/);
  assert.match(docs, /error rate under 0\.1%/);
  assert.match(docs, /k6 run scripts\/load\/products-api-10k\.js/);
});
