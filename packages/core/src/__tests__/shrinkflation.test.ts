import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectShrinkflation, normalizePackageSize, type ShrinkflationObservation } from '../index.js';

const base: ShrinkflationObservation = {
  canonicalProductId: 'coffee-zoegas-450g',
  productName: 'Zoegas coffee',
  chainId: 'willys',
  sourceLabel: 'shelf',
  observedAt: '2026-04-01T00:00:00.000Z',
  price: 59.9,
  packageSize: 450,
  packageUnit: 'g',
  sourceConfidence: 0.95
};

describe('normalizePackageSize', () => {
  it('normalizes comparable package units', () => {
    assert.deepEqual(normalizePackageSize(0.45, 'kg'), { value: 450, unit: 'g', label: '450 g' });
    assert.deepEqual(normalizePackageSize(1.5, 'l'), { value: 1500, unit: 'ml', label: '1500 ml' });
  });
});

describe('detectShrinkflation', () => {
  it('detects a canonical product whose pack size falls while shelf price stays flat', () => {
    const signals = detectShrinkflation([
      base,
      { ...base, observedAt: '2026-05-01T00:00:00.000Z', packageSize: 400, price: 59.9 }
    ]);

    assert.equal(signals.length, 1);
    assert.equal(signals[0].canonicalProductId, 'coffee-zoegas-450g');
    assert.equal(signals[0].packageDecreasePercent, 11.11);
    assert.equal(signals[0].priceChangePercent, 0);
    assert.ok(signals[0].unitPriceChangePercent > 12);
    assert.deepEqual(signals[0].reasonCodes, ['package_size_down', 'price_same', 'unit_price_up']);
  });

  it('requires the price to stay flat or rise for the smaller pack', () => {
    const signals = detectShrinkflation([
      base,
      { ...base, observedAt: '2026-05-01T00:00:00.000Z', packageSize: 400, price: 49.9 }
    ]);

    assert.equal(signals.length, 0);
  });

  it('keeps chains separate for the same canonical product', () => {
    const signals = detectShrinkflation([
      base,
      { ...base, chainId: 'hemkop', observedAt: '2026-05-01T00:00:00.000Z', packageSize: 400, price: 65.9 }
    ]);

    assert.equal(signals.length, 0);
  });
});
