import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoreAssortmentOverviewQuery,
  mapStoreAssortmentOverviewRow
} from '../queries/stores.js';

describe('store assortment overview queries', () => {
  it('builds a bounded store-detail assortment query sorted by category then item name', () => {
    const query = buildStoreAssortmentOverviewQuery('willys-hemma-stockholm-torsplan', { limit: 25 });

    assert.equal(query.values[0], 'willys-hemma-stockholm-torsplan');
    assert.equal(query.values[1], 25);
    assert.match(query.sql, /from stores/);
    assert.match(query.sql, /join latest_prices on latest_prices\.store_id = stores\.id/);
    assert.match(query.sql, /join products on products\.id = latest_prices\.product_id/);
    assert.match(query.sql, /stores\.opening_hours/);
    assert.match(query.sql, /order by category_label asc, products\.canonical_name asc/);
  });

  it('maps store assortment rows without inferring missing opening hours', () => {
    const mapped = mapStoreAssortmentOverviewRow({
      store_id: 'store-willys',
      store_slug: 'willys-hemma-stockholm-torsplan',
      store_name: 'Willys Hemma Stockholm Torsplan',
      address_line1: 'Norra Stationsgatan 80',
      address_line2: null,
      postal_code: '113 65',
      city: 'Stockholm',
      opening_hours: null,
      product_id: 'product-milk',
      product_slug: 'standardmjolk-1l',
      canonical_name: 'Standardmjolk 3% 1 l',
      category_path: ['Dairy', 'Milk'],
      price: '14.90',
      unit_price: '14.90',
      currency: 'SEK',
      observed_at: '2026-05-21T09:00:00.000Z'
    });

    assert.deepEqual(mapped, {
      storeId: 'store-willys',
      storeSlug: 'willys-hemma-stockholm-torsplan',
      storeName: 'Willys Hemma Stockholm Torsplan',
      address: 'Norra Stationsgatan 80, 113 65, Stockholm',
      openingHours: [],
      productId: 'product-milk',
      productSlug: 'standardmjolk-1l',
      productName: 'Standardmjolk 3% 1 l',
      category: 'Dairy',
      price: 14.9,
      unitPrice: 14.9,
      currency: 'SEK',
      observedAt: '2026-05-21T09:00:00.000Z'
    });
  });
});
