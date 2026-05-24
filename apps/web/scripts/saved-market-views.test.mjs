import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('saved market view actions persist account-scoped and guest-scoped view state', async () => {
  const component = await read('src/components/saved-market-view-actions.tsx');

  assert.match(component, /groceryview:saved-market-views:v1/);
  assert.match(component, /groceryview:saved-market-view-alerts:v1/);
  assert.match(component, /sessionStorage\.getItem\('groceryview:userId'\)/);
  assert.match(component, /:account:\$\{userId\}/);
  assert.match(component, /:guest/);
  assert.match(component, /currentViewHref\(\)/);
  assert.match(component, /Save current filters \/ sort \/ view/);
  assert.match(component, /Create alert draft/);
  assert.match(component, /Alerts not valid/);
});

test('map deals screener categories and compare pages expose saved view controls', async () => {
  const pages = [
    ['src/app/map/page.tsx', 'surface="map"', 'alertEligible={false}'],
    ['src/app/deals/page.tsx', 'surface="deals"', 'alertMetric="New active deal, markdown, or catalogue offer appears in this saved deals view"'],
    ['src/app/screener/page.tsx', 'surface="screener"', 'alertMetric="Saved screener filter has a new verified row or ranking movement"'],
    ['src/app/categories/page.tsx', 'surface="categories"', 'alertMetric="Saved category view has new verified rows, stronger spreads, or matching dietary evidence"'],
    ['src/app/compare/page.tsx', 'surface="compare"', 'alertMetric="Saved comparison changes best chain, spread, or matched product availability"']
  ];

  for (const [pagePath, surfaceMarker, alertMarker] of pages) {
    const page = await read(pagePath);
    assert.match(page, /SavedMarketViewActions/);
    assert.ok(page.includes(surfaceMarker), `${pagePath} should configure ${surfaceMarker}`);
    assert.ok(page.includes(alertMarker), `${pagePath} should configure alert validity`);
  }
});
