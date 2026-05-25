import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const componentUrl = new URL('../src/components/diet-filter-picker.tsx', import.meta.url);

test('DietFilterPicker persists the full MyFlyer diet option set for rankers', async () => {
  const source = await readFile(componentUrl, 'utf8');

  for (const option of ['organic', 'vegetarian', 'vegan', 'gluten-free', 'lactose-free']) {
    assert.match(source, new RegExp(`value: '${option}'`), `${option} toggle is declared`);
  }

  assert.match(source, /export const DIET_FILTER_STORAGE_KEY = 'groceryview:my-flyer:diet-filters'/);
  assert.match(source, /export function normalizeDietFilters/);
  assert.match(source, /export function readStoredDietFilters/);
  assert.match(source, /export function writeStoredDietFilters/);
  assert.match(source, /window\.localStorage\.setItem\(storageKey, JSON\.stringify\(normalizeDietFilters\(selected\)\)\)/);
  assert.match(source, /groceryview:diet-filters-changed/);
  assert.match(source, /hasLoadedStoredSelection/);
  assert.match(source, /aria-pressed=\{active\}/);
  assert.match(source, /role="group" aria-label="MyFlyer diet filters"/);
  assert.doesNotMatch(source, /console\./);
});
