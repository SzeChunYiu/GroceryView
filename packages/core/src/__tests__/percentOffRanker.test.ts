import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rankPercentOffPromotions } from '../lib/rankers/percentOff.js';

describe('rankPercentOffPromotions', () => {
  it('sorts active promotions by percentage discount descending', () => {
    const ranked = rankPercentOffPromotions([
      { offerId: 'coffee', productId: 'coffee', listPrice: 80, effectiveUnitPrice: 60, eligibleQuantity: 1 },
      { offerId: 'butter', productId: 'butter', listPrice: 50, effectiveUnitPrice: 30, eligibleQuantity: 2 },
      { offerId: 'milk', productId: 'milk', listPrice: 20, effectiveUnitPrice: 15, eligibleQuantity: 3 }
    ]);

    assert.deepEqual(ranked.map((row) => [row.offerId, row.percentOff, row.savingsPerUnit, row.savingsForEligibleQuantity, row.rank]), [
      ['butter', 40, 20, 40, 1],
      ['coffee', 25, 20, 20, 2],
      ['milk', 25, 5, 15, 3]
    ]);
    assert.match(ranked[0]?.explanation ?? '', /40% off versus list price/i);
  });

  it('filters inactive, expired, future, invalid, and non-discount rows', () => {
    const ranked = rankPercentOffPromotions([
      { offerId: 'active', productId: 'active', listPrice: 100, effectivePrice: 75, validFrom: '2026-05-20T00:00:00.000Z', validThrough: '2026-05-30T00:00:00.000Z' },
      { offerId: 'inactive', productId: 'inactive', listPrice: 100, effectivePrice: 50, active: false },
      { offerId: 'expired', productId: 'expired', listPrice: 100, effectivePrice: 50, validThrough: '2026-05-01T00:00:00.000Z' },
      { offerId: 'future', productId: 'future', listPrice: 100, effectivePrice: 50, validFrom: '2026-06-01T00:00:00.000Z' },
      { offerId: 'zero-list', productId: 'zero-list', listPrice: 0, effectivePrice: 0 },
      { offerId: 'not-a-deal', productId: 'not-a-deal', listPrice: 10, effectivePrice: 10 }
    ], { now: '2026-05-24T00:00:00.000Z' });

    assert.deepEqual(ranked.map((row) => row.offerId), ['active']);
  });

  it('honors limit after ranking', () => {
    const ranked = rankPercentOffPromotions([
      { productId: 'a', listPrice: 100, effectivePrice: 80 },
      { productId: 'b', listPrice: 100, effectivePrice: 50 },
      { productId: 'c', listPrice: 100, effectivePrice: 70 }
    ], { limit: 2 });

    assert.deepEqual(ranked.map((row) => row.productId), ['b', 'c']);
  });
});
