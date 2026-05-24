import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserDataExportQueries } from '../queries/users.js';

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
});
