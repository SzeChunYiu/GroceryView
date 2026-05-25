import { describe, expect, it } from 'vitest';
import { calculateFixedBasketIndex } from '../../index.js';

describe('calculateFixedBasketIndex', () => {
  it('calculates a fixed basket index for a real grocery basket', () => {
    const index = calculateFixedBasketIndex({
      id: 'weekly-staples-stockholm',
      label: 'Weekly Staples Stockholm',
      country: 'SE',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'arla-mellanmjolk-1l', country: 'SE', currency: 'SEK', baseUnitPrice: 15.9, currentUnitPrice: 16.9, weight: 2 },
        { productId: 'kungsornen-spaghetti-1kg', country: 'SE', currency: 'SEK', baseUnitPrice: 24.9, currentUnitPrice: 23.9, weight: 1 },
        { productId: 'ica-aggs-15-pack', country: 'SE', currency: 'SEK', baseUnitPrice: 42.9, currentUnitPrice: 45.9, weight: 1 },
        { productId: 'zoegas-skane-kaffe-450g', country: 'SE', currency: 'SEK', baseUnitPrice: 69.9, currentUnitPrice: 64.9, weight: 1 },
        { productId: 'polarbrod-ragkaka-900g', country: 'SE', currency: 'SEK', baseUnitPrice: 32.9, currentUnitPrice: 34.9, weight: 1 }
      ]
    });

    expect(index).toMatchObject({
      id: 'weekly-staples-stockholm',
      label: 'Weekly Staples Stockholm',
      country: 'SE',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      value: 100.49,
      movementPercent: 0.49,
      confidence: 'high'
    });
  });

  it('returns a low-confidence null index for an empty component list', () => {
    const index = calculateFixedBasketIndex({
      id: 'empty-weekly-staples',
      label: 'Empty Weekly Staples',
      country: 'SE',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: []
    });

    expect(index).toMatchObject({
      id: 'empty-weekly-staples',
      label: 'Empty Weekly Staples',
      country: 'SE',
      currency: 'SEK',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      value: null,
      movementPercent: null,
      confidence: 'low',
      components: []
    });
  });

  it('rejects a malformed basket component without a positive base price', () => {
    expect(() => calculateFixedBasketIndex({
      id: 'malformed-weekly-staples',
      label: 'Malformed Weekly Staples',
      country: 'SE',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'missing-base-price-milk-1l', country: 'SE', currency: 'SEK', baseUnitPrice: 0, currentUnitPrice: 16.9, weight: 1 }
      ]
    })).toThrow('Base basket value must be positive.');
  });

  it('uses only observations from the requested country', () => {
    const index = calculateFixedBasketIndex({
      id: 'nordic-staples',
      label: 'Nordic Staples',
      country: 'NO',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'se-milk', country: 'SE', currency: 'SEK', baseUnitPrice: 10, currentUnitPrice: 20, weight: 1 },
        { productId: 'no-milk', country: 'NO', currency: 'NOK', baseUnitPrice: 20, currentUnitPrice: 22, weight: 1 }
      ]
    });

    expect(index.country).toBe('NO');
    expect(index.currency).toBe('NOK');
    expect(index.value).toBe(110);
    expect(index.components.map((component) => component.productId)).toEqual(['no-milk']);
  });

  it('rejects currency mismatches inside the requested country', () => {
    expect(() => calculateFixedBasketIndex({
      id: 'mixed-currency-stockholm',
      label: 'Mixed Currency Stockholm',
      country: 'SE',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'se-milk', country: 'SE', currency: 'NOK', baseUnitPrice: 10, currentUnitPrice: 11, weight: 1 }
      ]
    })).toThrow('Fixed basket index cannot mix currencies: SE observations must use SEK.');
  });

});
