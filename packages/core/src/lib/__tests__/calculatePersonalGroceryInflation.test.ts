// @ts-ignore - Vitest is supplied by the test runner for this spec.
import { describe, expect, it } from 'vitest';
import { calculatePersonalGroceryInflation, type PersonalInflationInput } from '../../index.js';

const familyBasket: PersonalInflationInput = {
  baseDate: '2026-01-01',
  currentDate: '2026-05-24',
  missingProductIds: ['oat-milk-1l'],
  items: [
    {
      productId: 'milk-1l',
      productName: 'Milk 1L',
      category: 'Dairy',
      quantity: 2,
      baseUnitPrice: 10,
      currentUnitPrice: 12,
      confidence: 'high'
    },
    {
      productId: 'bread-loaf',
      productName: 'Whole Wheat Bread',
      category: 'Bakery',
      quantity: 1,
      baseUnitPrice: 20,
      currentUnitPrice: 18,
      confidence: 'medium'
    }
  ]
};

describe('calculatePersonalGroceryInflation', () => {
  it('summarizes a real household basket inflation fixture', () => {
    const summary = calculatePersonalGroceryInflation(familyBasket);

    expect(summary).toMatchObject({
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      inflationPercent: 5,
      changeAmount: 2,
      baseSpend: 40,
      currentSpend: 42,
      confidence: 'medium',
      missingProductIds: ['oat-milk-1l']
    });
    expect(summary.itemContributions).toEqual([
      {
        productId: 'milk-1l',
        productName: 'Milk 1L',
        category: 'Dairy',
        changePercent: 20,
        changeAmount: 4,
        weight: 0.5,
        confidence: 'high'
      },
      {
        productId: 'bread-loaf',
        productName: 'Whole Wheat Bread',
        category: 'Bakery',
        changePercent: -10,
        changeAmount: -2,
        weight: 0.5,
        confidence: 'medium'
      }
    ]);
    expect(summary.categoryContributions).toEqual([
      { category: 'Dairy', changePercent: 20, spend: 20 },
      { category: 'Bakery', changePercent: -10, spend: 20 }
    ]);
  });

  it('returns zeroed totals for an empty basket fixture', () => {
    const summary = calculatePersonalGroceryInflation({
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      items: []
    });

    expect(summary).toEqual({
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      inflationPercent: 0,
      changeAmount: 0,
      baseSpend: 0,
      currentSpend: 0,
      confidence: 'low',
      itemContributions: [],
      categoryContributions: [],
      missingProductIds: []
    });
  });

  it('surfaces malformed missing-price fixture values without dropping missing product ids', () => {
    const malformedInput = {
      baseDate: '2026-01-01',
      currentDate: '2026-05-24',
      missingProductIds: ['missing-current-price'],
      items: [
        {
          productId: 'missing-current-price',
          productName: 'Missing Current Price Coffee',
          category: 'Pantry',
          quantity: 1,
          baseUnitPrice: 49,
          confidence: 'low'
        }
      ]
    } as unknown as PersonalInflationInput;

    const summary = calculatePersonalGroceryInflation(malformedInput);

    expect(summary.baseSpend).toBe(49);
    expect(summary.currentSpend).toBeNaN();
    expect(summary.inflationPercent).toBeNaN();
    expect(summary.changeAmount).toBeNaN();
    expect(summary.itemContributions[0]).toMatchObject({
      productId: 'missing-current-price',
      productName: 'Missing Current Price Coffee',
      category: 'Pantry',
      confidence: 'low'
    });
    expect(summary.itemContributions[0].changePercent).toBeNaN();
    expect(summary.categoryContributions[0]).toMatchObject({ category: 'Pantry', spend: 49 });
    expect(summary.categoryContributions[0].changePercent).toBeNaN();
    expect(summary.missingProductIds).toEqual(['missing-current-price']);
  });
});
