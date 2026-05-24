import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { buildPremiumBrandCanonicalIdSet, rankPremiumBrandSavings } from '../lib/rankers/premium.js';

describe('rankPremiumBrandSavings', () => {
  it('filters to premium brand canonical ids and ranks by savings', () => {
    const ranked = rankPremiumBrandSavings({
      brands: [
        { canonical_id: 'marabou', premium: true },
        { canonical_id: 'budget-brand', premium: false },
        { canonical_id: 'lambi', is_premium: true }
      ],
      candidates: [
        { productId: 'budget-paper', productName: 'Budget paper', brand_canonical_id: 'budget-brand', currentPrice: 9, regularPrice: 20 },
        { productId: 'premium-chocolate', productName: 'Premium chocolate', brandCanonicalId: 'marabou', currentPrice: 30, regularPrice: 38 },
        { productId: 'premium-paper', productName: 'Premium paper', brand: { canonical_id: 'lambi' }, currentPrice: 45, regularPrice: 65 }
      ]
    });

    assert.deepEqual(ranked.map((row) => ({ productId: row.productId, rank: row.rank, savings: row.savings })), [
      { productId: 'premium-paper', rank: 1, savings: 20 },
      { productId: 'premium-chocolate', rank: 2, savings: 8 }
    ]);
  });

  it('accepts an explicit premium canonical-id set', () => {
    const premiumIds = buildPremiumBrandCanonicalIdSet({ premiumBrandCanonicalIds: ['compass'] });
    const ranked = rankPremiumBrandSavings({
      premiumBrandCanonicalIds: premiumIds,
      candidates: [
        { productId: 'lax', brand_canonical_id: 'compass', savingsAmount: 4.75 },
        { productId: 'lager', brand_canonical_id: 'emd-brau', savingsAmount: 12 }
      ]
    });

    assert.deepEqual(ranked.map((row) => row.productId), ['lax']);
  });
});
