import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pharmacySource = () => readFileSync(new URL('../src/app/pharmacy/page.tsx', import.meta.url), 'utf8');

test('pharmacy page includes safe OTC visual command center with exact EAN fallback and required safety copy', () => {
  const source = pharmacySource();
  for (const required of [
    'ChartShell',
    'ChartTableFallback',
    'DistributionBand',
    'Sparkline',
    'Can I compare OTC pharmacy prices safely?',
    'Pharmacy visual command center',
    'Safety boundary card',
    'Exact EAN comparison only.',
    'OTC public catalog only.',
    'No prescription medicine.',
    'No medical advice.',
    'No stock claim unless source provides stock.',
    'Product',
    'EAN',
    'Chain',
    'Price',
    'Retrieved'
  ]) {
    assert.match(source, new RegExp(required), `pharmacy page missing ${required}`);
  }
});
