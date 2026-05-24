import { describe, expect, it } from 'vitest';
import { planAccountDeletion } from '../../index.js';

const expectedDeletionTables = [
  'watchlist_items',
  'favorite_stores',
  'basket_items',
  'weekly_baskets',
  'receipt_items',
  'receipt_uploads',
  'user_preferences',
  'app_users'
];
const expectedAnonymizeTables = ['community_price_reports'];

describe('planAccountDeletion', () => {
  it('builds the deletion plan for a grocery shopper fixture', () => {
    const plan = planAccountDeletion('user-stockholm-family-001');

    expect(plan).toEqual({
      userId: 'user-stockholm-family-001',
      deleteFromTables: expectedDeletionTables,
      anonymizeTables: expectedAnonymizeTables,
      reason: 'Delete personal account, budget, basket, watchlist, and receipt data; anonymize community observations that may still support aggregate price quality.'
    });
  });

  it('preserves the empty user id fixture while planning all privacy cleanup', () => {
    const plan = planAccountDeletion('');

    expect(plan.userId).toBe('');
    expect(plan.deleteFromTables).toEqual(expectedDeletionTables);
    expect(plan.anonymizeTables).toEqual(expectedAnonymizeTables);
    expect(plan.reason).toContain('Delete personal account');
  });

  it('keeps a missing user id visible for malformed input handling', () => {
    const plan = planAccountDeletion(undefined as unknown as string);

    expect(plan.userId).toBeUndefined();
    expect(plan.deleteFromTables).toEqual(expectedDeletionTables);
    expect(plan.anonymizeTables).toEqual(expectedAnonymizeTables);
    expect(plan.reason).toContain('anonymize community observations');
  });
});
