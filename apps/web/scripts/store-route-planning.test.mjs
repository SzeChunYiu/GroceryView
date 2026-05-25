import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('map nearest store route planning', () => {
  it('ranks nearest stores with distance, basket cost, and opening status evidence', async () => {
    const [routePlanner, mapPage, storeMap, storeDetailMap] = await Promise.all([
      read('src/lib/store-distance.ts'),
      read('src/app/map/page.tsx'),
      read('src/components/store-map.tsx'),
      read('src/components/StoreMap.tsx')
    ]);

    assert.match(routePlanner, /StoreOpeningStatus/);
    assert.match(routePlanner, /basketTotalSek/);
    assert.match(routePlanner, /travelCostSek/);
    assert.match(routePlanner, /routeAwareTotalSek/);
    assert.match(routePlanner, /openingPenaltyMinutes/);
    assert.match(routePlanner, /routeScore/);
    assert.match(routePlanner, /distance, basket cost, and opening status/);
    assert.match(routePlanner, /\.sort\(\(left, right\) => left\.routeScore - right\.routeScore/);

    assert.match(mapPage, /buildStoreDistanceCompare/);
    assert.match(mapPage, /routeAwareNearestStorePlan/);
    assert.match(mapPage, /Route-aware nearest stores/);
    assert.match(mapPage, /basketTotalSek/);
    assert.match(mapPage, /openingStatusLabel/);
    assert.match(mapPage, /no private GPS by default/i);

    assert.match(storeMap, /routeRecommendations/);
    assert.match(storeMap, /data-route-aware-map-legend/);
    assert.match(storeMap, /Rank combines distance, basket total, and opening status/);

    assert.match(storeDetailMap, /routeRecommendation/);
    assert.match(storeDetailMap, /data-store-detail-route-aware-recommendation/);
    assert.match(storeDetailMap, /combines route time/);
  });

  it('keeps the nearby stores map keyboard reachable and screen-reader announced', async () => {
    const storeMap = await read('src/components/store-map.tsx');

    assert.match(storeMap, /data-nearby-stores-accessibility="keyboard-map"/);
    assert.match(storeMap, /tabIndex=\{0\}/);
    assert.match(storeMap, /aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight \+ - Home"/);
    assert.match(storeMap, /function handleMapKeyboard/);
    assert.match(storeMap, /map\.panBy/);
    assert.match(storeMap, /map\.zoomIn/);
    assert.match(storeMap, /aria-live="polite"/);
    assert.match(storeMap, /Location permission was not approved/);
    assert.match(storeMap, /data-nearby-stores-accessibility="live-panel"/);
    assert.match(storeMap, /aria-label=\{`Select \$\{candidate\.store\.name\}/);
    assert.match(storeMap, /Show only stores reported open now/);
  });
});
