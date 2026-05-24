import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrivacyExport, planAccountDeletion, planPrivacyRequestFulfillment, redactForAdvertisers } from '../index.js';

describe('privacy controls', () => {
  it('builds user data export without leaking internal trust metadata', () => {
    const exported = buildPrivacyExport({
      userId: 'user-1',
      favoriteStoreIds: ['willys-odenplan'],
      watchlistProductIds: ['coffee'],
      receiptIds: ['receipt-1'],
      householdIds: ['house-1'],
      friendSharedDealSignals: [{ signalId: 'friend-share-1', productId: 'coffee' }],
      lists: [{ id: 'current_basket', itemCount: 2 }],
      alerts: [{ id: 'target-price-coffee', productId: 'coffee' }],
      preferences: [{ name: 'budget', weeklyBudget: 800 }],
      analyticsEvents: [{ event: 'settings_export_clicked', occurredAt: '2026-05-20T12:00:00.000Z' }]
    });

    assert.deepEqual(exported.sections.map((section) => section.name), [
      'profile',
      'lists',
      'alerts',
      'preferences',
      'analytics_events',
      'favorite_stores',
      'watchlist',
      'receipts',
      'households',
      'friend_shared_deal_signals'
    ]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'lists')?.records, [{ id: 'current_basket', itemCount: 2 }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'alerts')?.records, [{ id: 'target-price-coffee', productId: 'coffee' }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'preferences')?.records, [{ name: 'budget', weeklyBudget: 800 }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'analytics_events')?.records, [{ event: 'settings_export_clicked', occurredAt: '2026-05-20T12:00:00.000Z' }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'friend_shared_deal_signals')?.records, [{ signalId: 'friend-share-1', productId: 'coffee' }]);
  });

  it('plans account deletion across sensitive tables', () => {
    const plan = planAccountDeletion('user-1');

    assert.deepEqual(plan.deleteFromTables, ['watchlist_items', 'favorite_stores', 'basket_items', 'weekly_baskets', 'receipt_items', 'receipt_uploads', 'friend_shared_deal_signals', 'user_preferences', 'app_users']);
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

  it('tracks privacy export, deletion, and ad opt-out fulfillment deadlines', () => {
    const plan = planPrivacyRequestFulfillment({
      now: '2026-05-20T12:00:00.000Z',
      slaDays: 30,
      alertBeforeDays: 5,
      requests: [
        {
          id: 'request-overdue',
          userId: 'user-1',
          type: 'data_export',
          receivedAt: '2026-04-19T12:00:00.000Z',
          status: 'in_progress'
        },
        {
          id: 'request-due-soon',
          userId: 'user-2',
          type: 'account_deletion',
          receivedAt: '2026-04-25T12:00:00.000Z',
          status: 'received'
        },
        {
          id: 'request-open',
          userId: 'user-3',
          type: 'ad_data_opt_out',
          receivedAt: '2026-05-10T12:00:00.000Z',
          status: 'received'
        },
        {
          id: 'request-closed',
          userId: 'user-4',
          type: 'data_export',
          receivedAt: '2026-04-10T12:00:00.000Z',
          status: 'fulfilled'
        }
      ]
    });

    assert.equal(plan.status, 'attention_required');
    assert.deepEqual(plan.overdueRequestIds, ['request-overdue']);
    assert.deepEqual(plan.dueSoonRequestIds, ['request-due-soon']);
    assert.deepEqual(plan.items.map((item) => ({
      id: item.id,
      dueAt: item.dueAt,
      daysUntilDue: item.daysUntilDue,
      requiredAction: item.requiredAction,
      risk: item.risk
    })), [
      {
        id: 'request-overdue',
        dueAt: '2026-05-19T12:00:00.000Z',
        daysUntilDue: -1,
        requiredAction: 'fulfill_export',
        risk: 'overdue'
      },
      {
        id: 'request-due-soon',
        dueAt: '2026-05-25T12:00:00.000Z',
        daysUntilDue: 5,
        requiredAction: 'fulfill_deletion',
        risk: 'due_soon'
      },
      {
        id: 'request-open',
        dueAt: '2026-06-09T12:00:00.000Z',
        daysUntilDue: 20,
        requiredAction: 'apply_ad_opt_out',
        risk: 'on_track'
      },
      {
        id: 'request-closed',
        dueAt: '2026-05-10T12:00:00.000Z',
        daysUntilDue: -10,
        requiredAction: 'none',
        risk: 'closed'
      }
    ]);
  });

  it('keeps privacy request fulfillment healthy when open requests are outside the alert window', () => {
    const plan = planPrivacyRequestFulfillment({
      now: '2026-05-20T12:00:00.000Z',
      slaDays: 30,
      alertBeforeDays: 5,
      requests: [
        {
          id: 'request-open',
          userId: 'user-1',
          type: 'data_export',
          receivedAt: '2026-05-10T12:00:00.000Z',
          status: 'received'
        }
      ]
    });

    assert.equal(plan.status, 'healthy');
    assert.deepEqual(plan.overdueRequestIds, []);
    assert.deepEqual(plan.dueSoonRequestIds, []);
  });
});
