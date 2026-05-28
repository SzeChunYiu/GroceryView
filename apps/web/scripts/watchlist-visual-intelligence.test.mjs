import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const watchlistSource = () => readFileSync(new URL('../src/app/watchlist/page.tsx', import.meta.url), 'utf8');

test('watchlist page includes visual watch cards with progress, history, and timeline fallback', () => {
  const source = watchlistSource();
  for (const required of [
    'ChartShell',
    'DistributionBand',
    'Sparkline',
    'ChartTableFallback',
    'Watchlist visual command center',
    'Which watched prices are closest to their target?',
    'Product watch cards',
    'Target price progress bar',
    'Price history mini line',
    'Alert timeline'
  ]) {
    assert.match(source, new RegExp(required), `watchlist page missing ${required}`);
  }
});
