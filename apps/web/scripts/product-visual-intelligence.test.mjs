import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const productSource = () => readFileSync(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8');

test('product page includes visual price evidence panel with accessible fallback', () => {
  const source = productSource();
  for (const required of [
    'ChartShell',
    'DistributionBand',
    'PriceHistoryChart',
    'ChartTableFallback',
    'Product price evidence panel',
    'Is this current price high or low against verified ranges?',
    'National price range band',
    'Local/kommun comparison band',
    'Retailer quote table'
  ]) {
    assert.match(source, new RegExp(required), `product page missing ${required}`);
  }
});
