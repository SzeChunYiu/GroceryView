import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('map chain-index signals', () => {
  it('keeps map markers, cheapest callouts, and fallback copy grounded in chain-index data', async () => {
    const mapPage = await read('src/app/map/page.tsx');
    const storeMap = await read('src/components/store-map.tsx');

    assert.match(mapPage, /calculateChainPriceIndex\(buildChainPriceObservations\(\)\)/);
    assert.match(mapPage, /cheapestChainNearMe/);
    assert.match(mapPage, /No private location is read/);
    assert.match(mapPage, /markerTone/);
    assert.match(mapPage, /index < 96/);
    assert.match(mapPage, /index > 104/);

    assert.match(storeMap, /mapChainIndexScores/);
    assert.match(storeMap, /chainIndexColor/);
    assert.match(storeMap, /score < 96/);
    assert.match(storeMap, /score <= 103/);
    assert.match(storeMap, /GeolocateControl/);
    assert.match(storeMap, /No chain-index coverage/);
  });
});
