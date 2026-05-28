import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const adSlot = await readFile(new URL('../src/components/design-system/ad-slot.tsx', import.meta.url), 'utf8');
const adPolicy = await readFile(new URL('../src/lib/ad-policy.ts', import.meta.url), 'utf8');
const adSlots = await readFile(new URL('../src/lib/ad-slots.ts', import.meta.url), 'utf8');

test('AdSlot labels placements and reserves height', () => {
  assert.match(adSlot, /Advertisement/);
  assert.match(adSlot, /minHeight/);
  assert.match(adSlot, /aria-label/);
});

test('ad policy blocks sensitive and admin routes', () => {
  assert.match(adPolicy, /isAdFreeRoute/);
  assert.match(adPolicy, /searchAdAllowedAfterIndex/);
  assert.match(adPolicy, /adPlacementSurfaceAllowed/);
  assert.match(adSlots, /search_after_results_12/);
});

test('search placement requires index >= 12', () => {
  assert.match(adPolicy, /searchAdAllowedAfterIndex/);
  assert.match(adPolicy, /resultIndex >= 12/);
});
