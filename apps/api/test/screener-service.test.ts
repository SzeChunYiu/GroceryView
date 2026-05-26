import assert from 'node:assert/strict';
import { ServiceUnavailableException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { screenerRoutes } from '../src/routes/screener.js';
import { ScreenerService } from '../src/screener/screener.service.js';

const fixtureRows = [
  {
    product_id: 'p-coffee',
    product_slug: 'zoegas-coffee-450g',
    product_name: 'Zoégas Coffee 450g',
    brand: 'Zoégas',
    category_label: 'Coffee',
    chain_slug: 'willys',
    chain_name: 'Willys',
    store_slug: 'willys-stockholm',
    store_name: 'Willys Stockholm',
    latest_price: '49.90',
    previous_price: '69.90',
    savings_amount: '20.00',
    discount_percent: '28.61',
    currency: 'SEK',
    latest_observed_at: new Date('2026-05-24T08:30:00.000Z'),
    observation_count: '6'
  },
  {
    product_id: 'p-pasta',
    product_slug: 'pasta-penne-500g',
    product_name: 'Pasta Penne 500g',
    brand: null,
    category_label: null,
    chain_slug: 'hemkop',
    chain_name: 'Hemköp',
    store_slug: null,
    store_name: null,
    latest_price: 12.5,
    previous_price: 16.9,
    savings_amount: 4.4,
    discount_percent: 26.04,
    currency: 'SEK',
    latest_observed_at: '2026-05-24T09:00:00.000Z',
    observation_count: 3
  }
];

function createService(rows = fixtureRows) {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const service = new ScreenerService({
    isConfigured: () => true,
    query: async (sql: string, params: unknown[]) => {
      calls.push({ sql, params });
      return rows;
    }
  } as never);
  return { calls, service };
}

describe('ScreenerService discount query builder', () => {
  it('binds discount, category, and limit filters into the price-history query', async () => {
    const { calls, service } = createService();

    await service.discountRows({ minDiscountPercent: 15, category: 'Coffee', limit: 10 });

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0]?.params, [15, 'Coffee', 10]);
    assert.match(calls[0]?.sql ?? '', /with price_history as/);
    assert.match(calls[0]?.sql ?? '', /observations\.domain = 'grocery'/);
    assert.match(calls[0]?.sql ?? '', /discounted\.discount_percent >= \$1/);
    assert.match(calls[0]?.sql ?? '', /lower\(discounted\.category_label\) = lower\(\$2::text\)/);
    assert.match(calls[0]?.sql ?? '', /limit \$3/);
  });

  it('defaults optional filters and maps fixture rows without touching the DB implementation', async () => {
    const { calls, service } = createService();

    const report = await service.discountRows({ minDiscountPercent: 0 });

    assert.deepEqual(calls[0]?.params, [0, null, screenerRoutes.defaultLimit]);
    assert.equal(report.source, screenerRoutes.sourceCte);
    assert.equal(report.minDiscountPercent, 0);
    assert.equal(report.category, null);
    assert.equal(report.itemCount, 2);
    assert.deepEqual(report.items[0], {
      productId: 'p-coffee',
      productSlug: 'zoegas-coffee-450g',
      productName: 'Zoégas Coffee 450g',
      brand: 'Zoégas',
      category: 'Coffee',
      chainSlug: 'willys',
      chainName: 'Willys',
      storeSlug: 'willys-stockholm',
      storeName: 'Willys Stockholm',
      latestPrice: 49.9,
      previousPrice: 69.9,
      savingsAmount: 20,
      discountPercent: 28.61,
      currency: 'SEK',
      latestObservedAt: '2026-05-24T08:30:00.000Z',
      observationCount: 6
    });
    assert.equal(report.items[1]?.category, 'uncategorized');
    assert.equal(report.items[1]?.brand, undefined);
    assert.equal(report.items[1]?.storeSlug, undefined);
    assert.ok(report.guardrails.some((guardrail) => guardrail.includes('price_history')));
  });

  it('clamps limit filter boundaries before building the query', async () => {
    const { calls, service } = createService([]);

    await service.discountRows({ minDiscountPercent: 50, category: 'Pantry', limit: 500 });
    await service.discountRows({ minDiscountPercent: 5, category: 'Pantry', limit: -5 });

    assert.deepEqual(calls.map((call) => call.params), [
      [50, 'Pantry', screenerRoutes.maxLimit],
      [5, 'Pantry', 1]
    ]);
  });

  it('fails closed when the database executor is not configured', async () => {
    const service = new ScreenerService({
      isConfigured: () => false,
      query: async () => {
        throw new Error('query should not be called');
      }
    } as never);

    assert.equal(service.isConfigured(), false);
    await assert.rejects(
      () => service.discountRows({ minDiscountPercent: 10, category: 'Coffee', limit: 10 }),
      ServiceUnavailableException
    );
  });
});
