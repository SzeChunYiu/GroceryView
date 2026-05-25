import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductSearchQuery,
  buildProductSuggestQuery,
  mapProductSearchRow,
  mapProductSuggestionRow,
  suggestProductsByPrefix,
  searchProductsByText
} from '../queries/productSearch.js';

describe('PostgreSQL product search query', () => {
  it('uses a bounded tsvector search over product name and brand', () => {
    const query = buildProductSearchQuery(' Zoégas coffee ', { limit: 12 });

    assert.ok(query);
    assert.deepEqual(query.values, ['Zoégas coffee', 12]);
    assert.match(query.sql, /websearch_to_tsquery\('simple', unaccent\(\$1\)\)/);
    assert.match(query.sql, /to_tsvector\('simple', unaccent\(coalesce\(products\.canonical_name, ''\) \|\| ' ' \|\| coalesce\(products\.name_sv, ''\) \|\| ' ' \|\| coalesce\(products\.name_en, ''\) \|\| ' ' \|\| coalesce\(products\.brand, ''\)\)\)/);
    assert.match(query.sql, /products\.domain = 'grocery'/);
    assert.match(query.sql, /order by search_rank desc, similarity\(lower\(unaccent\(coalesce\(products\.canonical_name, ''\).*products\.canonical_name asc/s);
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

  it('builds a bounded pg_trgm prefix suggestion query over product names', () => {
    const query = buildProductSuggestQuery(' mjö ', { limit: 50 });

    assert.ok(query);
    assert.deepEqual(query.values, ['mjö', 8]);
    assert.match(query.sql, /products\.canonical_name ilike query\.raw_prefix \|\| '%'/);
    assert.match(query.sql, /coalesce\(products\.name_sv, ''\) ilike query\.raw_prefix \|\| '%'/);
    assert.match(query.sql, /lower\(unaccent\(products\.canonical_name\)\) like query\.query_prefix \|\| '%'/);
    assert.match(query.sql, /lower\(unaccent\(coalesce\(products\.name_sv, ''\)\)\) like query\.query_prefix \|\| '%'/);
    assert.match(query.sql, /similarity\(lower\(unaccent\(coalesce\(products\.canonical_name, ''\).*query\.query_prefix\)/s);
    assert.match(query.sql, /products\.domain = 'grocery'/);
    assert.match(query.sql, /limit \$2/);
  });

  it('maps and executes prefix suggestions without querying blank input', async () => {
    assert.equal(buildProductSuggestQuery(''), null);

    let calls = 0;
    const blank = await suggestProductsByPrefix({
      async query() {
        calls += 1;
        return [];
      }
    }, '');
    assert.equal(calls, 0);
    assert.deepEqual(blank, []);

    assert.deepEqual(mapProductSuggestionRow({
      id: 'product-1',
      slug: 'standardmjolk-1l',
      name: 'Standardmjölk 1 l',
      brand: 'Arla',
      image_url: null,
      match_rank: '1'
    }), {
      id: 'product-1',
      slug: 'standardmjolk-1l',
      name: 'Standardmjölk 1 l',
      brand: 'Arla',
      imageUrl: null,
      matchRank: 1
    });
  });
});
