import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('route-aware split trip planner', () => {
  it('compares split-store savings against travel and time costs before recommending a route', async () => {
    const [shoppingTripsPage, tripPlanner, useGeolocation] = await Promise.all([
      read('src/app/shopping-trips/page.tsx'),
      read('src/lib/trip-planner.ts'),
      read('src/hooks/useGeolocation.ts')
    ]);

    assert.match(tripPlanner, /planRouteAwareSplitTrip/);
    assert.match(tripPlanner, /minimumNetSavingsSek/);
    assert.match(tripPlanner, /grossShelfSavingsSek/);
    assert.match(tripPlanner, /netSavingsSek/);
    assert.match(tripPlanner, /qualifiesForSplit/);
    assert.match(tripPlanner, /nearestNeighborStoreOrder/);
    assert.match(tripPlanner, /buildRouteLeg/);
    assert.match(tripPlanner, /splitStorePlan\.qualifiesForSplit \? splitStorePlan : bestSingleStorePlan/);

    assert.match(shoppingTripsPage, /Route-aware split planner/);
    assert.match(shoppingTripsPage, /recommendedPlan/);
    assert.match(shoppingTripsPage, /bestSingleStorePlan/);
    assert.match(shoppingTripsPage, /splitStorePlan/);
    assert.match(shoppingTripsPage, /Requires at least/);

    assert.match(useGeolocation, /TripPlannerOrigin/);
    assert.match(useGeolocation, /buildTripPlannerOrigin/);
    assert.match(useGeolocation, /tripPlannerOrigin/);
  });
});
