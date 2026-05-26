import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFavoritesListQuery, mapFavoriteItemRow } from '../queries/favorites.js';

describe('favorite item queries', () => {
  it('builds a bounded query for account-bookmarked items with their current cheapest row', () => {
    const query = buildFavoritesListQuery('user-1', { sort: 'price', limit: 25 });

    assert.deepEqual(query.values, ['user-1', 25]);
    assert.match(query.sql, /from watchlist_items/i);
    assert.match(query.sql, /join products on products\.id = watchlist_items\.product_id/i);
    assert.match(query.sql, /products\.deleted_at is null/i);
    assert.match(query.sql, /row_number\(\) over \(partition by latest_prices\.product_id order by latest_prices\.price asc/i);
    assert.match(query.sql, /left join stores on stores\.id = ranked_prices\.store_id/i);
    assert.match(query.sql, /coalesce\(latest_prices\.is_available, true\) = true/i);
    assert.match(query.sql, /order by cheapest_price asc nulls last, product_name asc/i);
    assert.match(query.sql, /limit \$2/i);
  });

  it('sorts favorites by product name when requested and clamps unsupported limits', () => {
    const query = buildFavoritesListQuery('user-1', { sort: 'name', limit: 10_000 });

    assert.deepEqual(query.values, ['user-1', 100]);
    assert.match(query.sql, /order by product_name asc, cheapest_price asc nulls last/i);
  });

  it('maps favorite rows into UI-ready numbers and labels without inventing prices', () => {
    assert.deepEqual(
      mapFavoriteItemRow({
        product_id: 'coffee',
        product_slug: 'coffee',
        product_name: 'Coffee',
        brand: 'Zoegas',
        image_url: 'https://example.com/coffee.png',
        cheapest_price: '49.90',
        currency: 'SEK',
        cheapest_store_id: 'willys-odenplan',
        cheapest_store_slug: 'willys-odenplan',
        cheapest_store_name: 'Willys Odenplan',
        observed_at: '2026-05-20T10:00:00.000Z',
        added_at: '2026-05-19T10:00:00.000Z'
      }),
      {
        productId: 'coffee',
        productSlug: 'coffee',
        productName: 'Coffee',
        brand: 'Zoegas',
        imageUrl: 'https://example.com/coffee.png',
        cheapestPrice: 49.9,
        currency: 'SEK',
        cheapestStoreId: 'willys-odenplan',
        cheapestStoreSlug: 'willys-odenplan',
        cheapestStoreName: 'Willys Odenplan',
        observedAt: '2026-05-20T10:00:00.000Z',
        addedAt: '2026-05-19T10:00:00.000Z'
      }
    );

    assert.equal(mapFavoriteItemRow({
      product_id: 'missing-price',
      product_slug: 'missing-price',
      product_name: 'Missing price',
      brand: null,
      image_url: null,
      cheapest_price: null,
      currency: null,
      cheapest_store_id: null,
      cheapest_store_slug: null,
      cheapest_store_name: null,
      observed_at: null,
      added_at: '2026-05-19T10:00:00.000Z'
    }).cheapestPrice, null);
  });
});
