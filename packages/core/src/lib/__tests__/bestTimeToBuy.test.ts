import { describe, expect, it } from 'vitest';
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

    expect(prediction.status).toBe('likely_next_week');
    expect(prediction.headline).toBe('Likely on sale next week');
    expect(prediction.nextWindowStart).toBe('2026-05-22');
    expect(prediction.observedPromotionCount).toBe(3);
    expect(prediction.confidence).toBe('high');
  });

  it('withholds prediction when history is too sparse', () => {
    const prediction = predictBestTimeToBuy({
      observations: [
        { observedAt: '2026-05-01', price: 20 },
        { observedAt: '2026-05-08', price: 18 }
      ]
    });

    expect(prediction.status).toBe('insufficient_history');
    expect(prediction.detail).toMatch(/At least four dated prices/);
  });
});
