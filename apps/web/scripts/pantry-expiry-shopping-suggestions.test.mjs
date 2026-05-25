import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pantryLib = new URL('../src/lib/pantry.ts', import.meta.url);
const pantryTracker = new URL('../src/components/pantry-tracker.tsx', import.meta.url);
const pantryInventoryPage = new URL('../src/app/pantry-inventory/page.tsx', import.meta.url);
const pantryPlannerPage = new URL('../src/app/pantry-planner/page.tsx', import.meta.url);

test('pantry library ranks shopping suggestions from expiry depletion staples and deals', async () => {
  const source = await readFile(pantryLib, 'utf8');

  assert.match(source, /export type PantryShoppingSuggestion/);
  assert.match(source, /export function buildPantryShoppingSuggestions/);
  assert.match(source, /item\.expiryReminder\.urgency === 'expired'/);
  assert.match(source, /item\.status === 'depleted'/);
  assert.match(source, /item\.isStaple/);
  assert.match(source, /bestDealFor\(item\.productId, deals\)/);
  assert.match(source, /priorityRank\(a\.priority\) - priorityRank\(b\.priority\)/);
});

test('pantry tracker shows next-list suggestions after consumption events', async () => {
  const source = await readFile(pantryTracker, 'utf8');

  assert.match(source, /buildPantryShoppingSuggestions/);
  assert.match(source, /const suggestions = useMemo\(\(\) => buildPantryShoppingSuggestions\(stock, deals\)/);
  assert.match(source, /Suggested next-list adds/);
  assert.match(source, /Ranked from expiry risk, depleted staples, usage pace, and visible deals/);
  assert.match(source, /Deal score \{suggestion\.bestDeal\.dealScore \?\? 'n\/a'\}/);
});

test('pantry inventory page builds expiry driven shopping suggestions from current deals', async () => {
  const source = await readFile(pantryInventoryPage, 'utf8');

  assert.match(source, /currentPantryDeals/);
  assert.match(source, /buildPantryStockItems\(items\.map/);
  assert.match(source, /buildPantryShoppingSuggestions\(pantryStock, currentPantryDeals\)/);
  assert.match(source, /Expiry-driven shopping suggestions/);
  assert.match(source, /depleted staple status/);
});

test('pantry planner passes current deal rows into tracker suggestions', async () => {
  const source = await readFile(pantryPlannerPage, 'utf8');

  assert.match(source, /const stapleProductIds = new Set/);
  assert.match(source, /isStaple: stapleProductIds\.has\(item\.productId\)/);
  assert.match(source, /<PantryTracker deals=\{pantryReplenishmentInput\.deals\} items=\{stockItems\} \/>/);
});
