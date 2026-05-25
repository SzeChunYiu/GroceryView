import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { predictBestTimeToBuy } from '../bestTimeToBuy.js';

describe('predictBestTimeToBuy', () => {
  it('predicts a next-week discount window from repeated promotion cadence', () => {
    const prediction = predictBestTimeToBuy({
      asOf: '2026-05-16',
      productName: 'Coffee',
      observations: [
        { observedAt: '2026-04-01', price: 49 },
        { observedAt: '2026-04-10', price: 39, priceType: 'promotion' },
        { observedAt: '2026-04-18', price: 49 },
        { observedAt: '2026-04-24', price: 39, priceType: 'promotion' },
        { observedAt: '2026-05-03', price: 49 },
        { observedAt: '2026-05-08', price: 39, priceType: 'promotion' },
        { observedAt: '2026-05-15', price: 49 }
      ]
    });

    assert.equal(prediction.status, 'likely_next_week');
    assert.equal(prediction.headline, 'Likely on sale next week');
    assert.equal(prediction.nextWindowStart, '2026-05-22');
    assert.equal(prediction.observedPromotionCount, 3);
    assert.equal(prediction.confidence, 'high');
  });

  it('withholds prediction when history is too sparse', () => {
    const prediction = predictBestTimeToBuy({
      observations: [
        { observedAt: '2026-05-01', price: 20 },
        { observedAt: '2026-05-08', price: 18 }
      ]
    });

    assert.equal(prediction.status, 'insufficient_history');
    assert.match(prediction.detail, /At least four dated prices/);
  });
});
