import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

const canonicalEvents = [
  'search_submitted',
  'search_filter_applied',
  'search_sort_changed',
  'search_result_clicked',
  'product_opened',
  'deal_card_clicked',
  'market_filter_changed',
  'market_heatmap_cell_clicked',
  'map_marker_selected',
  'preview_opened',
  'evidence_drawer_opened',
  'fuel_grade_selected',
  'pharmacy_otc_alert_set',
  'watchlist_item_added'
];

test('packages/metrics definitions align with data dictionary', async () => {
  const definitions = await read('../../packages/metrics/src/definitions.ts');
  const dictionary = await read('../../docs/data/metric-dictionary.md');

  assert.match(definitions, /canonicalDealScore/);
  assert.match(definitions, /weekly_change_pct/);
  assert.match(dictionary, /deal_score/);
});

test('analytics module exposes AnalyticsEvent contract and canonical event names', async () => {
  const analytics = await read('src/lib/analytics.ts');

  assert.match(analytics, /export type AnalyticsEvent = \{/);
  assert.match(analytics, /eventName: GroceryViewAnalyticsEventName/);
  assert.match(analytics, /sessionId: string/);
  assert.match(analytics, /pagePath: string/);
  assert.match(analytics, /export function trackGroceryViewEvent\(/);
  assert.match(analytics, /analyticsConsentGranted\(\)/);

  for (const eventName of canonicalEvents) {
    assert.match(analytics, new RegExp(`'${eventName}'`), `${eventName} should be canonical`);
  }
});

test('search, deals, market, and map pages wire groceryview surface analytics', async () => {
  const [searchPage, dealsPage, marketPage, mapPage, surfaceAnalytics, searchBar, storeMap] = await Promise.all([
    read('src/app/search/page.tsx'),
    read('src/app/deals/page.tsx'),
    read('src/app/market/page.tsx'),
    read('src/app/map/page.tsx'),
    read('src/components/analytics/groceryview-surface-analytics.tsx'),
    read('src/components/SearchBar.tsx'),
    read('src/components/store-map.tsx')
  ]);

  assert.match(surfaceAnalytics, /GroceryViewSurfaceAnalytics/);
  assert.match(surfaceAnalytics, /data-gv-event/);

  assert.match(searchPage, /data-gv-surface="search"/);
  assert.match(searchPage, /GroceryViewSurfaceAnalytics surface="search"/);
  assert.match(searchPage, /search_sort_changed/);
  assert.match(searchPage, /search_result_clicked/);

  assert.match(dealsPage, /data-gv-surface="deals"/);
  assert.match(dealsPage, /deal_card_clicked/);

  assert.match(marketPage, /data-gv-surface="market"/);
  assert.match(marketPage, /market_heatmap_cell_clicked/);

  assert.match(mapPage, /data-gv-surface="map"/);
  assert.match(storeMap, /map_marker_selected/);

  assert.match(searchBar, /trackGroceryViewEvent\(/);
  assert.match(searchBar, /search_submitted/);
});

test('metric dictionary gap summary counts stay consistent', async () => {
  const gapRegistry = await readFile(
    new URL('../../../docs/roadmap/atomic-gap-registry.md', import.meta.url),
    'utf8'
  );

  assert.match(gapRegistry, /### `metric-dictionary-not-centralized`[\s\S]*\| status \| done \|/);

  const doneMatch = gapRegistry.match(/\| done \| (\d+) \|/);
  const openMatch = gapRegistry.match(/\| open \| (\d+) \|/);
  assert.ok(doneMatch, 'gap registry should declare done count');
  assert.ok(openMatch, 'gap registry should declare open count');
  assert.equal(Number.parseInt(doneMatch[1], 10) + Number.parseInt(openMatch[1], 10), 10, 'open + done should equal total gaps');
});
