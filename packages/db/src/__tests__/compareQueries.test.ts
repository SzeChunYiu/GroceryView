import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildComparePriceSnapshotsQuery, mapComparePriceSnapshotRow } from '../queries/compare.js';

describe('compare price snapshot queries', () => {
  it('builds a bounded latest price query for requested item ids', () => {
    const query = buildComparePriceSnapshotsQuery(['coffee', 'product-milk']);

    assert.deepEqual(query.values, [['coffee', 'product-milk']]);
    assert.match(query.sql, /unnest\(\$1::text\[\]\) with ordinality/i);
    assert.match(query.sql, /join products on products\.id::text = requested_items\.item_id/i);
    assert.match(query.sql, /products\.slug = requested_items\.item_id/i);
    assert.match(query.sql, /join latest_prices on latest_prices\.product_id = matched_products\.id/i);
    assert.match(query.sql, /latest_prices\.store_id is not null/i);
    assert.match(query.sql, /coalesce\(latest_prices\.is_available, true\) = true/i);
    assert.match(query.sql, /partition by matched_products\.requested_item_id, latest_prices\.store_id/i);
  });

  it('maps rows into API-ready numeric price snapshots', () => {
    assert.deepEqual(
      mapComparePriceSnapshotRow({
        requested_item_id: 'coffee',
        product_id: 'product-coffee',
        product_slug: 'coffee',
        product_name: 'Zoegas Coffee 450g',
        store_id: 'store-willys',
        store_slug: 'willys-odenplan',
        store_name: 'Willys Odenplan',
        chain_id: 'chain-willys',
        chain_slug: 'willys',
        chain_name: 'Willys',
        observation_id: 'obs-coffee',
        price: '49.90',
        regular_price: '59.90',
        unit_price: '110.89',
        currency: 'SEK',
        price_type: 'promotion',
        observed_at: new Date('2026-05-21T09:00:00.000Z'),
        confidence: '0.94',
        is_available: true
      }),
      {
        requestedItemId: 'coffee',
        productId: 'product-coffee',
        productSlug: 'coffee',
        productName: 'Zoegas Coffee 450g',
        storeId: 'store-willys',
        storeSlug: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        chainId: 'chain-willys',
        chainSlug: 'willys',
        chainName: 'Willys',
        observationId: 'obs-coffee',
        price: 49.9,
        regularPrice: 59.9,
        unitPrice: 110.89,
        currency: 'SEK',
        priceType: 'promotion',
        observedAt: '2026-05-21T09:00:00.000Z',
        confidence: 0.94,
        isAvailable: true
      }
    );
  });
});
