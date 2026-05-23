import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDbSiteSnapshot,
  renderSnapshotModule
} from './generate-db-site-snapshot.mjs';

describe('generate-db-site-snapshot', () => {
  it('maps Postgres latest_prices and observations into the typed web snapshot module', async () => {
    const calls = [];
    const pool = {
      async query(sql, params) {
        calls.push({ sql, params });
        if (sql.includes('from stats')) {
          return {
            rows: [
              {
                code: '7310000000000',
                slug: 'bryggkaffe-450g',
                name: 'Bryggkaffe 450g',
                brands: 'Rosteriet',
                image: 'https://example.invalid/coffee.png',
                quantity: '450 g',
                nutriscore: 'c',
                categories: ['en:coffee', 'en:breakfasts'],
                price_min: 49.9,
                price_median: 54.9,
                price_max: 59.9,
                observation_count: 3,
                last_observed_at: '2026-05-23',
                observations: [
                  { price: 54.9, date: '2026-05-23' },
                  { price: 59.9, date: '2026-05-20' }
                ]
              }
            ]
          };
        }
        if (sql.includes('group by c.slug')) {
          return {
            rows: [
              {
                source: 'willys',
                label: 'Willys',
                row_count: 1,
                retrieved_at: new Date('2026-05-23T08:00:00.000Z')
              }
            ]
          };
        }
        if (sql.includes('from latest_prices lp')) {
          return {
            rows: [
              {
                code: '7310000000000',
                product_slug: 'bryggkaffe-450g',
                product_name: 'Bryggkaffe 450g',
                brand: 'Rosteriet',
                image_url: 'https://example.invalid/coffee.png',
                chain_slug: 'willys',
                chain_name: 'Willys',
                store_slug: 'willys-odenplan',
                store_name: 'Willys Odenplan',
                price: 54.9,
                regular_price: 59.9,
                unit_price: 122.0,
                currency: 'SEK',
                price_type: 'shelf',
                observed_at: new Date('2026-05-23T08:00:00.000Z'),
                confidence: 0.95,
                quantity: 450,
                quantity_unit: 'g',
                promotion_text: null,
                member_required: false,
                retailer_product_ref: 'willys-7310000000000',
                provenance: { sourceRunId: 'source-run-1' }
              }
            ]
          };
        }
        if (sql.includes('count(*)::int as observation_count')) {
          return {
            rows: [
              {
                observation_count: 3,
                newest_observed_at: new Date('2026-05-23T08:00:00.000Z')
              }
            ]
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    };

    const snapshot = await buildDbSiteSnapshot({
      pool,
      limit: 25,
      now: new Date('2026-05-23T09:00:00.000Z')
    });

    assert.equal(calls.length, 4);
    assert.deepEqual(calls[0]?.params, [25]);
    assert.equal(snapshot.meta.source, 'postgres');
    assert.equal(snapshot.meta.latestPriceCount, 1);
    assert.equal(snapshot.meta.pricedProductCount, 1);
    assert.equal(snapshot.meta.observationCount, 3);
    assert.equal(snapshot.meta.newestObservedAt, '2026-05-23T08:00:00.000Z');
    assert.equal(snapshot.pricedProducts[0]?.category, 'coffee-tea');
    assert.equal(snapshot.pricedProducts[0]?.priceMedian, 54.9);
    assert.equal(snapshot.sourceSummaries[0]?.source, 'willys');
    assert.equal(snapshot.latestPrices[0]?.storeName, 'Willys Odenplan');
    assert.equal(snapshot.latestPrices[0]?.observedAt, '2026-05-23T08:00:00.000Z');

    const moduleSource = renderSnapshotModule(snapshot);
    assert.match(moduleSource, /export const dbLatestPrices: DbLatestPrice\[\]/);
    assert.match(moduleSource, /Bryggkaffe 450g/);
    assert.match(moduleSource, /latest_prices and observations/);
  });
});
