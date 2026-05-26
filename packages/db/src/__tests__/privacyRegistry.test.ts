import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPersonalDataRegistryForTables,
  personalDataRegistry,
  personalDataRegistryEntryForTable,
  verifyPersonalDataRegistryForTables
} from '../privacyRegistry.js';
import { buildUserAccountDeletionQueries, buildUserDataExportQueries } from '../queries/users.js';

const accountReceiptHouseholdTables = [
  'app_users',
  'favorite_stores',
  'user_preferences',
  'watchlist_items',
  'weekly_baskets',
  'basket_items',
  'basket_import_review_items',
  'receipt_uploads',
  'receipt_items',
  'household_plans',
  'household_members',
  'household_basket_items',
  'household_watchlist_items',
  'household_favorite_stores',
  'analytics_events'
];

describe('personal data processing registry', () => {
  it('covers account, receipt, household, and analytics tables with owner and legal metadata', () => {
    const result = assertPersonalDataRegistryForTables(accountReceiptHouseholdTables);

    assert.equal(result.ok, true);
    for (const table of accountReceiptHouseholdTables) {
      const entry = personalDataRegistryEntryForTable(table);
      assert.ok(entry, `${table} missing from personal data registry`);
      assert.equal(entry.owningPackage.length > 0, true);
      assert.equal(entry.purpose.length > 0, true);
      assert.equal(entry.retention.length > 0, true);
      assert.equal(entry.processors.length > 0, true);
    }
  });

  it('fails when a new account or receipt table lacks a registry entry', () => {
    const result = verifyPersonalDataRegistryForTables([
      ...accountReceiptHouseholdTables,
      'receipt_purchase_events'
    ]);

    assert.equal(result.ok, false);
    assert.deepEqual(result.missingTables, ['receipt_purchase_events']);
    assert.throws(
      () => assertPersonalDataRegistryForTables(['app_users', 'receipt_purchase_events']),
      /receipt_purchase_events/
    );
  });

  it('keeps registry export and delete coverage aligned with privacy query builders', () => {
    const exportQueries = buildUserDataExportQueries('user-1');
    const deletionQueries = buildUserAccountDeletionQueries('user-1');
    const exportedSections = new Set(exportQueries.map((query) => query.section));
    const deletedTables = new Set(deletionQueries.map((query) => query.table));

    assert.equal(exportedSections.has('profile'), true);
    assert.equal(exportedSections.has('lists'), true);
    assert.equal(exportedSections.has('alerts'), true);
    assert.equal(exportedSections.has('preferences'), true);
    assert.equal(exportedSections.has('analytics_events'), true);

    for (const table of deletedTables) {
      assert.equal(personalDataRegistryEntryForTable(table)?.deleteCoverage, true, `${table} delete coverage missing`);
    }
    assert.equal(personalDataRegistry.every((entry) => entry.exportCoverage || entry.deleteCoverage), true);
  });
});
