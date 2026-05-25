import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const freshness = new URL('../src/lib/freshness.ts', import.meta.url);
const transform = new URL('../src/lib/ingest/transform.ts', import.meta.url);
const row = new URL('../src/components/store-product-row.tsx', import.meta.url);

test('freshness helper derives likely, uncertain, and unavailable store stock states', async () => {
  const source = await readFile(freshness, 'utf8');

  assert.match(source, /export type StoreStockStatus = "likely_in_stock" \| "uncertain" \| "unavailable"/);
  assert.match(source, /export function getStoreStockStatus/);
  assert.match(source, /input\.isAvailable === false/);
  assert.match(source, /out\[-\\s\]\?of\[-\\s\]\?stock/);
  assert.match(source, /input\.isAvailable === true/);
  assert.match(source, /STOCK_RECENT_AFTER_DAYS/);
  assert.match(source, /Availability was positive, but the observation is old or missing a timestamp/);
  assert.match(source, /No recent source availability signal is available/);
});

test('ingest transform normalizes source stock signals alongside unit fields', async () => {
  const source = await readFile(transform, 'utf8');

  assert.match(source, /import \{ getStoreStockStatus, type StoreStockStatus \} from "\.\.\/freshness";/);
  assert.match(source, /export type IngestStockFields/);
  assert.match(source, /export type NormalizedIngestStockFields/);
  assert.match(source, /export function transformIngestedStockFields/);
  assert.match(source, /stockObservedAt = fields\.observedAt \?\? fields\.scrapedAt \?\? fields\.retrievedAt \?\? null/);
  assert.match(source, /stockStatus: badge\.status/);
  assert.match(source, /stockSourceSignals: sourceSignals/);
  assert.match(source, /transformIngestedStockFields\(product\)/);
});

test('store product rows render stock status badges from normalized or raw source signals', async () => {
  const source = await readFile(row, 'utf8');

  assert.match(source, /getStoreStockStatus/);
  assert.match(source, /stockStatus\?: StoreStockStatus/);
  assert.match(source, /stockStatusLabel\?: string/);
  assert.match(source, /stockStatusReason\?: string/);
  assert.match(source, /stockObservedAt\?: string \| number \| Date \| null/);
  assert.match(source, /stockBadgeClasses/);
  assert.match(source, /stockStatusCopy/);
  assert.match(source, /observedAt: observedAt \?\? stockObservedAt/);
  assert.match(source, /label: stockStatusLabel \?\? stockStatusCopy\[stockStatus\]\.label/);
  assert.match(source, /reason: stockStatusReason \?\? derivedStockStatus\.reason/);
  assert.match(source, /data-stock-status=\{stockBadge\.status\}/);
  assert.match(source, /aria-label=\{`\$\{stockBadge\.label\}\. \$\{stockBadge\.reason\}`\}/);
  assert.match(source, /Likely in stock/);
  assert.match(source, /Stock uncertain/);
  assert.match(source, /Unavailable/);
});
