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
      currency: 'SEK',
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
      country: 'SE',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: []
    })).toThrow('At least one component is required to calculate an index.');
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

  it('scopes components to the requested country and rejects mixed currencies inside that country', () => {
    const index = calculateFixedBasketIndex({
      id: 'nordic-coffee-index',
      label: 'Nordic Coffee Index',
      country: 'NO',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'coffee-se', country: 'SE', currency: 'SEK', baseUnitPrice: 100, currentUnitPrice: 150, weight: 1 },
        { productId: 'coffee-no', country: 'NO', currency: 'NOK', baseUnitPrice: 100, currentUnitPrice: 110, weight: 1 },
        { productId: 'milk-no', country: 'NO', currency: 'NOK', baseUnitPrice: 50, currentUnitPrice: 45, weight: 1 }
      ]
    });

    expect(index.country).toBe('NO');
    expect(index.currency).toBe('NOK');
    expect(index.value).toBe(103.33);
    expect(index.components.map((component) => component.productId)).toEqual(['coffee-no', 'milk-no']);

    expect(() => calculateFixedBasketIndex({
      id: 'invalid-norway-index',
      label: 'Invalid Norway Index',
      country: 'NO',
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      components: [
        { productId: 'coffee-no', country: 'NO', currency: 'SEK', baseUnitPrice: 100, currentUnitPrice: 110, weight: 1 }
      ]
    })).toThrow('Fixed basket index cannot mix currencies; NO components must use NOK.');
  });
});
