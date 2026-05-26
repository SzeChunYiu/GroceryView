import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryRollingAverageDealReport, type QueryExecutor } from '@groceryview/db';
import { createHttpHandler } from '../index.js';

type QueryCall = {
  sql: string;
  params: unknown[];
};

class QueryCountingExecutor implements QueryExecutor {
  readonly calls: QueryCall[] = [];

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.calls.push({ sql, params });
    return [
      {
        product_id: 'coffee-1',
        product_slug: 'coffee-1',
        product_name: 'Bryggkaffe 450 g',
        category_path: ['coffee'],
        store_id: 'store-1',
        store_slug: 'willys-odenplan',
        store_name: 'Willys Odenplan',
        chain_id: 'chain-1',
        chain_slug: 'willys',
        chain_name: 'Willys',
        current_price: '49.90',
        currency: 'SEK',
        observed_at: '2026-05-24T10:00:00.000Z',
        rolling_average_price: '59.90',
        discount_percentage: '16.69'
      },
      {
        product_id: 'milk-1',
        product_slug: 'milk-1',
        product_name: 'Standardmjolk 1 l',
        category_path: ['dairy'],
        store_id: 'store-1',
        store_slug: 'willys-odenplan',
        store_name: 'Willys Odenplan',
        chain_id: 'chain-1',
        chain_slug: 'willys',
        chain_name: 'Willys',
        current_price: '13.90',
        currency: 'SEK',
        observed_at: '2026-05-24T10:00:00.000Z',
        rolling_average_price: '15.90',
        discount_percentage: '12.58'
      }
    ] as T[];
  }

  get selectCount() {
    return this.calls.filter((call) => /^\s*(select|with)\b/i.test(call.sql)).length;
  }
}

describe('N+1 query regression guard', () => {
  it('serves the public deals list with exactly one SELECT-shaped query', async () => {
    const executor = new QueryCountingExecutor();
    const handle = createHttpHandler(undefined, {
      dealsProvider: (query) => queryRollingAverageDealReport(executor, {
        asOf: '2026-05-24T12:00:00.000Z',
        category: query.category
      })
    });

    const response = await handle(new Request('http://localhost/api/deals?category=coffee'));
    assert.equal(response.status, 200);

    const body = await response.json() as { dealCount: number; deals: unknown[] };
    assert.equal(body.dealCount, 2);
    assert.equal(body.deals.length, 2);
    assert.equal(executor.selectCount, 1);
    assert.match(executor.calls[0]?.sql ?? '', /with current_prices as/i);
    assert.deepEqual(executor.calls[0]?.params, ['2026-05-24T12:00:00.000Z', 'coffee']);
  });
});
