import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pantryLib = new URL('../src/lib/pantry.ts', import.meta.url);
const pantryTracker = new URL('../src/components/pantry-tracker.tsx', import.meta.url);
const pantryInventoryPage = new URL('../src/app/pantry-inventory/page.tsx', import.meta.url);

test('pantry depletion estimates use observed purchase dates, quantities, and household size', async () => {
  const source = await readFile(pantryLib, 'utf8');

  assert.match(source, /export type PantryDepletionPrediction/);
  assert.match(source, /purchasedQuantity/);
  assert.match(source, /purchasedAt/);
  assert.match(source, /householdSize/);
  assert.match(source, /daysBetween\(purchasedAt, asOf\)/);
  assert.match(source, /buildDepletionPrediction/);
  assert.match(source, /Remind \$\{reminderLeadDays\} days before depletion/);
});

test('pantry tracker renders depletion reminders after trip and manual use events', async () => {
  const source = await readFile(pantryTracker, 'utf8');

  assert.match(source, /depletionClasses/);
  assert.match(source, /depletionPrediction\.reminderLabel/);
  assert.match(source, /depletionPrediction\.expectedDepletedAt/);
  assert.match(source, /recordTripCompletion/);
  assert.match(source, /recordManualConsumption/);
});

test('pantry inventory page surfaces household restock timing alongside expiry actions', async () => {
  const source = await readFile(pantryInventoryPage, 'utf8');

  assert.match(source, /buildPantryStockItems/);
  assert.match(source, /PantryTracker items=\{pantryStockItems\}/);
  assert.match(source, /Restock timing/);
  assert.match(source, /days to empty/);
  assert.match(source, /householdSize/);
});
