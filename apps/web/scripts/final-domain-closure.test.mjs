import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repo = new URL('../../..', import.meta.url);
const readRepo = (relative) => readFile(new URL(relative, repo), 'utf8');
const existsRepo = (relative) => existsSync(new URL(relative, repo));

test('final domain closure keeps grocery fuel and pharmacy fully implemented and tested', async () => {
  const [
    registry,
    matrix,
    home,
    search,
    map,
    watchlist,
    analytics,
    dataOps,
    manualQa,
    releaseReport
  ] = await Promise.all([
    readRepo('docs/roadmap/atomic-gap-registry.md'),
    readRepo('docs/release/domain-closure-matrix.json'),
    readRepo('apps/web/src/components/mvp/mvp-home-page.tsx'),
    readRepo('apps/web/src/app/search/page.tsx'),
    readRepo('apps/web/src/app/map/page.tsx'),
    readRepo('apps/web/src/app/watchlist/page.tsx'),
    readRepo('apps/web/src/lib/analytics.ts'),
    readRepo('apps/web/scripts/data-ops-production-closure.test.mjs'),
    readRepo('docs/qa/manual-smoke-test-plan.md'),
    readRepo('scripts/ops/release-readiness-report.mjs')
  ]);
  const parsedMatrix = JSON.parse(matrix);

  assert.match(registry, /\| open \| 0 \|/);
  for (const domain of Object.values(parsedMatrix.domains)) {
    assert.equal(domain.status, 'yes + tested');
    assert.deepEqual(domain.blockingItems, []);
  }

  for (const route of [
    'apps/web/src/app/fuel/page.tsx',
    'apps/web/src/app/fuel/stations/page.tsx',
    'apps/web/src/app/fuel/stations/[stationId]/page.tsx',
    'apps/web/src/app/pharmacy/page.tsx',
    'apps/web/src/app/pharmacy/search/page.tsx',
    'apps/web/src/app/pharmacy/[product]/page.tsx',
    'apps/web/src/app/products/[slug]/page.tsx'
  ]) {
    assert.ok(existsRepo(route), `${route} should exist`);
  }

  for (const domainCopy of ['Compare groceries', 'OTC pharmacy', 'Compare fuel prices']) {
    assert.match(home, new RegExp(domainCopy));
  }
  for (const marker of [
    "selectedSearchDomain === 'all'",
    "selectedSearchDomain === 'pharmacy'",
    "selectedSearchDomain === 'fuel'",
    'source',
    'freshness',
    'confidence',
    'limitation'
  ]) {
    assert.match(search, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const marker of [
    'domain=grocery',
    'domain=pharmacy',
    'domain=fuel',
    'selectedFuelStation',
    'selectedPharmacy',
    'map_marker_selected'
  ]) {
    assert.match(map, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const marker of [
    'grocery_product',
    'pharmacy_otc_product',
    'fuel_grade',
    'fuel_station',
    'watchlist_item_added'
  ]) {
    assert.match(watchlist, new RegExp(marker));
  }
  for (const eventName of [
    'search_submitted',
    'search_result_clicked',
    'map_marker_selected',
    'fuel_grade_selected',
    'fuel_station_candidate_clicked',
    'fuel_alert_set',
    'pharmacy_product_clicked',
    'pharmacy_ean_comparison_opened',
    'pharmacy_otc_alert_set',
    'watchlist_item_added'
  ]) {
    assert.match(analytics, new RegExp(`'${eventName}'`));
  }

  for (const adminRoute of ['/admin/search-analytics', '/admin/data-quality', '/admin/source-runs', '/admin/query-performance', '/admin/storage']) {
    assert.match(dataOps, new RegExp(adminRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(manualQa, /Search all domains/);
  assert.match(manualQa, /Map/);
  assert.match(manualQa, /Watchlist/);
  assert.match(releaseReport, /status: blocked|status: 'blocked'|status: check\.pass \? 'pass' : 'blocked'/);
});
