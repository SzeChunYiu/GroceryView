import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reviewReceiptScan } from '../index.js';

describe('reviewReceiptScan', () => {
  it('matches receipt rows, summarizes budget impact, and flags overspend', () => {
    const review = reviewReceiptScan({
      receipt: {
        storeId: 'willys-odenplan',
        purchasedAt: '2026-05-19T16:00:00.000Z',
        totalAmount: 642,
        ocrConfidence: 0.82,
        rows: [
          { rawName: 'ZOEGA SKANEROST', quantity: 1, itemTotal: 49.9 },
          { rawName: 'CHEESE 500G', quantity: 1, itemTotal: 78 }
        ]
      },
      aliases: [
        { rawName: 'ZOEGA SKANEROST', productId: 'coffee', canonicalName: 'Zoégas Coffee 450g', matchConfidence: 0.9 },
        { rawName: 'CHEESE 500G', productId: 'cheese', canonicalName: 'Cheese 500g', matchConfidence: 0.7 }
      ],
      localMedians: { coffee: 64.9, cheese: 60 },
      weeklyBudget: 800,
      weekSpendBeforeReceipt: 120
    });

    assert.equal(review.budget.afterReceiptSpend, 762);
    assert.equal(review.budget.remaining, 38);
    assert.equal(review.comparedWithLocalMedianDelta, 3);
    assert.deepEqual(review.goodBuys.map((item) => item.productId), ['coffee']);
    assert.deepEqual(review.overspend.map((item) => ({ productId: item.productId, delta: item.deltaVsMedian })), [{ productId: 'cheese', delta: 18 }]);
    assert.equal(review.confidenceLabel, 'medium-high');
  });
});
