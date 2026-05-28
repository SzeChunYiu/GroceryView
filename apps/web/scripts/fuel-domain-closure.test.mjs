import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('fuel search domain renders grade, operator, and station result cards with routed actions', () => {
  const searchPage = source('app/search/page.tsx');

  assert.match(searchPage, /buildFuelDomainSearchView/);
  assert.match(searchPage, /Domain tabs/);
  assert.match(searchPage, /\/search\?domain=fuel/);
  assert.match(searchPage, /data-gv-event="fuel_grade_selected"/);
  assert.match(searchPage, /data-gv-event="fuel_station_candidate_clicked"/);
  assert.match(searchPage, /\/map\?domain=fuel&station=\$\{station\.osmId\}/);
  assert.match(searchPage, /operator-level price guardrail/i);
});

test('fuel map domain supports selected station detail without pump price inference', () => {
  const mapPage = source('app/map/page.tsx');

  assert.match(mapPage, /buildFuelSelectedStationDetail/);
  assert.match(mapPage, /selectedFuelStation/);
  assert.match(mapPage, /domain=fuel/);
  assert.match(mapPage, /\/fuel\/stations\/\$\{selectedFuelStation\.station\.osmId\}/);
  assert.match(mapPage, /operator-level price guardrail/i);
  assert.match(mapPage, /data-gv-event="map_marker_selected"/);
});

test('fuel watchlist domain exposes grade targets and station saved items', () => {
  const watchlistPage = source('app/watchlist/page.tsx');

  assert.match(watchlistPage, /fuelPriceTargetAlerts/);
  assert.match(watchlistPage, /selectedWatchDomain === 'fuel'/);
  assert.match(watchlistPage, /Fuel grade targets/);
  assert.match(watchlistPage, /Fuel station saved item/);
  assert.match(watchlistPage, /Notify me when diesel < 17\.50 kr\/l/);
  assert.match(watchlistPage, /fuel_station/);
});

