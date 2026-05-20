import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { summarizePriceHistory } from '../index.js';

describe('summarizePriceHistory', () => {
  it('summarizes latest price movement and new-low status from unordered observations', () => {
    const summary = summarizePriceHistory([
      { observedAt: '2026-05-18T08:00:00.000Z', price: 52.9, storeId: 'willys-odenplan' },
      { observedAt: '2026-05-16T08:00:00.000Z', price: 59.9, storeId: 'willys-odenplan' },
      { observedAt: '2026-05-19T08:00:00.000Z', price: 49.9, storeId: 'willys-odenplan' }
    ]);

    assert.deepEqual(summary, {
      latestPrice: 49.9,
      previousPrice: 52.9,
      changeFromPrevious: -3,
      lowestPrice: 49.9,
      highestPrice: 59.9,
      isNewLow: true,
      observedCount: 3,
      latestObservedAt: '2026-05-19T08:00:00.000Z'
    });
  });

  it('requires at least one observation', () => {
    assert.throws(() => summarizePriceHistory([]), /At least one price history point is required/);
  });
});
