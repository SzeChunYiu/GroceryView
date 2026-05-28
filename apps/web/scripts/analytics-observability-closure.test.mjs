import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

const requiredEvents = [
  'search_submitted',
  'search_filter_applied',
  'search_sort_changed',
  'search_result_clicked',
  'product_opened',
  'deal_card_clicked',
  'deal_opened',
  'market_filter_changed',
  'market_heatmap_cell_clicked',
  'map_marker_selected',
  'preview_opened',
  'evidence_drawer_opened',
  'fuel_grade_selected',
  'fuel_station_candidate_clicked',
  'fuel_alert_set',
  'pharmacy_product_clicked',
  'pharmacy_ean_comparison_opened',
  'pharmacy_otc_alert_set',
  'watchlist_item_added'
];

const requiredMetrics = [
  'search_zero_result_rate',
  'search_to_product_click_rate',
  'deal_card_click_rate',
  'preview_open_rate',
  'evidence_drawer_open_rate',
  'fuel_grade_selection_rate',
  'pharmacy_alert_set_rate',
  'watchlist_add_rate',
  'source_success_rate',
  'freshness_rate',
  'coverage_rate'
];

function extractAnalyticsEventNames(source) {
  const match = source.match(/GROCERYVIEW_ANALYTICS_EVENT_NAMES = \[([\s\S]*?)\] as const/);
  assert.ok(match, 'analytics event name array should be present');
  return [...match[1].matchAll(/'([^']+)'/g)].map(([, eventName]) => eventName);
}

function extractCanonicalDocsEvents(source) {
  const match = source.match(/## Canonical public analytics events[\s\S]*?```text\n([\s\S]*?)```/);
  assert.ok(match, 'docs should include canonical public analytics events block');
  return match[1].trim().split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

test('event names in docs match canonical analytics code', async () => {
  const [analytics, docs] = await Promise.all([
    read('src/lib/analytics.ts'),
    read('../../docs/data/event-tracking-plan.md')
  ]);

  assert.deepEqual(extractAnalyticsEventNames(analytics), requiredEvents);
  assert.deepEqual(extractCanonicalDocsEvents(docs), requiredEvents);
});

test('public closure interactions expose data-gv-event or a tracking hook', async () => {
  const files = {
    searchPage: await read('src/app/search/page.tsx'),
    dealsPage: await read('src/app/deals/page.tsx'),
    marketPage: await read('src/app/market/page.tsx'),
    mapPage: await read('src/app/map/page.tsx'),
    pharmacyPage: await read('src/app/pharmacy/[product]/page.tsx'),
    watchlistPage: await read('src/app/watchlist/page.tsx'),
    surfaceAnalytics: await read('src/components/analytics/groceryview-surface-analytics.tsx'),
    visualIntelligence: await read('src/components/mvp/visual-intelligence.tsx'),
    searchPreview: await read('src/components/preview/search-result-preview-card.tsx'),
    dealPreview: await read('src/components/preview/deal-preview-card.tsx'),
    evidenceDrawer: await read('src/components/preview/evidence-drawer.tsx')
  };

  const publicSources = Object.values(files).join('\n');
  for (const eventName of requiredEvents) {
    assert.match(publicSources, new RegExp(`data-gv-event="${eventName}"|eventName: '${eventName}'|eventName="${eventName}"|analyticsEvent: '${eventName}'`), `${eventName} should be wired in a public surface`);
  }

  assert.match(files.searchPage, /GroceryViewSurfaceAnalytics surface="search"/);
  assert.match(files.dealsPage, /GroceryViewSurfaceAnalytics surface="deals"/);
  assert.match(files.marketPage, /GroceryViewSurfaceAnalytics surface="market"/);
  assert.match(files.mapPage, /GroceryViewSurfaceAnalytics surface="map"/);
  assert.match(files.searchPreview, /trackGroceryViewEvent\(/);
  assert.match(files.dealPreview, /trackGroceryViewEvent\(/);
  assert.match(files.evidenceDrawer, /trackGroceryViewEvent\(/);
});

test('admin search analytics reads the generated report helper', async () => {
  const [adminReport, helper] = await Promise.all([
    read('src/lib/admin-reports/search-analytics.ts'),
    read('../../scripts/ops/search-analytics-report.mjs')
  ]);

  assert.match(adminReport, /buildSearchAnalyticsFixtureReport/);
  assert.match(adminReport, /scripts\/ops\/search-analytics-report\.mjs/);
  assert.match(helper, /export function buildSearchAnalyticsFixtureReport/);
  assert.match(helper, /analytics_events/);
});

test('metric dictionary contains required cross-domain product analytics metrics', async () => {
  const dictionary = await read('../../docs/data/metric-dictionary.md');

  for (const metricName of requiredMetrics) {
    assert.match(dictionary, new RegExp(`## ${metricName}\\b`), `${metricName} should be defined`);
  }
});
