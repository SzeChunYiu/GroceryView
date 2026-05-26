import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const migratedSurface = readFileSync(new URL('../src/components/locale-home-page.tsx', import.meta.url), 'utf8');

const migratedHardcodedStrings = [
  'Next likely grocery needs',
  'Ranked from demo household signals',
  'Brand not reported',
  'Native-quality translation review required',
  'No machine-translated prices'
];

test('migrated locale home surfaces read copy from messages files', () => {
  for (const value of migratedHardcodedStrings) {
    assert.equal(migratedSurface.includes(value), false, `${value} should stay in messages/{locale}.json`);
  }
});
