import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const dealsSource = () => readFileSync(new URL('../src/app/deals/page.tsx', import.meta.url), 'utf8');

test('deals page includes a visual deal-quality distribution with accessible fallback', () => {
  const source = dealsSource();
  for (const required of [
    'ChartShell',
    'DistributionBand',
    'ChartTableFallback',
    'Deal quality distribution',
    'How strong are the current deal labels?',
    'Why-ranked explanation'
  ]) {
    assert.match(source, new RegExp(required), `deals page missing ${required}`);
  }
});
