import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductStoreVolatilityQuery,
  listProductStoreVolatility,
  mapProductStoreVolatilityRow
} from '../queries/pricingVolatility.js';

describe('PostgreSQL pricing volatility query', () => {
  it('builds a bounded product-store history query from price_daily and latest_prices', () => {
    const query = buildProductStoreVolatilityQuery({
      productId: '11111111-1111-1111-1111-111111111111',
      storeIds: ['22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'],
      days: 45
    });

    assert.ok(query);
    assert.deepEqual(query.values, [
      '11111111-1111-1111-1111-111111111111',
      ['22222222-2222-2222-2222-222222222222'],
      45
    ]);
    assert.match(query.sql, /from price_daily/);
    assert.match(query.sql, /from latest_prices/);
    assert.match(query.sql, /store_id = any\(\$2::uuid\[\]\)/);
    assert.match(query.sql, /stddev_pop\(price\) \/ avg\(price\) \* 100/);
  });

  it('maps volatility rows to API DTOs', () => {
    assert.deepEqual(mapProductStoreVolatilityRow({
      product_id: 'product-1',
      store_id: 'store-1',
      sample_count: '7',
      min_price: '19.9',
      max_price: '25.5',
      average_price: '22.4',
      volatility_score: '8.12'
    }), {
      productId: 'product-1',
      storeId: 'store-1',
      sampleCount: 7,
      minPrice: 19.9,
      maxPrice: 25.5,
      averagePrice: 22.4,
      volatilityScore: 8.12,
      source: 'postgres.price_daily_or_latest_prices'
    });
  });

  it('does not query without a product and store pair', async () => {
    let called = false;
    const rows = await listProductStoreVolatility({
      async query() {
        called = true;
        return [];
      }
    }, { productId: 'product-1', storeIds: [] });

    assert.equal(called, false);
    assert.deepEqual(rows, []);
  });
});
