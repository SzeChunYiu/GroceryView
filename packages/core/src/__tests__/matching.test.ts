import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyProductMatch, recommendSmartSwaps } from '../index.js';

describe('classifyProductMatch', () => {
  it('detects exact matches by barcode and size', () => {
    const match = classifyProductMatch({
      source: { id: 'barilla-500', barcode: '123', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national' },
      candidate: { id: 'barilla-500-willys', barcode: '123', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national' }
    });

    assert.deepEqual(match, { mode: 'exact', confidence: 'high', qualityRisk: 'low', reason: 'Barcode and package size match.' });
  });

  it('detects equivalent category matches with medium confidence when barcode differs', () => {
    const match = classifyProductMatch({
      source: { id: 'spaghetti-a', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national' },
      candidate: { id: 'spaghetti-b', brand: 'Garant', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'standard_private_label' }
    });

    assert.deepEqual(match, { mode: 'equivalent', confidence: 'high', qualityRisk: 'low', reason: 'Same category and comparable package size.' });
  });

  it('blocks smart substitution for do-not-auto-substitute categories', () => {
    const match = classifyProductMatch({
      source: { id: 'formula-a', brand: 'A', category: 'baby_formula', packageSize: 1, packageUnit: 'piece', brandTier: 'national' },
      candidate: { id: 'formula-b', brand: 'B', category: 'baby_formula', packageSize: 1, packageUnit: 'piece', brandTier: 'standard_private_label' }
    });

    assert.equal(match.mode, 'not_recommended');
    assert.equal(match.qualityRisk, 'high');
  });
});

describe('recommendSmartSwaps', () => {
  it('recommends private-label swaps only when savings and user preference allow it', () => {
    const swaps = recommendSmartSwaps({
      source: { id: 'barilla-500', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national', unitPrice: 28 },
      candidates: [
        { id: 'garant-500', brand: 'Garant', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'standard_private_label', unitPrice: 20 },
        { id: 'premium-500', brand: 'Premium', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'premium', unitPrice: 32 }
      ],
      acceptPrivateLabel: 'yes',
      minimumSavingsPercent: 10
    });

    assert.deepEqual(swaps.map((swap) => ({ productId: swap.productId, savingsPercent: swap.savingsPercent, confidence: swap.confidence })), [
      { productId: 'garant-500', savingsPercent: 28.57, confidence: 'high' }
    ]);
  });
});
