import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = new URL('../price-chart-terminal.tsx', import.meta.url);

test('snapshots sv-SE SEK y-axis tick formatting', async () => {
  const component = await readFile(source, 'utf8');
  const tickFormatterSnapshot = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK'
  }).formatToParts(1234.5);

  assert.deepEqual(tickFormatterSnapshot, [
    { type: 'integer', value: '1' },
    { type: 'group', value: '\u00a0' },
    { type: 'integer', value: '234' },
    { type: 'decimal', value: ',' },
    { type: 'fraction', value: '50' },
    { type: 'literal', value: '\u00a0' },
    { type: 'currency', value: 'kr' }
  ]);
  assert.match(component, /new Intl\.NumberFormat\('sv-SE', \{\s*style: 'currency',\s*currency: 'SEK'\s*\}\)/);
  assert.match(component, /localization: \{\s*priceFormatter: formatPriceChartCurrencyTick\s*\}/);
});
