import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyGeolocationError,
  deriveNearbyStoreState,
  getClosestStoreFallbacks,
  getStoreHref
} from './NearbyStoresWidget';

describe('NearbyStoresWidget state helpers', () => {
  it('chooses permission-denied state when geolocation permission is denied', () => {
    const state = deriveNearbyStoreState({
      geolocationSupported: true,
      permissionState: 'denied'
    });

    assert.equal(state.state, 'permission-denied');
    assert.equal(state.stores.length, 3);

    assert.deepEqual(state.stores[0], {
      slug: 'willys-odenplan',
      name: 'Willys Odenplan',
      distanceLabel: '1.2 km from saved area'
    });

    assert.equal(state.stores.every((store) => typeof store.slug === 'string' && store.slug.length > 0), true);
    assert.equal(state.stores.every((store) => typeof store.distanceLabel === 'string' && store.distanceLabel.includes('km')), true);
    assert.equal(getStoreHref(state.stores[0].slug), '/stores/willys-odenplan');
  });

  it('falls back to fixture list when geolocation is unsupported', () => {
    const state = deriveNearbyStoreState({
      geolocationSupported: false
    });

    assert.equal(state.state, 'unsupported');
    assert.equal(state.stores.length, getClosestStoreFallbacks().length);
  });

  it('maps permission denied errors to denied state', () => {
    const state = classifyGeolocationError({ code: 1, message: 'User denied geolocation permission.' });

    assert.equal(state, 'permission-denied');
  });

  it('maps other errors to fallback error state', () => {
    const state = deriveNearbyStoreState({
      geolocationSupported: true,
      geolocationError: new Error('Network down')
    });

    assert.equal(state.state, 'error');
    assert.equal(state.description.includes('closest-3'), true);
  });

  it('returns permission-granted when permission is granted and position is available', () => {
    const state = deriveNearbyStoreState({
      geolocationSupported: true,
      permissionState: 'granted',
      hasPosition: true
    });

    assert.equal(state.state, 'permission-granted');
    assert.equal(state.stores.length, 0);
  });
});
