import { describe, expect, it } from 'vitest';
import { calculateFixedBasketIndex } from '../../index.js';

describe('calculateFixedBasketIndex', () => {
  it('calculates a fixed basket index for a real grocery basket', () => {
    const index = calculateFixedBasketIndex({
      id: 'weekly-staples-stockholm',
      label: 'Weekly Staples Stockholm',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'arla-mellanmjolk-1l', baseUnitPrice: 15.9, currentUnitPrice: 16.9, weight: 2 },
        { productId: 'kungsornen-spaghetti-1kg', baseUnitPrice: 24.9, currentUnitPrice: 23.9, weight: 1 },
        { productId: 'ica-aggs-15-pack', baseUnitPrice: 42.9, currentUnitPrice: 45.9, weight: 1 },
        { productId: 'zoegas-skane-kaffe-450g', baseUnitPrice: 69.9, currentUnitPrice: 64.9, weight: 1 },
        { productId: 'polarbrod-ragkaka-900g', baseUnitPrice: 32.9, currentUnitPrice: 34.9, weight: 1 }
      ]
    });

    expect(index).toMatchObject({
      id: 'weekly-staples-stockholm',
      label: 'Weekly Staples Stockholm',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      value: 100.49,
      movementPercent: 0.49,
      confidence: 'high'
    });
  });

  it('rejects an empty component list', () => {
    expect(() => calculateFixedBasketIndex({
      id: 'empty-weekly-staples',
      label: 'Empty Weekly Staples',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: []
    })).toThrow('At least one component is required to calculate an index.');
  });

  it('rejects a malformed basket component without a positive base price', () => {
    expect(() => calculateFixedBasketIndex({
      id: 'malformed-weekly-staples',
      label: 'Malformed Weekly Staples',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'missing-base-price-milk-1l', baseUnitPrice: 0, currentUnitPrice: 16.9, weight: 1 }
      ]
    })).toThrow('Base basket value must be positive.');
  });
});
