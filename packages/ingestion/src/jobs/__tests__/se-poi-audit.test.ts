import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSwedenPoiAuditReport,
  matchSwedenPoiChain,
  SE_POI_AUDIT_OVERPASS_QUERY,
  SE_POI_AUDIT_STORES_QUERY,
  SWEDEN_POI_AUDIT_SHOP_VALUES,
  parseSwedenPoiAudit
} from '../se-poi-audit.js';

describe('SE POI audit ingestion', () => {
  it('ships a Sweden-wide query for all grocery-adjacent shops, pharmacies, and fuel', () => {
    assert.match(SE_POI_AUDIT_OVERPASS_QUERY, /ISO3166-1"="SE/);
    assert.match(SE_POI_AUDIT_OVERPASS_QUERY, /admin_level=2/);
    for (const shop of SWEDEN_POI_AUDIT_SHOP_VALUES) assert.match(SE_POI_AUDIT_OVERPASS_QUERY, new RegExp(`\\|${shop}|\\(${shop}`));
    assert.match(SE_POI_AUDIT_OVERPASS_QUERY, /"amenity"="pharmacy"/);
    assert.match(SE_POI_AUDIT_OVERPASS_QUERY, /"amenity"="fuel"/);
    assert.match(SE_POI_AUDIT_OVERPASS_QUERY, /out center tags/);
  });

  it('declares the stores-table comparison query for Swedish chain linkage', () => {
    assert.match(SE_POI_AUDIT_STORES_QUERY, /from stores/);
    assert.match(SE_POI_AUDIT_STORES_QUERY, /join chains on chains\.id = stores\.chain_id/);
    assert.match(SE_POI_AUDIT_STORES_QUERY, /stores\.country_code = 'SE'/);
    assert.match(SE_POI_AUDIT_STORES_QUERY, /stores\.external_ref/);
  });

  it('normalizes grocery, pharmacy, and fuel OSM POIs with Sweden chain matching', () => {
    const rows = parseSwedenPoiAudit({
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 59.337,
          lon: 18.091,
          tags: {
            shop: 'supermarket',
            name: 'ICA Nära Karlaplan',
            brand: 'ICA Nära',
            'addr:city': 'Stockholm',
            'contact:phone': '+46 8 662 40 35'
          }
        },
        {
          type: 'way',
          id: 2,
          center: { lat: 57.7, lon: 11.96 },
          tags: {
            amenity: 'pharmacy',
            name: 'Apotek Hjärtat Göteborg',
            website: 'https://www.apotekhjartat.se'
          }
        },
        {
          type: 'relation',
          id: 3,
          center: { lat: 55.6, lon: 13.0 },
          tags: {
            amenity: 'fuel',
            operator: 'Preem',
            opening_hours: '24/7'
          }
        },
        { type: 'node', id: 4, lat: 59, lon: 18, tags: { shop: 'bakery', name: 'Local bakery' } },
        { type: 'node', id: 5, lat: 59, lon: 18, tags: { amenity: 'cafe', name: 'Not in scope' } }
      ]
    }, '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 4);
    assert.equal(rows[0].domain, 'grocery');
    assert.equal(rows[0].chain, 'ica');
    assert.equal(rows[0].phone, '+46 8 662 40 35');
    assert.equal(rows[1].domain, 'pharmacy');
    assert.equal(rows[1].chain, 'hjartat');
    assert.equal(rows[2].domain, 'fuel');
    assert.equal(rows[2].chain, 'preem');
    assert.equal(rows[3].shop, 'bakery');
    assert.equal(rows[3].chain, 'unknown');
  });

  it('builds an unlinked POI report against stores-table rows', () => {
    const pois = parseSwedenPoiAudit({
      elements: [
        { type: 'node', id: 10, lat: 59.337, lon: 18.091, tags: { shop: 'supermarket', name: 'ICA Nära Karlaplan', brand: 'ICA' } },
        { type: 'node', id: 11, lat: 59.34, lon: 18.09, tags: { shop: 'supermarket', name: 'Independent Mat' } },
        { type: 'node', id: 12, lat: 59.5, lon: 18.1, tags: { amenity: 'fuel', name: 'Circle K Roslagen' } }
      ]
    }, '2026-05-25T00:00:00.000Z');

    const report = buildSwedenPoiAuditReport(pois, [
      {
        store_id: 'store-1',
        store_slug: 'ica-nara-karlaplan',
        store_name: 'ICA Nära Karlaplan',
        chain_slug: 'ica',
        chain_name: 'ICA',
        external_ref: 'osm:node:10',
        country_code: 'SE',
        latitude: 59.337,
        longitude: 18.091
      }
    ], '2026-05-25T12:00:00.000Z');

    assert.equal(report.generatedAt, '2026-05-25T12:00:00.000Z');
    assert.equal(report.totals.pois, 3);
    assert.equal(report.totals.grocery, 2);
    assert.equal(report.totals.fuel, 1);
    assert.equal(report.totals.unknownChain, 1);
    assert.equal(report.totals.missingStoreMatch, 1);
    assert.equal(report.totals.unlinkedSupermarkets, 1);
    assert.deepEqual(report.unlinkedPois.map((poi) => [poi.osmId, poi.reason]), [
      [11, 'unknown_chain'],
      [12, 'missing_store_match']
    ]);
    assert.equal(report.unlinkedPois[0].nearestStoreSlug, 'ica-nara-karlaplan');
  });

  it('matches expected Swedish grocery, pharmacy, and fuel chains', () => {
    assert.equal(matchSwedenPoiChain(['Willys Hemma']), 'willys');
    assert.equal(matchSwedenPoiChain(['Hemköp']), 'hemkop');
    assert.equal(matchSwedenPoiChain(['City Gross']), 'citygross');
    assert.equal(matchSwedenPoiChain(['Pressbyrån']), 'pressbyran');
    assert.equal(matchSwedenPoiChain(['7-Eleven']), 'seven_eleven');
    assert.equal(matchSwedenPoiChain(['Kronans Apotek']), 'kronans');
    assert.equal(matchSwedenPoiChain(['OKQ8']), 'okq8');
    assert.equal(matchSwedenPoiChain(['Din-X']), 'din_x');
  });
});
