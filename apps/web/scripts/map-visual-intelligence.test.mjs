import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const mapSource = () => readFileSync(new URL('../src/app/map/page.tsx', import.meta.url), 'utf8');

test('map page includes required visual shell, all layers, selected detail states, legend, and fallback', () => {
  const source = mapSource();
  for (const required of [
    'ChartShell',
    'ChartTableFallback',
    'GeoHeatmap',
    'Where can I compare mapped grocery, pharmacy, and fuel evidence?',
    'Map visual command center',
    'Store locations',
    'Price index',
    'Category index',
    'Deal density',
    'Freshness',
    'Coverage',
    'Pharmacy locations',
    'Fuel stations',
    'Always visible legend',
    'If store selected',
    'If kommun selected',
    'If fuel station selected',
    'If pharmacy selected',
    'Table/list of visible markers'
  ]) {
    assert.match(source, new RegExp(required), `map page missing ${required}`);
  }
});
