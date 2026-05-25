import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('nearest store availability map filters', () => {
  it('surfaces chain, distance, opening-hours, and likely-stocked filters on the map route', async () => {
    const [mapPage, storeMap, osmStores] = await Promise.all([
      read('src/app/map/page.tsx'),
      read('src/components/store-map.tsx'),
      read('src/lib/osm-stores.ts')
    ]);

    assert.match(osmStores, /StoreAvailabilityFilter/);
    assert.match(osmStores, /storeAvailabilityFilterDefaults/);
    assert.match(osmStores, /storeAvailabilityChainOptions/);
    assert.match(osmStores, /storeAvailabilityDistanceOptionsKm/);
    assert.match(osmStores, /storeAvailabilitySignal/);
    assert.match(osmStores, /likelyInStockLabel/);

    assert.match(storeMap, /data-map-availability-filters/);
    assert.match(storeMap, /storeMatchesAvailabilityFilter/);
    assert.match(storeMap, /availabilityFilter\.chain/);
    assert.match(storeMap, /availabilityFilter\.distanceKm/);
    assert.match(storeMap, /availabilityFilter\.openNowOnly/);
    assert.match(storeMap, /availabilityFilter\.likelyInStockOnly/);
    assert.match(storeMap, /data-map-availability-filter-summary/);
    assert.match(storeMap, /Products likely in stock/);

    assert.match(mapPage, /Nearest store availability filters/);
    assert.match(mapPage, /data-map-availability-filter-overview/);
    assert.match(mapPage, /chain, distance, source opening-hours, and products-likely-in-stock filters/i);
    assert.match(mapPage, /not a live shelf or checkout guarantee/i);
  });
});
