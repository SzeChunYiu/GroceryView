import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('packages/metrics definitions align with data dictionary', async () => {
  const definitions = await readFile(
    new URL('../../../packages/metrics/src/definitions.ts', import.meta.url),
    'utf8'
  );
  const dictionary = await readFile(
    new URL('../../../docs/data/metric-dictionary.md', import.meta.url),
    'utf8'
  );

  assert.match(definitions, /canonicalDealScore/);
  assert.match(definitions, /weekly_change_pct/);
  assert.match(dictionary, /deal_score/);
});
