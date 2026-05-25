import assert from 'node:assert/strict';
import test from 'node:test';
import { planSplitTrip } from '../src/lib/trip-planner.ts';

const basket = [
  { id: 'oats', name: 'Oats', prices: { coop: 24, willys: 18 } },
  { id: 'milk', name: 'Milk', prices: { coop: 12, willys: 22 } },
  { id: 'coffee', name: 'Coffee', prices: { coop: 58, willys: 46 } }
];

const stores = [
  { id: 'willys', label: 'Willys', routeOrder: 2, travelCost: 4 },
  { id: 'coop', label: 'Coop', routeOrder: 1, travelCost: 3 }
];

test('plans split trips with concrete item assignment, route order, effective total, and threshold gating', () => {
  const split = planSplitTrip(basket, stores, { minimumSavings: 5 });
  assert.equal(split.mode, 'split-trip');
  assert.deepEqual(split.assignments.map((assignment) => [assignment.itemId, assignment.storeId]), [
    ['oats', 'willys'],
    ['milk', 'coop'],
    ['coffee', 'willys']
  ]);
  assert.deepEqual(split.routeLegs, ['coop', 'willys']);
  assert.equal(split.effectiveTotal, 83);
  assert.equal(split.savingsVsSingleStore, 7);

  const gated = planSplitTrip(basket, stores, { minimumSavings: 8 });
  assert.equal(gated.mode, 'single-store');
  assert.deepEqual(gated.routeLegs, ['willys']);
  assert.equal(gated.effectiveTotal, 90);
  assert.deepEqual(gated.assignments.map((assignment) => assignment.storeId), ['willys', 'willys', 'willys']);
});
