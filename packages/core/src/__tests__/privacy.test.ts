import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrivacyExport, planAccountDeletion, redactForAdvertisers } from '../index.js';

describe('privacy controls', () => {
  it('builds user data export without leaking internal trust metadata', () => {
    const exported = buildPrivacyExport({
      userId: 'user-1',
      favoriteStoreIds: ['willys-odenplan'],
      watchlistProductIds: ['coffee'],
      receiptIds: ['receipt-1'],
      householdIds: ['house-1']
    });

    assert.deepEqual(exported.sections.map((section) => section.name), ['profile', 'favorite_stores', 'watchlist', 'receipts', 'households']);
  });

  it('plans account deletion across sensitive tables', () => {
    const plan = planAccountDeletion('user-1');

    assert.deepEqual(plan.deleteFromTables, ['watchlist_items', 'favorite_stores', 'basket_items', 'weekly_baskets', 'receipt_items', 'receipt_uploads', 'user_preferences', 'app_users']);
    assert.deepEqual(plan.anonymizeTables, ['community_price_reports']);
  });

  it('redacts receipt and private budget data from advertiser payloads', () => {
    const payload = redactForAdvertisers({
      userId: 'user-1',
      district: 'Odenplan',
      categoryInterest: 'coffee',
      weeklyBudget: 800,
      receiptTotal: 642,
      receiptImageUrl: 'private://receipt'
    });

    assert.deepEqual(payload, { district: 'Odenplan', categoryInterest: 'coffee' });
  });
});
