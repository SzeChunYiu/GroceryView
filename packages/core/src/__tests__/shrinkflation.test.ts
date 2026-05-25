import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectShrinkflation, parsePackageSizeText } from '../index.js';

describe('detectShrinkflation', () => {
  it('flags a canonical product when pack size decreases while price holds or rises', () => {
    const candidates = detectShrinkflation([
      { canonicalProductId: 'coffee-1', productName: 'Coffee', observedAt: '2026-04-01T00:00:00.000Z', packSize: 500, packUnit: 'g', price: 49.9, sourceLabel: 'April shelf', confidence: 0.9 },
      { canonicalProductId: 'coffee-1', productName: 'Coffee', observedAt: '2026-05-01T00:00:00.000Z', packSize: 450, packUnit: 'g', price: 49.9, sourceLabel: 'May shelf', confidence: 0.9 }
    ]);

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]?.packSizeDecreasePercent, 10);
    assert.equal(candidates[0]?.priceChangePercent, 0);
    assert.equal(candidates[0]?.unitPriceIncreasePercent, 11.1);
  });

  it('does not flag cheaper smaller packs or one-off observations', () => {
    assert.deepEqual(detectShrinkflation([
      { canonicalProductId: 'juice-1', productName: 'Juice', observedAt: '2026-04-01T00:00:00.000Z', packSize: 1, packUnit: 'l', price: 20, confidence: 0.9 },
      { canonicalProductId: 'juice-1', productName: 'Juice', observedAt: '2026-05-01T00:00:00.000Z', packSize: 900, packUnit: 'ml', price: 17, confidence: 0.9 },
      { canonicalProductId: 'rice-1', productName: 'Rice', observedAt: '2026-05-01T00:00:00.000Z', packSize: 1, packUnit: 'kg', price: 31, confidence: 0.9 }
    ]), []);
  });

  it('parses direct and multiplied package-size labels', () => {
    assert.deepEqual(parsePackageSizeText('GARANT, 500g'), { size: 500, unit: 'g', label: '500g' });
    assert.deepEqual(parsePackageSizeText('4 x 125 g'), { size: 500, unit: 'g', label: '500g' });
    assert.deepEqual(parsePackageSizeText('1,5 l'), { size: 1500, unit: 'ml', label: '1500ml' });
  });
});
