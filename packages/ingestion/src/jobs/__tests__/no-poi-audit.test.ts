import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  matchNorwayPoiChain,
  NORWAY_OVERPASS_BBOX,
  NO_POI_AUDIT_OVERPASS_QUERY,
  parseNorwayPoiAudit
} from '../no-poi-audit.js';

describe('NO POI audit ingestion', () => {
  it('ships a Norway bounding-box query for grocery shops, pharmacies, and fuel', () => {
    const bbox = `${NORWAY_OVERPASS_BBOX.south},${NORWAY_OVERPASS_BBOX.west},${NORWAY_OVERPASS_BBOX.north},${NORWAY_OVERPASS_BBOX.east}`;
    assert.match(NO_POI_AUDIT_OVERPASS_QUERY, new RegExp(`\\(${bbox.replaceAll('.', '\\.')}\\)`));
    assert.match(NO_POI_AUDIT_OVERPASS_QUERY, /"shop"~"\^\(supermarket\|convenience\|grocery\|greengrocer\)\$"/);
    assert.match(NO_POI_AUDIT_OVERPASS_QUERY, /"amenity"="pharmacy"/);
    assert.match(NO_POI_AUDIT_OVERPASS_QUERY, /"amenity"="fuel"/);
    assert.match(NO_POI_AUDIT_OVERPASS_QUERY, /out center tags/);
  });

  it('normalizes grocery, pharmacy, and fuel OSM POIs with Norway chain matching', () => {
    const rows = parseNorwayPoiAudit({
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 59.913,
          lon: 10.752,
          tags: {
            shop: 'supermarket',
            name: 'REMA 1000 Grunerlokka',
            brand: 'REMA 1000',
            'addr:city': 'Oslo',
            'contact:phone': '+47 22 00 00 00'
          }
        },
        {
          type: 'way',
          id: 2,
          center: { lat: 59.91, lon: 10.75 },
          tags: {
            amenity: 'pharmacy',
            name: 'Apotek 1 Storgata',
            website: 'https://www.apotek1.no'
          }
        },
        {
          type: 'relation',
          id: 3,
          center: { lat: 59.89, lon: 10.72 },
          tags: {
            amenity: 'fuel',
            operator: 'Circle K',
            opening_hours: '24/7'
          }
        },
        { type: 'node', id: 4, lat: 59.9, lon: 10.7, tags: { amenity: 'cafe', name: 'Not in scope' } }
      ]
    }, '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 3);
    assert.equal(rows[0].domain, 'grocery');
    assert.equal(rows[0].chain, 'rema_1000');
    assert.equal(rows[0].phone, '+47 22 00 00 00');
    assert.equal(rows[1].domain, 'pharmacy');
    assert.equal(rows[1].chain, 'apotek_1');
    assert.equal(rows[2].domain, 'fuel');
    assert.equal(rows[2].chain, 'circle_k');
    assert.equal(rows[2].openingHours, '24/7');
  });

  it('matches expected Norway grocery, pharmacy, and fuel chains', () => {
    assert.equal(matchNorwayPoiChain(['KIWI']), 'kiwi');
    assert.equal(matchNorwayPoiChain(['Meny']), 'meny');
    assert.equal(matchNorwayPoiChain(['Coop Extra']), 'coop');
    assert.equal(matchNorwayPoiChain(['Bunnpris']), 'bunnpris');
    assert.equal(matchNorwayPoiChain(['Vitusapotek']), 'vitusapotek');
    assert.equal(matchNorwayPoiChain(['Boots Apotek']), 'boots_apotek');
    assert.equal(matchNorwayPoiChain(['Uno-X']), 'uno_x');
    assert.equal(matchNorwayPoiChain(['YX']), 'yx');
    assert.equal(matchNorwayPoiChain(['Independent Matbutikk']), 'unknown');
  });
});
