import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNearestStoresQuery,
  getNearestStores,
  haversineDistanceKm,
  mapNearestStoreRow
} from '../nearest.js';

describe('nearest store finder', () => {
  it('computes Haversine distance in kilometers', () => {
    const distance = haversineDistanceKm(
      { latitude: 59.3293, longitude: 18.0686 },
      { latitude: 59.3429, longitude: 18.0494 }
    );

    assert.equal(Number(distance.toFixed(1)), 1.9);
  });

  it('builds a bounded stores query with optional chain filtering', () => {
    const query = buildNearestStoresQuery({ latitude: 59.3293, longitude: 18.0686, radiusKm: 5, chain: 'coop' });

    assert.deepEqual(query.values, [59.3293, 18.0686, 5, 'coop']);
    assert.match(query.sql, /from stores/i);
    assert.match(query.sql, /join chains/i);
    assert.match(query.sql, /st_y\(stores\.position::geometry\)/i);
    assert.match(query.sql, /asin\(sqrt/i);
    assert.match(query.sql, /distance_km <= \$3::double precision/i);
    assert.match(query.sql, /chains\.slug = \$4/i);
  });

  it('maps rows and returns stores ordered by database distance', async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const executor = {
      query: async <T>(sql: string, params: unknown[]) => {
        calls.push({ sql, params });
        return [
          {
            store_id: 'store-2',
            store_slug: 'coop-odenplan',
            store_name: 'Coop Odenplan',
            chain_slug: 'coop',
            chain_name: 'Coop',
            address_line1: 'Odengatan 65',
            city: 'Stockholm',
            latitude: '59.342900',
            longitude: '18.049400',
            distance_km: '1.86'
          },
          {
            store_id: 'store-1',
            store_slug: 'ica-baronen',
            store_name: 'ICA Nära Baronen',
            chain_slug: 'ica',
            chain_name: 'ICA',
            address_line1: 'Odengatan 40',
            city: 'Stockholm',
            latitude: 59.3429,
            longitude: 18.047,
            distance_km: 1.94
          }
        ] as T[];
      }
    };

    const stores = await getNearestStores(59.3293, 18.0686, 5, undefined, executor);

    assert.equal(stores[0]?.slug, 'coop-odenplan');
    assert.equal(stores[0]?.distanceKm, 1.86);
    assert.equal(stores[1]?.distanceKm, 1.94);
    assert.deepEqual(calls[0]?.params, [59.3293, 18.0686, 5, null]);
  });

  it('maps nullable store addresses without inventing coordinates', () => {
    const store = mapNearestStoreRow({
      store_id: 'store-1',
      store_slug: 'ica-baronen',
      store_name: 'ICA Nära Baronen',
      chain_slug: 'ica',
      chain_name: 'ICA',
      address_line1: null,
      city: 'Stockholm',
      latitude: '59.342900',
      longitude: '18.047000',
      distance_km: '1.94'
    });

    assert.equal(store.addressLine1, null);
    assert.equal(store.latitude, 59.3429);
    assert.equal(store.longitude, 18.047);
  });
});
