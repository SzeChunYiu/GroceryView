import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMobileAppSessionPlan } from '../appSession.js';
import { planMobileOfflineMutation } from '../offlineMutations.js';

describe('mobile app session plan', () => {
  it('hydrates the required routes and persisted query cache for a signed-in user', () => {
    const plan = buildMobileAppSessionPlan({
      userId: ' Shopper-1 ',
      now: '2026-05-20T08:00:00.000Z',
      connectivity: 'online',
      permissions: { camera: 'granted', notifications: 'granted' },
      offlineQueue: []
    });

    assert.equal(plan.userId, 'Shopper-1');
    assert.equal(plan.initialRoute, '/today');
    assert.equal(plan.cache.partitionKey, 'user:shopper-1');
    assert.deepEqual(plan.cache.hydrateOrder, ['today', 'stores', 'basket', 'budget', 'search', 'product', 'productTerminal']);
    assert.deepEqual(plan.routes.required, ['/today', '/stores', '/search', '/products/[id]', '/basket', '/budget', '/profile', '/household', '/privacy']);
    assert.deepEqual(plan.routes.placeholders, ['/scan/camera-placeholder', '/profile/notifications-placeholder']);
    assert.equal(plan.permissions.status, 'ready');
    assert.equal(plan.permissions.nextPromptSurface, null);
  });

  it('selects ready offline mutations when connectivity allows sync', () => {
    const queued = [
      planMobileOfflineMutation({
        id: 'mut-later',
        userId: 'shopper-1',
        type: 'budget_set_weekly',
        payload: { weeklyBudget: 900 },
        createdAt: '2026-05-20T07:30:00.000Z'
      }),
      planMobileOfflineMutation({
        id: 'mut-earlier',
        userId: 'shopper-1',
        type: 'basket_add_item',
        payload: { productId: 'milk-1', quantity: 2 },
        createdAt: '2026-05-20T07:00:00.000Z'
      })
    ];

    const plan = buildMobileAppSessionPlan({
      userId: 'shopper-1',
      now: '2026-05-20T08:00:00.000Z',
      connectivity: 'metered',
      permissions: { camera: 'not_determined', notifications: 'granted' },
      offlineQueue: queued
    });

    assert.equal(plan.offline.canSyncNow, true);
    assert.deepEqual(plan.offline.readyMutationIds, ['mut-earlier', 'mut-later']);
    assert.equal(plan.offline.pendingCount, 2);
    assert.equal(plan.permissions.status, 'needs_permission');
    assert.equal(plan.permissions.nextPromptSurface, '/scan/barcode');
    assert.deepEqual(plan.permissions.blockedSurfaces, ['/scan/barcode', '/scan/receipt']);
  });

  it('keeps queued writes local while offline', () => {
    const queued = [
      planMobileOfflineMutation({
        id: 'receipt-1',
        userId: 'shopper-1',
        type: 'receipt_confirm_items',
        payload: { receiptId: 'receipt-1', itemCount: 3, budgetImpact: 72.5 },
        createdAt: '2026-05-20T07:00:00.000Z'
      })
    ];

    const plan = buildMobileAppSessionPlan({
      userId: 'shopper-1',
      now: '2026-05-20T08:00:00.000Z',
      connectivity: 'offline',
      permissions: { camera: 'granted', notifications: 'blocked' },
      offlineQueue: queued
    });

    assert.equal(plan.offline.canSyncNow, false);
    assert.deepEqual(plan.offline.readyMutationIds, []);
    assert.equal(plan.offline.sensitiveLocalOnlyCount, 1);
    assert.equal(plan.permissions.status, 'blocked');
    assert.equal(plan.permissions.nextPromptSurface, '/profile/notifications-placeholder');
  });

  it('rejects missing users and invalid clock values', () => {
    assert.throws(
      () => buildMobileAppSessionPlan({ userId: ' ', now: '2026-05-20T08:00:00.000Z', connectivity: 'online', permissions: { camera: 'granted', notifications: 'granted' }, offlineQueue: [] }),
      /userId is required/
    );
    assert.throws(
      () => buildMobileAppSessionPlan({ userId: 'shopper-1', now: 'bad-date', connectivity: 'online', permissions: { camera: 'granted', notifications: 'granted' }, offlineQueue: [] }),
      /now must be an ISO date/
    );
  });
});
