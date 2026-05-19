import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresRepository, type QueryExecutor } from '../index.js';

class RecordingQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('select store_id')) return [{ store_id: 'willys-odenplan' }] as T[];
    if (sql.includes('select weekly_budget')) return [{ weekly_budget: '800', monthly_budget: '3200' }] as T[];
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
});
