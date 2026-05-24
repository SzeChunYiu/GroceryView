import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserAccountDeletionQueries, buildUserDataExportQueries } from '../queries/users.js';

describe('user data export queries', () => {
  it('builds parameterized account-owned export queries for GDPR sections', () => {
    const queries = buildUserDataExportQueries('user-1');

    assert.deepEqual(queries.map((query) => query.section), ['profile', 'lists', 'alerts', 'preferences', 'analytics_events']);
    for (const query of queries) assert.deepEqual(query.values, ['user-1']);
    assert.match(queries.find((query) => query.section === 'profile')?.sql ?? '', /from app_users/i);
    assert.match(queries.find((query) => query.section === 'lists')?.sql ?? '', /from weekly_baskets/i);
    assert.match(queries.find((query) => query.section === 'lists')?.sql ?? '', /join basket_items/i);
    assert.match(queries.find((query) => query.section === 'alerts')?.sql ?? '', /from watchlist_items/i);
    assert.match(queries.find((query) => query.section === 'preferences')?.sql ?? '', /from user_preferences/i);
    assert.match(queries.find((query) => query.section === 'analytics_events')?.sql ?? '', /where false/i);
  });

  it('builds ordered account deletion queries for user-owned lists, alerts, preferences, and profile', () => {
    const queries = buildUserAccountDeletionQueries('user-1');

    assert.deepEqual(queries.map((query) => query.table), [
      'basket_items',
      'weekly_baskets',
      'watchlist_items',
      'user_preferences',
      'favorite_stores',
      'app_users'
    ]);
    for (const query of queries) assert.deepEqual(query.values, ['user-1']);
    assert.match(queries.find((query) => query.table === 'basket_items')?.sql ?? '', /delete from basket_items/i);
    assert.match(queries.find((query) => query.table === 'basket_items')?.sql ?? '', /using weekly_baskets/i);
    assert.match(queries.find((query) => query.table === 'weekly_baskets')?.sql ?? '', /delete from weekly_baskets/i);
    assert.match(queries.find((query) => query.table === 'watchlist_items')?.sql ?? '', /delete from watchlist_items/i);
    assert.match(queries.find((query) => query.table === 'user_preferences')?.sql ?? '', /delete from user_preferences/i);
    assert.match(queries.find((query) => query.table === 'app_users')?.sql ?? '', /delete from app_users/i);
  });
});
