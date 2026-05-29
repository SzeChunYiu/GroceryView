import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('page experience reserves heavy surfaces and paginates search', () => {
  assert.match(read('src/components/public-ad-slot.tsx'), /min-h-\[|minHeight|reserved/i);
  assert.match(read('src/components/mvp/visual-intelligence.tsx'), /min-h-|h-48|aspect-|overflow-hidden/);
  assert.match(read('src/app/map/page.tsx'), /ChartTableFallback|MapNearbyStorePreviews|fallback/i);
  assert.match(read('src/app/search/page.tsx'), /SEARCH_PAGE_SIZE|nextOffset|previousOffset/);
});

test('core web vitals reporter does not block navigation', () => {
  assert.match(read('src/components/core-web-vitals-reporter.tsx'), /sendBeacon|requestIdleCallback|setTimeout/);
});
