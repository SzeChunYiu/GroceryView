import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const appPath = (path) => new URL(`../src/app/${path}`, import.meta.url);
const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('pharmacy exact-EAN detail route exists with safety and source boundaries', () => {
  assert.equal(existsSync(appPath('pharmacy/[product]/page.tsx')), true, 'root /pharmacy/[product] route should exist');
  const route = source('app/pharmacy/[product]/page.tsx');
  assert.match(route, /buildPharmacyProductDetail/);
  assert.match(route, /Exact EAN comparison/);
  assert.match(route, /No prescription medicine/);
  assert.match(route, /No medical advice/);
  assert.match(route, /pharmacy_otc_alert_set/);
});

test('global search pharmacy domain renders OTC cards and exact-EAN links', () => {
  const searchPage = source('app/search/page.tsx');

  assert.match(searchPage, /buildPharmacyDomainSearchView/);
  assert.match(searchPage, /selectedSearchDomain === 'pharmacy'/);
  assert.match(searchPage, /data-gv-event="pharmacy_product_clicked"/);
  assert.match(searchPage, /data-gv-event="pharmacy_ean_comparison_opened"/);
  assert.match(searchPage, /\/pharmacy\/\$\{card\.ean\}/);
  assert.match(searchPage, /\/map\?domain=pharmacy&pharmacy=\$\{card\.chain\}/);
  assert.match(searchPage, /no prescription or medical advice/i);
});

test('pharmacy map and watchlist domain flows are explicit and safety-first', () => {
  const mapPage = source('app/map/page.tsx');
  const watchlistPage = source('app/watchlist/page.tsx');

  assert.match(mapPage, /buildPharmacySelectedDetail/);
  assert.match(mapPage, /selectedPharmacy/);
  assert.match(mapPage, /domain=pharmacy/);
  assert.match(mapPage, /OTC coverage\/source freshness/);
  assert.match(mapPage, /No stock or prescription claim/);

  assert.match(watchlistPage, /buildPharmacyDomainSearchView/);
  assert.match(watchlistPage, /selectedWatchDomain === 'pharmacy'/);
  assert.match(watchlistPage, /Pharmacy OTC target alerts/);
  assert.match(watchlistPage, /pharmacy_otc_product/);
  assert.match(watchlistPage, /Notify me when exact EAN/);
});
