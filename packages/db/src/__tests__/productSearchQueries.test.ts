import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductSearchQuery,
  mapProductSearchRow,
  searchProductsByText
} from '../queries/productSearch.js';

describe('PostgreSQL product search query', () => {
  it('uses a bounded tsvector search over product name and brand', () => {
    const query = buildProductSearchQuery(' Zoégas coffee ', { limit: 12 });

    assert.ok(query);
    assert.deepEqual(query.values, ['Zoégas coffee', 12]);
    assert.match(query.sql, /websearch_to_tsquery\('simple', \$1\)/);
    assert.match(query.sql, /to_tsvector\('simple', coalesce\(products\.canonical_name, ''\) \|\| ' ' \|\| coalesce\(products\.brand, ''\)\)/);
    assert.match(query.sql, /products\.domain = 'grocery'/);
    assert.match(query.sql, /order by search_rank desc, products\.canonical_name asc/);
    assert.match(query.sql, /limit \$2/);
  });

  it('does not query PostgreSQL for empty or one-character searches', async () => {
    assert.equal(buildProductSearchQuery(' ', { limit: 5 }), null);
    assert.equal(buildProductSearchQuery('a', { limit: 5 }), null);

    let called = false;
    const results = await searchProductsByText({
      async query() {
        called = true;
        return [];
      }
    }, 'a');

    assert.equal(called, false);
    assert.deepEqual(results, []);
  });

  it('maps ranked PostgreSQL rows to dropdown result DTOs', () => {
    assert.deepEqual(mapProductSearchRow({
      id: 'product-1',
      slug: 'zoegas-coffee-450g',
      name: 'Zoégas Coffee 450g',
      brand: 'Zoégas',
      image_url: 'https://example.test/coffee.png',
      search_rank: '0.42'
    }), {
      id: 'product-1',
      slug: 'zoegas-coffee-450g',
      name: 'Zoégas Coffee 450g',
      brand: 'Zoégas',
      imageUrl: 'https://example.test/coffee.png',
      searchRank: 0.42
    });
  });
});
