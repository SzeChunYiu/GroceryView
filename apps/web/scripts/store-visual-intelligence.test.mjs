import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const storeSource = () => readFileSync(new URL('../src/app/stores/[slug]/page.tsx', import.meta.url), 'utf8');

test('store page includes visual evidence board with accessible fallback', () => {
  const source = storeSource();
  for (const required of [
    'ChartShell',
    'DistributionBand',
    'ChartTableFallback',
    'Store evidence board',
    'Can I trust this store page for location, hours, coverage, and price rank?',
    'Map pin',
    'Opening hours',
    'Category coverage bars',
    'Price percentile gate'
  ]) {
    assert.match(source, new RegExp(required), `store page missing ${required}`);
  }
});
