import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeHalalCenterSeRows, verifyHalalCenterSeCoverage } from '../index.js';

const storeFixture = [
  { store_id: 'halal-center-orebro', name: 'Halalcenter Örebro', city: 'Örebro', source_url: 'https://western-union-se.open-closed.net/orebro/en' },
  { store_id: 'halal-center-stockholm', name: 'Halal Center Stockholm fixture', city: 'Stockholm', source_url: 'fixture:operator-verified' },
  { store_id: 'halal-center-malmo', name: 'Halal Center Malmö fixture', city: 'Malmö', source_url: 'fixture:operator-verified' }
];

describe('Halal Center SE connector', () => {
  it('requires at least three stores unless national online presence is verified', () => {
    assert.equal(verifyHalalCenterSeCoverage(storeFixture.slice(0, 2)), false);
    assert.equal(verifyHalalCenterSeCoverage(storeFixture), true);
    assert.equal(verifyHalalCenterSeCoverage([], true), true);
  });

  it('emits only whitelisted kosher_halal rows with the SE/SEK chain contract', () => {
    const rows = normalizeHalalCenterSeRows({
      stores: storeFixture,
      rows: [
        { product_id: 'lamb-1', product_name: 'Halal lamb', category: 'halal_meat', price: 129, source_url: 'fixture:halal-center' },
        { product_id: 'rice-1', product_name: 'Basmati rice', category: 'rice', price: 249, source_url: 'fixture:halal-center' },
        { product_id: 'soap-1', product_name: 'Soap', category: 'household', price: 19, source_url: 'fixture:halal-center' }
      ]
    });

    assert.deepEqual(rows.map((row) => row.product_id), ['lamb-1', 'rice-1']);
    for (const row of rows) {
      assert.equal(row.country, 'SE');
      assert.equal(row.currency, 'SEK');
      assert.equal(row.chain, 'halal-center');
      assert.equal(row.retailer_type, 'kosher_halal');
    }
  });
});
