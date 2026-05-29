import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const checks = {
  adSlotReservesHeight: /min-h-\[|minHeight|reserved/i.test(read('src/components/public-ad-slot.tsx')),
  chartShellHasReservedFrame: /min-h-|h-48|aspect-|overflow-hidden/.test(read('src/components/mvp/visual-intelligence.tsx')),
  mapHasFallbackTable: /fallback table|ChartTableFallback|MapNearbyStorePreviews/i.test(read('src/app/map/page.tsx')),
  searchPagination: /SEARCH_PAGE_SIZE|nextOffset|previousOffset/.test(read('src/app/search/page.tsx')),
  analyticsNonBlocking: /sendBeacon|requestIdleCallback|setTimeout/.test(read('src/components/core-web-vitals-reporter.tsx'))
};
assert.deepEqual(Object.entries(checks).filter(([, ok]) => !ok), []);
console.log(JSON.stringify({ status: 'ok', checks }, null, 2));
