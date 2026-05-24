import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BRANDED_FUEL_STATIONS_OVERPASS_URL,
  fetchBrandedSwedishFuelStations,
  parseBrandedSwedishFuelStations
} from '../fuel-stations.js';

const circleKFixture = {
  elements: [{
    type: 'node',
    id: 29592701,
    lat: 59.5174583,
    lon: 18.0722494,
    tags: {
      amenity: 'fuel',
      brand: 'Circle K',
      name: 'Circle K Vallentuna',
      operator: 'Circle K Sverige AB',
      'addr:street': 'Stockholmsvägen',
      'addr:housenumber': '116',
      'addr:postcode': '186 31',
      'addr:city': 'Vallentuna',
      opening_hours: 'Mo-Su 00:00-24:00',
      website: 'https://www.circlek.se/station/circle-k-vallentuna',
      phone: '+46851178020'
    }
  }]
};

describe('circle-k-se fixture connector coverage', () => {
  it('mocks HTTP with a recorded Overpass fixture and preserves Circle K row shape', async () => {
    const requestedBodies: string[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      assert.equal(String(url), BRANDED_FUEL_STATIONS_OVERPASS_URL);
      assert.equal(init?.method, 'POST');
      requestedBodies.push(String(init?.body));
      return new Response(JSON.stringify(circleKFixture), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchBrandedSwedishFuelStations({ fetchImpl, query: 'circle-k-fixture-query', retrievedAt: '2026-05-24T12:00:00.000Z' });

    assert.equal(new URLSearchParams(requestedBodies[0]).get('data'), 'circle-k-fixture-query');
    assert.deepEqual(rows, [{
      osmType: 'node',
      osmId: 29592701,
      name: 'Circle K Vallentuna',
      chain: 'Circle K',
      brand: 'Circle K',
      operator: 'Circle K Sverige AB',
      amenity: 'fuel',
      latitude: 59.5174583,
      longitude: 18.0722494,
      street: 'Stockholmsvägen',
      houseNumber: '116',
      postcode: '186 31',
      city: 'Vallentuna',
      openingHours: 'Mo-Su 00:00-24:00',
      website: 'https://www.circlek.se/station/circle-k-vallentuna',
      phone: '+46851178020',
      sourceUrl: BRANDED_FUEL_STATIONS_OVERPASS_URL,
      retrievedAt: '2026-05-24T12:00:00.000Z'
    }]);
  });

  it('handles edge cases by dropping non-fuel, non-Circle-K, and coordinate-less elements', () => {
    const rows = parseBrandedSwedishFuelStations({
      elements: [
        { type: 'way', id: 10, center: { lat: 59.31, lon: 18.02 }, tags: { amenity: 'fuel', brand: 'Circle K', name: 'Circle K center' } },
        { type: 'node', id: 11, lat: 59.32, lon: 18.03, tags: { amenity: 'charging_station', brand: 'Circle K' } },
        { type: 'node', id: 12, tags: { amenity: 'fuel', brand: 'Circle K' } },
        { type: 'node', id: 13, lat: 59.33, lon: 18.04, tags: { amenity: 'fuel', brand: 'Other Fuel' } }
      ]
    }, '2026-05-24T12:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.osmType, 'way');
    assert.equal(rows[0]?.chain, 'Circle K');
    assert.equal(rows[0]?.latitude, 59.31);
  });

  it('surfaces HTTP errors from the Circle K fixture request path', async () => {
    const fetchImpl: typeof fetch = async () => new Response('bad gateway', { status: 502 });
    await assert.rejects(
      () => fetchBrandedSwedishFuelStations({ fetchImpl, query: 'circle-k-fixture-query' }),
      /Overpass branded fuel station request failed: 502/
    );
  });
});
