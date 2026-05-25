import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRollingAverageDealsQuery, mapRollingAverageDealRow } from '../queries/deals.js';

describe('deal queries', () => {
  it('builds current deal query against 30-day rolling averages with an optional category filter', () => {
    const query = buildRollingAverageDealsQuery('2026-05-24T12:00:00.000Z', ' dairy ');

    assert.deepEqual(query.values, ['2026-05-24T12:00:00.000Z', 'dairy']);
    assert.match(query.sql, /from latest_prices/i);
    assert.match(query.sql, /observations\.observed_at > \(\$1::timestamptz - interval '30 days'\)/i);
    assert.match(query.sql, /current_prices\.price < rolling_averages\.rolling_average_price/i);
    assert.match(query.sql, /order by discount_percentage desc/i);
    assert.match(query.sql, /lower\(category\) = lower\(\$2::text\)/i);
  });

  it('maps rolling-average deal rows into API-ready objects', () => {
    const deal = mapRollingAverageDealRow({
      product_id: 'product-coffee',
      product_slug: 'coffee',
      product_name: 'Zoegas Coffee 450g',
      category_path: ['coffee'],
      store_id: 'store-willys',
      store_slug: 'willys-odenplan',
      store_name: 'Willys Odenplan',
      chain_id: 'chain-willys',
      chain_slug: 'willys',
      chain_name: 'Willys',
      current_price: '49.90',
      currency: 'SEK',
      observed_at: '2026-05-24T09:00:00.000Z',
      rolling_average_price: '64.90',
      discount_percentage: '23.11'
    });

    assert.deepEqual(deal, {
      productId: 'product-coffee',
      productSlug: 'coffee',
      productName: 'Zoegas Coffee 450g',
      category: 'coffee',
      categoryPath: ['coffee'],
      storeId: 'store-willys',
      storeSlug: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      chainId: 'chain-willys',
      chainSlug: 'willys',
      chainName: 'Willys',
      currentPrice: 49.9,
      rollingAveragePrice: 64.9,
      discountPercentage: 23.11,
      currency: 'SEK',
      observedAt: '2026-05-24T09:00:00.000Z'
    });
  });
});
