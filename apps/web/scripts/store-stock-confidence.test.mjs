import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('store product rows expose stock confidence from source freshness and observations', async () => {
  const row = await read('src/components/store-product-row.tsx');
  const freshness = await read('src/lib/freshness.ts');
  const sourceHealth = await read('src/lib/source-health.ts');

  assert.match(freshness, /stockConfidenceFreshnessWindows/);
  assert.match(freshness, /isStockFreshEnoughForTravel/);
  assert.match(sourceHealth, /export type StockConfidenceState = "in-stock" \| "uncertain" \| "stale"/);
  assert.match(sourceHealth, /getStockConfidenceIndicator/);
  assert.match(sourceHealth, /recentObservationCount/);
  assert.match(sourceHealth, /shouldWarnBeforeTravel/);
  assert.match(sourceHealth, /Verify before travelling/);

  assert.match(row, /getStockConfidenceIndicator/);
  assert.match(row, /data-stock-confidence/);
  assert.match(row, /StockConfidenceBadge/);
  assert.match(row, /isAvailable\?: boolean \| null/);
  assert.match(row, /observedAt\?: string \| null/);
  assert.match(row, /sourceRetrievedAt\?: string \| null/);
  assert.match(row, /recentObservationCount\?: number \| null/);
  assert.match(row, /"in-stock": "border-emerald-200/);
  assert.match(row, /uncertain: "border-amber-200/);
  assert.match(row, /stale: "border-rose-200/);
});
