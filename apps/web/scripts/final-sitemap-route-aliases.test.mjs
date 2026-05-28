import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const appPath = (path) => new URL(`../src/app/${path}`, import.meta.url);
const source = (path) => readFileSync(appPath(path), 'utf8');

test('final polish sitemap exposes pharmacy and fuel deep routes from the handoff', () => {
  for (const path of [
    'pharmacy/search/page.tsx',
    'pharmacy/otc/page.tsx',
    'fuel/stations/page.tsx',
    'fuel/stations/[stationId]/page.tsx'
  ]) {
    assert.equal(existsSync(appPath(path)), true, `${path} should exist`);
  }
});

test('pharmacy aliases keep OTC safety copy and route users back to exact EAN evidence', () => {
  for (const path of ['pharmacy/search/page.tsx', 'pharmacy/otc/page.tsx']) {
    const routeSource = source(path);
    assert.match(routeSource, /OTC public catalog comparison only\.|OTC public catalog only\./);
    assert.match(routeSource, /Exact EAN comparison/);
    assert.match(routeSource, /\/pharmacy/);
  }
});

test('fuel station routes expose location-only guardrails and route from the fuel page', () => {
  const stationsSource = source('fuel/stations/page.tsx');
  const stationDetailSource = source('fuel/stations/[stationId]/page.tsx');
  const fuelSource = source('fuel/page.tsx');

  assert.match(stationsSource, /Station locations are from OSM\/Overpass/);
  assert.match(stationsSource, /Operator-level price, not station-specific pump price/);
  assert.match(stationDetailSource, /Station locations are from OSM\/Overpass/);
  assert.match(stationDetailSource, /No station-specific pump price/);
  assert.match(fuelSource, /\/fuel\/stations\/\$\{station.osmId\}/);
});
