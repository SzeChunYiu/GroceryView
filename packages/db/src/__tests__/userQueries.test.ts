import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdminUserListQuery,
  buildDisableAdminUserQuery,
  buildResendVerificationAdminUserQuery,
  buildUserAccountDeletionQueries,
  buildUserDataExportQueries
} from '../queries/users.js';

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

describe('admin user management queries', () => {
  it('builds a bounded paginated user list with active alert counts', () => {
    const query = buildAdminUserListQuery(500, -10);
    const fallbackQuery = buildAdminUserListQuery(Number.NaN, Number.NaN);

    assert.deepEqual(query.values, [100, 0]);
    assert.deepEqual(fallbackQuery.values, [50, 0]);
    assert.match(query.sql, /from app_users/i);
    assert.match(query.sql, /left join watchlist_items/i);
    assert.match(query.sql, /active_alert_count/i);
    assert.match(query.sql, /disabled_at/i);
    assert.match(query.sql, /verification_sent_at/i);
    assert.match(query.sql, /limit \$1 offset \$2/i);
  });

  it('builds account disable and verification resend mutations', () => {
    const disable = buildDisableAdminUserQuery('user-1');
    const resend = buildResendVerificationAdminUserQuery('user-1');

    assert.equal(disable.action, 'disable_account');
    assert.deepEqual(disable.values, ['user-1']);
    assert.match(disable.sql, /update app_users/i);
    assert.match(disable.sql, /set disabled_at = coalesce\(disabled_at, now\(\)\)/i);
    assert.match(disable.sql, /returning id/i);
    assert.match(disable.sql, /active_alert_count/i);

    assert.equal(resend.action, 'resend_verification');
    assert.deepEqual(resend.values, ['user-1']);
    assert.match(resend.sql, /update app_users/i);
    assert.match(resend.sql, /set verification_sent_at = now\(\)/i);
    assert.match(resend.sql, /returning id/i);
    assert.match(resend.sql, /active_alert_count/i);
  });
});
