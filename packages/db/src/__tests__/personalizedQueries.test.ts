import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPersonalizedWeeklyDigestQuery,
  mapPersonalizedWeeklyDigestRows
} from '../queries/personalized.js';

describe('personalized weekly digest query', () => {
  it('builds a bounded email opt-in query over saved list products', () => {
    const query = buildPersonalizedWeeklyDigestQuery({
      since: '2026-05-18T00:00:00.000Z',
      until: '2026-05-25T00:00:00.000Z',
      limitPerUser: 50
    });

    assert.deepEqual(query.values, ['2026-05-18T00:00:00.000Z', '2026-05-25T00:00:00.000Z', 10]);
    assert.match(query.sql, /personalized_weekly_digest/);
    assert.match(query.sql, /user_preferences\.notification_channels @> array\['email'\]::text\[\]/);
    assert.match(query.sql, /from user_product_searches/i);
    assert.match(query.sql, /'search'::text as source/i);
    assert.match(query.sql, /from watchlist_items/i);
    assert.match(query.sql, /join basket_items on basket_items\.basket_id = weekly_baskets\.id/i);
    assert.match(query.sql, /products\.deleted_at is null/i);
    assert.match(query.sql, /latest_prices\.observed_at >= \$1::timestamptz/i);
    assert.match(query.sql, /deal_rank <= \$3/i);
  });

  it('groups cheapest deal rows by recipient while preserving interest source labels', () => {
    const recipients = mapPersonalizedWeeklyDigestRows([
      {
        user_id: 'user-1',
        recipient_email: 'shopper@example.com',
        product_id: 'coffee',
        product_slug: 'zoegas-coffee',
        product_name: 'Bryggkaffe',
        brand: 'Zoégas',
        chain_slug: 'willys',
        chain_name: 'Willys',
        store_slug: 'willys-odenplan',
        store_name: 'Willys Odenplan',
        price_type: 'promotion',
        price: '39.90',
        regular_price: '54.90',
        unit_price: '88.67',
        currency: 'SEK',
        observed_at: new Date('2026-05-24T08:00:00.000Z'),
        interest_sources: ['basket', 'watchlist']
      }
    ]);

    assert.deepEqual(recipients, [
      {
        userId: 'user-1',
        email: 'shopper@example.com',
        deals: [
          {
            productId: 'coffee',
            productSlug: 'zoegas-coffee',
            productName: 'Bryggkaffe',
            brand: 'Zoégas',
            chainSlug: 'willys',
            chainName: 'Willys',
            storeSlug: 'willys-odenplan',
            storeName: 'Willys Odenplan',
            priceType: 'promotion',
            price: 39.9,
            regularPrice: 54.9,
            unitPrice: 88.67,
            currency: 'SEK',
            observedAt: '2026-05-24T08:00:00.000Z',
            interestSources: ['basket', 'watchlist']
          }
        ]
      }
    ]);
  });
});
