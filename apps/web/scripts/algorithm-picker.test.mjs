import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const componentUrl = new URL('../src/components/algorithm-picker.tsx', import.meta.url);

test('AlgorithmPicker persists MyFlyer ranker choices to user preferences', async () => {
  const source = await readFile(componentUrl, 'utf8');

  for (const option of ['balanced', 'watchlist_first', 'best_savings', 'best_unit_price']) {
    assert.match(source, new RegExp(`value: '${option}'`), `${option} ranker option is declared`);
  }

  assert.match(source, /export const USER_PREFERENCES_STORAGE_KEY = 'groceryview:user_preferences'/);
  assert.match(source, /export function normalizeAlgorithmChoice/);
  assert.match(source, /export function readStoredAlgorithmChoice/);
  assert.match(source, /export function writeStoredAlgorithmChoice/);
  assert.match(source, /export async function persistAlgorithmChoiceToUserPreferences/);
  assert.match(source, /algorithm_choice: normalizedSelected/);
  assert.match(source, /updated_at: new Date\(\)\.toISOString\(\)/);
  assert.match(source, /storage\.setItem\(storageKey, JSON\.stringify\(nextPreferences\)\)/);
  assert.match(source, /groceryview:user-preferences-changed/);
  assert.match(source, /body: JSON\.stringify\(\{ algorithm_choice: algorithmChoice \}\)/);
  assert.match(source, /role="radiogroup" aria-label="MyFlyer ranker"/);
  assert.match(source, /role="radio"/);
  assert.match(source, /aria-checked=\{active\}/);
  assert.match(source, /role="status" aria-live="polite"/);
  assert.doesNotMatch(source, /console\./);
});
