import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SE_PHARMACY_POIS_OVERPASS_QUERY,
  matchSwedishPharmacyChain,
  parseSwedishPharmacyPois
} from '../se-pharmacy-pois.js';

describe('SE pharmacy POI ingestion', () => {
  it('ships a Sweden-wide amenity=pharmacy Overpass query', () => {
    assert.match(SE_PHARMACY_POIS_OVERPASS_QUERY, /ISO3166-1"="SE/);
    assert.match(SE_PHARMACY_POIS_OVERPASS_QUERY, /"amenity"="pharmacy"/);
    assert.match(SE_PHARMACY_POIS_OVERPASS_QUERY, /out center tags/);
  });

  it('normalizes OSM pharmacy POIs with chain_type pharmacy and chain matching', () => {
    const pois = parseSwedishPharmacyPois({
      elements: [
        {
          type: 'node',
          id: 123,
          lat: 59.33,
          lon: 18.06,
          tags: {
            amenity: 'pharmacy',
            name: 'Apotek Hjärtat Stockholm',
            brand: 'Apotek Hjärtat',
            'addr:city': 'Stockholm',
            'contact:phone': '+46 8 123 456'
          }
        },
        { type: 'way', id: 456, center: { lat: 57.7, lon: 11.96 }, tags: { amenity: 'pharmacy', name: 'Kronans Apotek Göteborg' } },
        { type: 'node', id: 999, lat: 1, lon: 2, tags: { amenity: 'cafe', name: 'Not pharmacy' } }
      ]
    }, '2026-05-25T00:00:00.000Z');

    assert.equal(pois.length, 2);
    assert.equal(pois[0].chain, 'hjartat');
    assert.equal(pois[0].chain_type, 'pharmacy');
    assert.equal(pois[0].phone, '+46 8 123 456');
    assert.equal(pois[1].chain, 'kronans');
  });

  it('matches Apoteket, Hjärtat, Kronans, and Lloyds names', () => {
    assert.equal(matchSwedishPharmacyChain(['Apoteket AB']), 'apoteket');
    assert.equal(matchSwedishPharmacyChain(['Apotek Hjartat']), 'hjartat');
    assert.equal(matchSwedishPharmacyChain(['Kronans Apotek']), 'kronans');
    assert.equal(matchSwedishPharmacyChain(['Lloyds Apotek']), 'lloyds');
  });
});
