import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMobileMutationSyncResult,
  planMobileOfflineMutation,
  selectMobileMutationsForSync,
  summarizeMobileOfflineMutations
} from '../offlineMutations.js';

describe('mobile offline mutation queue', () => {
  it('plans basket, budget, watchlist, and receipt mutations with cache invalidations', () => {
    const basket = planMobileOfflineMutation({
      id: 'm-1',
      userId: ' user-1 ',
      type: 'basket_add_item',
      payload: { productId: 'coffee', quantity: 2 },
      createdAt: '2026-05-20T08:00:00.000Z'
    });
    const budget = planMobileOfflineMutation({
      id: 'm-2',
      userId: 'user-1',
      type: 'budget_set_weekly',
      payload: { weeklyBudget: 900 },
      createdAt: '2026-05-20T08:01:00.000Z'
    });
    const watchlist = planMobileOfflineMutation({
      id: 'm-3',
      userId: 'user-1',
      type: 'watchlist_add_item',
      payload: { productId: 'milk', targetPrice: 13.5 },
      createdAt: '2026-05-20T08:02:00.000Z'
    });
    const receipt = planMobileOfflineMutation({
      id: 'm-4',
      userId: 'user-1',
      type: 'receipt_confirm_items',
      payload: { receiptId: 'receipt-1', itemCount: 4, budgetImpact: 128.5 },
      createdAt: '2026-05-20T08:03:00.000Z'
    });

    assert.equal(basket.userId, 'user-1');
    assert.deepEqual(basket.invalidates, ['today', 'basket', 'budget']);
    assert.deepEqual(budget.invalidates, ['today', 'budget']);
    assert.deepEqual(watchlist.invalidates, ['today', 'product']);
    assert.deepEqual(receipt.invalidates, ['today', 'basket', 'budget']);
    assert.equal(receipt.sensitiveLocalOnly, true);
  });

  it('summarizes queue state and selects ready mutations in creation order', () => {
    const pending = planMobileOfflineMutation({
      id: 'm-1',
      userId: 'user-1',
      type: 'basket_add_item',
      payload: { productId: 'coffee', quantity: 1 },
      createdAt: '2026-05-20T08:00:00.000Z'
    });
    const delayed = {
      ...planMobileOfflineMutation({
        id: 'm-2',
        userId: 'user-1',
        type: 'budget_set_weekly',
        payload: { weeklyBudget: 900 },
        createdAt: '2026-05-20T08:01:00.000Z'
      }),
      status: 'failed' as const,
      attempt: 1,
      retryAfter: '2026-05-20T08:20:00.000Z'
    };
    const readyFailure = {
      ...planMobileOfflineMutation({
        id: 'm-3',
        userId: 'user-1',
        type: 'watchlist_add_item',
        payload: { productId: 'milk' },
        createdAt: '2026-05-20T08:02:00.000Z'
      }),
      status: 'failed' as const,
      attempt: 1,
      retryAfter: '2026-05-20T08:05:00.000Z'
    };
    const queue = [readyFailure, delayed, pending];

    assert.deepEqual(summarizeMobileOfflineMutations(queue, '2026-05-20T08:10:00.000Z'), {
      total: 3,
      pending: 1,
      syncing: 0,
      completed: 0,
      failed: 2,
      deadLettered: 0,
      readyToSync: 2,
      sensitiveLocalOnly: 0
    });
    assert.deepEqual(
      selectMobileMutationsForSync(queue, { now: '2026-05-20T08:10:00.000Z', limit: 5 }).map((mutation) => mutation.id),
      ['m-1', 'm-3']
    );
  });

  it('applies sync results with bounded retry backoff and dead lettering', () => {
    const mutation = planMobileOfflineMutation({
      id: 'm-1',
      userId: 'user-1',
      type: 'basket_add_item',
      payload: { productId: 'coffee', quantity: 1 },
      createdAt: '2026-05-20T08:00:00.000Z'
    });

    assert.deepEqual(
      applyMobileMutationSyncResult(mutation, { status: 'retry', reason: 'offline' }, { attemptedAt: '2026-05-20T08:10:00.000Z', maxAttempts: 3, backoffMinutes: [5, 15] }),
      {
        ...mutation,
        status: 'failed',
        attempt: 1,
        retryAfter: '2026-05-20T08:15:00.000Z'
      }
    );

    const secondFailure = { ...mutation, status: 'failed' as const, attempt: 2, retryAfter: null };
    assert.equal(
      applyMobileMutationSyncResult(secondFailure, { status: 'retry', reason: 'still offline' }, { attemptedAt: '2026-05-20T08:10:00.000Z', maxAttempts: 3, backoffMinutes: [5, 15] }).status,
      'dead_lettered'
    );
    assert.equal(
      applyMobileMutationSyncResult(mutation, { status: 'synced' }, { attemptedAt: '2026-05-20T08:10:00.000Z', maxAttempts: 3, backoffMinutes: [5] }).status,
      'completed'
    );
  });

  it('rejects unsafe or incomplete queued writes', () => {
    assert.throws(
      () =>
        planMobileOfflineMutation({
          id: 'm-1',
          userId: 'user-1',
          type: 'basket_add_item',
          payload: { productId: 'coffee', quantity: 0 },
          createdAt: '2026-05-20T08:00:00.000Z'
        }),
      /quantity must be positive/
    );
    assert.throws(
      () =>
        planMobileOfflineMutation({
          id: 'm-2',
          userId: 'user-1',
          type: 'receipt_confirm_items',
          payload: { receiptId: ' ', itemCount: 1, budgetImpact: 12 },
          createdAt: '2026-05-20T08:00:00.000Z'
        }),
      /receiptId is required/
    );
  });
});
