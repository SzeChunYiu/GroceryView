import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MobileReceiptReview } from '../receipts.js';
import { buildMobileReceiptReviewPlan, selectMobileReceiptReviewRows } from '../receipts.js';

const review: MobileReceiptReview = {
  storeId: 'willys-odenplan',
  purchasedAt: '2026-05-19T16:00:00.000Z',
  confidenceLabel: 'medium-high',
  matchedItems: [
    { rawName: 'ZOEGA SKANEROST', productId: 'coffee', canonicalName: 'Zoégas Coffee 450g', itemTotal: 49.9, matchConfidence: 0.9, deltaVsMedian: -15 },
    { rawName: 'CHEESE 500G', productId: 'cheese', canonicalName: 'Cheese 500g', itemTotal: 78, matchConfidence: 0.7, deltaVsMedian: 18 },
    { rawName: 'SMUDGED ITEM', productId: null, canonicalName: null, itemTotal: 18, matchConfidence: 0, deltaVsMedian: 0 }
  ],
  goodBuys: [{ rawName: 'ZOEGA SKANEROST', productId: 'coffee', canonicalName: 'Zoégas Coffee 450g', itemTotal: 49.9, matchConfidence: 0.9, deltaVsMedian: -15 }],
  overspend: [{ rawName: 'CHEESE 500G', productId: 'cheese', canonicalName: 'Cheese 500g', itemTotal: 78, matchConfidence: 0.7, deltaVsMedian: 18 }],
  comparedWithLocalMedianDelta: 3,
  budget: {
    weeklyBudget: 800,
    beforeReceiptSpend: 120,
    afterReceiptSpend: 762,
    remaining: 38,
    status: 'under'
  }
};

describe('mobile receipt review plan', () => {
  it('summarizes receipt OCR review and blocks confirmation until uncertain rows are reviewed', () => {
    const plan = buildMobileReceiptReviewPlan({
      userId: 'shopper-1',
      receiptId: 'receipt-1',
      review,
      now: '2026-05-20T09:00:00.000Z',
      networkOnline: true,
      cameraPermissionReady: true
    });

    assert.equal(plan.route, '/scan/receipt');
    assert.equal(plan.status, 'needs_review');
    assert.deepEqual(plan.blockers, ['line_match_review_required']);
    assert.deepEqual(plan.actions, ['review_line_matches']);
    assert.equal(plan.confirmationMutation, null);
    assert.deepEqual(plan.summary, {
      lineCount: 3,
      matchedCount: 2,
      needsReviewCount: 2,
      goodBuyCount: 1,
      overspendCount: 1,
      budgetImpact: 642,
      weeklyRemainingAfterReceipt: 38,
      weeklyStatus: 'under'
    });
  });

  it('creates a sensitive local confirmation mutation when all rows are reviewed', () => {
    const reviewed: MobileReceiptReview = {
      ...review,
      matchedItems: review.matchedItems.map((item) => ({ ...item, productId: item.productId ?? 'manual-match', canonicalName: item.canonicalName ?? 'Manual match', matchConfidence: 0.95 }))
    };
    const plan = buildMobileReceiptReviewPlan({
      userId: ' shopper-1 ',
      receiptId: ' receipt-1 ',
      review: reviewed,
      now: '2026-05-20T09:00:00.000Z',
      networkOnline: false,
      cameraPermissionReady: true
    });

    assert.equal(plan.status, 'ready_to_confirm');
    assert.deepEqual(plan.blockers, ['network_required_for_immediate_sync']);
    assert.deepEqual(plan.actions, ['confirm_receipt_items', 'queue_for_sync', 'sync_when_online']);
    assert.equal(plan.confirmationMutation?.id, 'receipt-confirm:receipt-1');
    assert.equal(plan.confirmationMutation?.type, 'receipt_confirm_items');
    assert.deepEqual(plan.confirmationMutation?.payload, { receiptId: 'receipt-1', itemCount: 3, budgetImpact: 642 });
    assert.deepEqual(plan.confirmationMutation?.invalidates, ['today', 'basket', 'budget']);
    assert.equal(plan.confirmationMutation?.sensitiveLocalOnly, true);
  });

  it('selects renderable receipt review rows with confidence and budget tones', () => {
    assert.deepEqual(selectMobileReceiptReviewRows(review), [
      { rawName: 'ZOEGA SKANEROST', label: 'Zoégas Coffee 450g', itemTotal: 49.9, matchConfidence: 0.9, reviewRequired: false, tone: 'positive' },
      { rawName: 'CHEESE 500G', label: 'Cheese 500g', itemTotal: 78, matchConfidence: 0.7, reviewRequired: true, tone: 'warning' },
      { rawName: 'SMUDGED ITEM', label: 'Unmatched item', itemTotal: 18, matchConfidence: 0, reviewRequired: true, tone: 'neutral' }
    ]);
  });

  it('fails closed when identifiers or clocks are unsafe', () => {
    assert.throws(
      () => buildMobileReceiptReviewPlan({ userId: ' ', receiptId: 'receipt-1', review, now: '2026-05-20T09:00:00.000Z', networkOnline: true, cameraPermissionReady: true }),
      /userId is required/
    );
    assert.throws(
      () => buildMobileReceiptReviewPlan({ userId: 'shopper-1', receiptId: ' ', review, now: '2026-05-20T09:00:00.000Z', networkOnline: true, cameraPermissionReady: true }),
      /receiptId is required/
    );
    assert.throws(
      () => buildMobileReceiptReviewPlan({ userId: 'shopper-1', receiptId: 'receipt-1', review, now: 'not-a-date', networkOnline: true, cameraPermissionReady: true }),
      /now must be an ISO date/
    );
  });
});
