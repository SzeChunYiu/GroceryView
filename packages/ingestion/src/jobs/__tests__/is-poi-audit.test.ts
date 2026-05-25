import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ICELAND_OVERPASS_BBOX,
  IS_POI_AUDIT_OVERPASS_QUERY,
  matchIcelandPoiChain,
  parseIcelandPoiAudit
} from '../is-poi-audit.js';

describe('IS POI audit ingestion', () => {
  it('ships an Iceland bounding-box query for grocery shops, pharmacies, and fuel', () => {
    const bbox = `${ICELAND_OVERPASS_BBOX.south},${ICELAND_OVERPASS_BBOX.west},${ICELAND_OVERPASS_BBOX.north},${ICELAND_OVERPASS_BBOX.east}`;
    assert.match(IS_POI_AUDIT_OVERPASS_QUERY, new RegExp(`\\(${bbox.replaceAll('.', '\\.')}\\)`));
    assert.match(IS_POI_AUDIT_OVERPASS_QUERY, /"shop"~"\^\(supermarket\|convenience\|grocery\|greengrocer\)\$"/);
    assert.match(IS_POI_AUDIT_OVERPASS_QUERY, /"amenity"="pharmacy"/);
    assert.match(IS_POI_AUDIT_OVERPASS_QUERY, /"amenity"="fuel"/);
    assert.match(IS_POI_AUDIT_OVERPASS_QUERY, /out center tags/);
  });

  it('normalizes grocery, pharmacy, and fuel OSM POIs with chain matching', () => {
    const rows = parseIcelandPoiAudit({
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 64.147,
          lon: -21.94,
          tags: {
            shop: 'supermarket',
            name: 'Bónus Hallveigarstíg',
            brand: 'Bónus',
            'addr:city': 'Reykjavík',
            'contact:phone': '+354 555 5555'
          }
        },
        {
          type: 'way',
          id: 2,
          center: { lat: 64.13, lon: -21.9 },
          tags: {
            amenity: 'pharmacy',
            name: 'Lyfja Lágmúla',
            website: 'https://www.lyfja.is'
          }
        },
        {
          type: 'relation',
          id: 3,
          center: { lat: 64.11, lon: -21.86 },
          tags: {
            amenity: 'fuel',
            operator: 'N1',
            opening_hours: '24/7'
          }
        },
        { type: 'node', id: 4, lat: 64, lon: -21, tags: { amenity: 'cafe', name: 'Not in scope' } }
      ]
    }, '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 3);
    assert.equal(rows[0].domain, 'grocery');
    assert.equal(rows[0].chain, 'bonus');
    assert.equal(rows[0].phone, '+354 555 5555');
    assert.equal(rows[1].domain, 'pharmacy');
    assert.equal(rows[1].chain, 'lyfja');
    assert.equal(rows[2].domain, 'fuel');
    assert.equal(rows[2].chain, 'n1');
    assert.equal(rows[2].openingHours, '24/7');
  });

  it('matches expected Iceland grocery, pharmacy, and fuel chains', () => {
    assert.equal(matchIcelandPoiChain(['Krónan']), 'kronan');
    assert.equal(matchIcelandPoiChain(['Nettó']), 'netto');
    assert.equal(matchIcelandPoiChain(['Lyf og heilsa']), 'lyfogheilsa');
    assert.equal(matchIcelandPoiChain(['Apótekið']), 'apotekid');
    assert.equal(matchIcelandPoiChain(['ÓB']), 'ob');
    assert.equal(matchIcelandPoiChain(['Olís']), 'olis');
    assert.equal(matchIcelandPoiChain(['Atlantsolía']), 'atlantsolia');
  });
});
