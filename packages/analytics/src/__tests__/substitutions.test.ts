import assert from 'node:assert/strict';
import test from 'node:test';
import { buildItemSubstitutionSuggestions } from '../substitutions.js';

test('suggests up to three same-category lower-price items when the source is very expensive', () => {
  const report = buildItemSubstitutionSuggestions({
    source: {
      productId: 'premium-milk',
      productName: 'Premium Milk',
      category: 'dairy',
      currentPrice: 39,
      usualPrice: 30,
      inStock: true
    },
    candidates: [
      { productId: 'budget-milk', productName: 'Budget Milk', category: 'dairy', currentPrice: 22, inStock: true },
      { productId: 'store-milk', productName: 'Store Milk', category: 'dairy', currentPrice: 25, inStock: true },
      { productId: 'organic-milk', productName: 'Organic Milk', category: 'dairy', currentPrice: 28, inStock: true },
      { productId: 'fourth-milk', productName: 'Fourth Milk', category: 'dairy', currentPrice: 29, inStock: true },
      { productId: 'expensive-milk', productName: 'Expensive Milk', category: 'dairy', currentPrice: 40, inStock: true },
      { productId: 'unavailable-milk', productName: 'Unavailable Milk', category: 'dairy', currentPrice: 21, inStock: false },
      { productId: 'cheap-bread', productName: 'Cheap Bread', category: 'bakery', currentPrice: 12, inStock: true }
    ],
    expensiveThresholdPercent: 20
  });

  assert.equal(report.available, true);
  assert.equal(report.trigger, 'very_expensive');
  assert.deepEqual(report.suggestions.map((row) => row.productId), ['budget-milk', 'store-milk', 'organic-milk']);
  assert.equal(report.suggestions.length, 3);
  assert.ok(report.suggestions.every((row) => row.category === 'dairy'));
  assert.ok(report.suggestions.every((row) => row.currentPrice < 39));
  assert.match(report.guardrail, /same-category, in-stock candidates with a verified lower current price/i);
});

test('uses the usual price baseline for out-of-stock source items', () => {
  const report = buildItemSubstitutionSuggestions({
    source: {
      productId: 'missing-yogurt',
      productName: 'Missing Yogurt',
      category: 'dairy',
      currentPrice: null,
      usualPrice: 32,
      inStock: false
    },
    candidates: [
      { productId: 'plain-yogurt', productName: 'Plain Yogurt', category: 'dairy', currentPrice: 21, inStock: true },
      { productId: 'greek-yogurt', productName: 'Greek Yogurt', category: 'dairy', currentPrice: 29, inStock: true }
    ]
  });

  assert.equal(report.available, true);
  assert.equal(report.trigger, 'out_of_stock');
  assert.deepEqual(report.suggestions.map((row) => row.productId), ['plain-yogurt', 'greek-yogurt']);
  assert.ok(report.detail.includes('out of stock'));
});

test('fails closed when the source item is neither out of stock nor very expensive', () => {
  const report = buildItemSubstitutionSuggestions({
    source: {
      productId: 'normal-oats',
      productName: 'Normal Oats',
      category: 'pantry',
      currentPrice: 24,
      usualPrice: 23,
      inStock: true
    },
    candidates: [
      { productId: 'other-oats', productName: 'Other Oats', category: 'pantry', currentPrice: 21, inStock: true }
    ],
    expensiveThresholdPercent: 20
  });

  assert.equal(report.available, false);
  assert.equal(report.trigger, 'not_needed');
  assert.deepEqual(report.suggestions, []);
});
