import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const fuelSource = () => readFileSync(new URL('../src/app/fuel/page.tsx', import.meta.url), 'utf8');

test('fuel page includes visual operator board with grade controls, confidence table, and station guardrails', () => {
  const source = fuelSource();
  for (const required of [
    'ChartShell',
    'DistributionBand',
    'Sparkline',
    'ChartTableFallback',
    'Fuel visual command center',
    'Which operator-backed fuel rows are cheapest for the selected grade?',
    'Operator-level price, not station-specific pump price',
    'Grade',
    'Operator',
    'Price per litre',
    'Effective from',
    'Source',
    'Confidence'
  ]) {
    assert.match(source, new RegExp(required), `fuel page missing ${required}`);
  }
});
