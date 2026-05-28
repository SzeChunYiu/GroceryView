import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const definitionsPath = new URL('../src/definitions.ts', import.meta.url);
const dictionaryPath = new URL('../../../docs/data/metric-dictionary.md', import.meta.url);

test('metric definitions list core ids from the dictionary', async () => {
  const source = await readFile(definitionsPath, 'utf8');
  const dictionary = await readFile(dictionaryPath, 'utf8');

  for (const id of ['deal_score', 'weekly_change_pct', 'confidence_score', 'search_zero_result_rate']) {
    assert.match(source, new RegExp(id.replace(/_/g, '_')), `${id} should be in definitions`);
    assert.match(dictionary, new RegExp(id.replace(/_/g, '_')), `${id} should be documented`);
  }

  assert.match(source, /canonicalDealScore/);
  assert.match(source, /weeklyChangePct/);
});
