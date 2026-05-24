import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCategoryTreeQuery,
  mapCategoryTreeRow
} from '../queries/categories.js';

describe('category tree queries', () => {
  it('builds a derived category tree query from product category paths', () => {
    const query = buildCategoryTreeQuery();

    assert.deepEqual(query.values, []);
    assert.match(query.sql, /from products/i);
    assert.match(query.sql, /generate_subscripts\(products\.category_path, 1\)/i);
    assert.match(query.sql, /count\(distinct product_id\)::int as item_count/i);
    assert.match(query.sql, /parent_id/i);
    assert.match(query.sql, /order by depth, parent_id nulls first, name/i);
  });

  it('maps category rows into navigation-ready ids, slugs, parents, and counts', () => {
    assert.deepEqual(mapCategoryTreeRow({
      id: 'dairy/milk',
      name: 'Milk',
      slug: 'milk',
      parent_id: 'dairy',
      item_count: '12'
    }), {
      id: 'dairy/milk',
      name: 'Milk',
      slug: 'milk',
      parentId: 'dairy',
      itemCount: 12
    });
  });
});
