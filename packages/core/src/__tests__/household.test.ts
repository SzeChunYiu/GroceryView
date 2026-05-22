import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHouseholdState, planShareableHouseholdList, summarizeHousehold } from '../index.js';

describe('household mode', () => {
  it('merges household basket items with member attribution and shared budget', () => {
    const household = createHouseholdState({
      id: 'house-1',
      name: 'Odenplan Household',
      weeklyBudget: 1200,
      members: [
        { userId: 'billy', displayName: 'Billy' },
        { userId: 'partner', displayName: 'Partner' }
      ]
    });

    household.addBasketItem({ productId: 'milk', quantity: 2, addedBy: 'billy' });
    household.addBasketItem({ productId: 'diapers', quantity: 1, addedBy: 'partner' });
    household.addWatchlistItem({ productId: 'coffee', addedBy: 'billy', targetPrice: 50 });
    household.setSharedFavoriteStores(['lidl-sveavagen', 'willys-odenplan']);

    const summary = summarizeHousehold(household.snapshot(), { milk: 15, diapers: 149 });

    assert.deepEqual(summary.memberContributions, [
      { userId: 'billy', displayName: 'Billy', itemCount: 1 },
      { userId: 'partner', displayName: 'Partner', itemCount: 1 }
    ]);
    assert.equal(summary.estimatedTotal, 179);
    assert.equal(summary.remainingBudget, 1021);
    assert.deepEqual(summary.sharedFavoriteStoreIds, ['lidl-sveavagen', 'willys-odenplan']);
  });

  it('plans shareable household lists with role-based permissions and no anonymous edits', () => {
    const household = createHouseholdState({
      id: 'house-1',
      name: 'Odenplan Household',
      weeklyBudget: 1200,
      members: [
        { userId: 'owner', displayName: 'Owner' },
        { userId: 'partner', displayName: 'Partner' },
        { userId: 'teen', displayName: 'Teen' }
      ]
    });
    household.addBasketItem({ productId: 'milk', quantity: 2, addedBy: 'owner' });
    household.addBasketItem({ productId: 'coffee', quantity: 1, addedBy: 'partner' });

    const plan = planShareableHouseholdList(household.snapshot(), {
      requesterUserId: 'owner',
      recipients: [
        { userId: 'partner', role: 'editor' },
        { userId: 'teen', role: 'viewer' },
        { email: 'guest@example.com', role: 'viewer' }
      ],
      expiresAt: '2026-05-29T00:00:00.000Z'
    });

    assert.equal(plan.householdId, 'house-1');
    assert.equal(plan.canShare, true);
    assert.deepEqual(plan.permissions.map((permission) => [permission.recipient, permission.role, permission.canEdit]), [
      ['partner', 'editor', true],
      ['teen', 'viewer', false],
      ['guest@example.com', 'viewer', false]
    ]);
    assert.equal(plan.shareTokenRequired, true);
    assert.equal(plan.expiresAt, '2026-05-29T00:00:00.000Z');
    assert.equal(plan.itemCount, 2);
    assert.deepEqual(plan.blockers, []);
    assert.equal(plan.guardrails.some((guardrail) => /No anonymous/i.test(guardrail)), true);
  });

  it('blocks shareable household lists when requester is not a member or an invite can edit', () => {
    const household = createHouseholdState({
      id: 'house-1',
      name: 'Odenplan Household',
      weeklyBudget: 1200,
      members: [{ userId: 'owner', displayName: 'Owner' }]
    });

    const blocked = planShareableHouseholdList(household.snapshot(), {
      requesterUserId: 'stranger',
      recipients: [{ email: 'guest@example.com', role: 'editor' }]
    });

    assert.equal(blocked.canShare, false);
    assert.deepEqual(blocked.blockers, ['requester_not_household_member', 'external_invite_cannot_edit']);
    assert.equal(blocked.permissions[0]?.canEdit, false);
  });

});
