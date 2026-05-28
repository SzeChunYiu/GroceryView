import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');

test('global search exposes all domain tabs and routed result card types', () => {
  const searchPage = source('app/search/page.tsx');

  assert.match(searchPage, /\/search\?domain=all/);
  assert.match(searchPage, /\/search\?domain=grocery/);
  assert.match(searchPage, /\/search\?domain=fuel/);
  assert.match(searchPage, /\/search\?domain=pharmacy/);
  assert.match(searchPage, /All-domain search/);
  assert.match(searchPage, /Grocery product card/);
  assert.match(searchPage, /Pharmacy OTC card/);
  assert.match(searchPage, /Fuel grade\/operator\/station card/);
  assert.match(searchPage, /cross_domain_result_clicked/);
  assert.match(searchPage, /source, freshness, confidence, and limitation/);
});

test('map exposes required cross-domain routes, layers, and selected detail states', () => {
  const mapPage = source('app/map/page.tsx');

  assert.match(mapPage, /\/map\?domain=grocery/);
  assert.match(mapPage, /\/map\?domain=pharmacy/);
  assert.match(mapPage, /\/map\?domain=fuel/);
  for (const label of [
    'grocery store locations',
    'grocery price index',
    'pharmacy locations',
    'pharmacy OTC coverage',
    'fuel stations',
    'fuel grade availability',
    'data freshness',
    'coverage'
  ]) {
    assert.match(mapPage, new RegExp(label));
  }
  for (const selectedDetail of ['store', 'kommun', 'fuel station', 'pharmacy']) {
    assert.match(mapPage, new RegExp("state: '" + selectedDetail + "'"));
  }
});

test('watchlist and home close cross-domain item and card evidence contracts', () => {
  const watchlistPage = source('app/watchlist/page.tsx');
  const homePage = source('components/mvp/mvp-home-page.tsx');

  for (const section of ['Grocery products', 'Stores', 'Categories', 'Pharmacy OTC', 'Fuel', 'Saved views', 'Alerts']) {
    assert.match(watchlistPage, new RegExp(section));
  }
  for (const itemType of ['grocery_product', 'grocery_store', 'grocery_category', 'pharmacy_otc_product', 'fuel_grade / fuel_station', 'saved_market_view']) {
    assert.match(watchlistPage, new RegExp(itemType.replace('/', '\\/')));
  }
  for (const card of ['Compare groceries', 'Compare OTC pharmacy prices', 'Compare fuel prices']) {
    assert.match(homePage, new RegExp(card));
  }
  assert.match(homePage, /href: '\/browse'/);
  assert.match(homePage, /href: '\/pharmacy'/);
  assert.match(homePage, /href: '\/fuel'/);
  assert.match(homePage, /source: \{domain\.source\}/);
  assert.match(homePage, /freshness: \{domain\.freshness\}/);
  assert.match(homePage, /confidence: \{domain\.confidence\}/);
  assert.match(homePage, /limitation: \{domain\.limitation\}/);
});
