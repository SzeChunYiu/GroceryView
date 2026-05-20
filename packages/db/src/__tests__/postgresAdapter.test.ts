import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPostgresCatalogReader,
  createPostgresPriceObservationWriter,
  createPostgresPriceReader,
  createPostgresProductAliasRepository,
  createPostgresRepository,
  createPostgresSourceRecordReader,
  createPostgresSourceRecordWriter,
  type QueryExecutor
} from '../index.js';

class RecordingQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];
  basketId: string | number = 'basket-1';

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('update source_runs')) return this.sourceRunId === undefined ? ([] as T[]) : ([{ id: this.sourceRunId }] as T[]);
    if (sql.includes('insert into source_runs')) return this.sourceRunId === undefined ? ([] as T[]) : ([{ id: this.sourceRunId }] as T[]);
    if (sql.includes('from source_runs')) return this.sourceRunRows as T[];
    if (sql.includes('insert into raw_records')) return this.rawRecordId === undefined ? ([] as T[]) : ([{ id: this.rawRecordId }] as T[]);
    if (sql.includes('from raw_records')) return this.rawRecordRows as T[];
    if (sql.includes('insert into observations')) return this.observationId === undefined ? ([] as T[]) : ([{ id: this.observationId }] as T[]);
    if (sql.includes('from latest_prices')) return this.latestPriceRows as T[];
    if (sql.includes('from observations')) return this.observationHistoryRows as T[];
    if (sql.includes('from stores')) return this.storeRows as T[];
    if (sql.includes('from products')) return this.productRows as T[];
    if (sql.includes('insert into aliases')) return this.aliasRows as T[];
    if (sql.includes('from aliases')) return this.aliasRows as T[];
    if (sql.includes('from subscription_entitlements')) return this.subscriptionEntitlementRows as T[];
    if (sql.includes('select store_id')) return [{ store_id: 'willys-odenplan' }] as T[];
    if (sql.includes('select weekly_budget')) return [{ weekly_budget: '800', monthly_budget: '3200' }] as T[];
    if (sql.includes('insert into weekly_baskets')) return [{ id: this.basketId }] as T[];
    return [] as T[];
  }
}

describe('createPostgresRepository', () => {
  it('uses parameterized SQL for user preferences and favorite stores', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertUser({ id: 'user-1', email: 'shopper@example.com' });
    await repo.addFavoriteStore('user-1', 'willys-odenplan');
    assert.deepEqual(await repo.getFavoriteStoreIds('user-1'), ['willys-odenplan']);
    await repo.upsertBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });
    assert.deepEqual(await repo.getBudget('user-1'), { weeklyBudget: 800, monthlyBudget: 3200 });

    assert.equal(executor.calls.every((call) => call.sql.includes('$') || call.sql.startsWith('select')), true);
    assert.deepEqual(executor.calls[0].params, ['user-1', 'shopper@example.com']);
  });

  it('reuses the current weekly basket and inserts basket items with the returned id', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.addBasketItem('user-1', { productId: 'coffee', quantity: 2 });

    const weeklyBasketCall = executor.calls.find((call) => call.sql.includes('insert into weekly_baskets'));
    assert.match(weeklyBasketCall?.sql ?? '', /on conflict \(user_id, week_start\) do update/);
    assert.match(weeklyBasketCall?.sql ?? '', /returning id/);

    const basketItemCall = executor.calls.find((call) => call.sql.includes('insert into basket_items'));
    assert.deepEqual(basketItemCall?.params, ['basket-1', 'coffee', 2]);
  });

  it('fails instead of writing basket items against a missing basket id', async () => {
    const executor = new RecordingQueryExecutor();
    executor.basketId = undefined as unknown as string;
    const repo = createPostgresRepository(executor);

    await assert.rejects(
      repo.addBasketItem('user-1', { productId: 'coffee', quantity: 2 }),
      /Weekly basket was not returned for user: user-1/
    );
    assert.equal(executor.calls.some((call) => call.sql.includes('insert into basket_items')), false);
  });
});
