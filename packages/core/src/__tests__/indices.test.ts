import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBrandTierIndices, calculateFixedBasketIndex } from '../index.js';

describe('calculateFixedBasketIndex', () => {
  it('normalizes a fixed grocery basket against a base date', () => {
    const index = calculateFixedBasketIndex({
      id: 'stockholm-coffee-index',
      label: 'Stockholm Coffee Index',
      country: 'SE',
      baseDate: '2026-01-01',
      currentDate: '2026-05-19',
      components: [
        { productId: 'coffee-a', country: 'SE', currency: 'SEK', baseUnitPrice: 100, currentUnitPrice: 90, weight: 1 },
        { productId: 'coffee-b', country: 'SE', currency: 'SEK', baseUnitPrice: 80, currentUnitPrice: 88, weight: 1 }
      ]
    });

    assert.equal(index.value, 98.89);
    assert.equal(index.movementPercent, -1.11);
    assert.equal(index.confidence, 'medium');
  });

  it('separates brand-tier indices and summarizes private-label savings', () => {
    const summary = calculateBrandTierIndices([
      { brandTier: 'national', category: 'Coffee', baseUnitPrice: 100, currentUnitPrice: 110 },
      { brandTier: 'national', category: 'Pasta', baseUnitPrice: 100, currentUnitPrice: 105 },
      { brandTier: 'national', category: 'Cleaning', baseUnitPrice: 100, currentUnitPrice: 120 },
      { brandTier: 'premium', category: 'Coffee', baseUnitPrice: 100, currentUnitPrice: 135 },
      { brandTier: 'premium', category: 'Pasta', baseUnitPrice: 100, currentUnitPrice: 130 },
      { brandTier: 'premium', category: 'Cleaning', baseUnitPrice: 100, currentUnitPrice: 140 },
      { brandTier: 'budget_private_label', category: 'Coffee', baseUnitPrice: 100, currentUnitPrice: 78 },
      { brandTier: 'budget_private_label', category: 'Pasta', baseUnitPrice: 100, currentUnitPrice: 80 },
      { brandTier: 'budget_private_label', category: 'Cleaning', baseUnitPrice: 100, currentUnitPrice: 82 },
      { brandTier: 'standard_private_label', category: 'Coffee', baseUnitPrice: 100, currentUnitPrice: 90 },
      { brandTier: 'standard_private_label', category: 'Pasta', baseUnitPrice: 100, currentUnitPrice: 88 },
      { brandTier: 'standard_private_label', category: 'Cleaning', baseUnitPrice: 100, currentUnitPrice: 92 }
    ]);

    assert.deepEqual(summary.indices.map((index) => index.label), [
      'Budget Private Label Index',
      'Standard Private Label Index',
      'National Brand Index',
      'Premium Brand Index'
    ]);
    assert.equal(summary.indices[0].value, 80);
    assert.equal(summary.indices[0].categoryCount, 3);
    assert.equal(summary.privateLabelSavingsPercent, 23.71);
    assert.deepEqual(summary.highestSavingsCategories, ['Cleaning', 'Coffee', 'Pasta']);
    assert.equal(summary.premiumGapPercent, 58.82);
  });
});
