import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankPremiumBrandPromos } from '../index.js';

describe('rankPremiumBrandPromos', () => {
  it('filters to premium brand canonical ids and ranks by savings', () => {
    const ranked = rankPremiumBrandPromos({
      brands: [
        { canonical_id: 'zoegas', premium: true },
        { canonical_id: 'garant', premium: false },
        { canonical_id: 'barilla', premium: true }
      ],
      promos: [
        {
          promoId: 'p-garant',
          productId: 'garant-pasta',
          productName: 'Garant pasta',
          brand_canonical_id: 'garant',
          savings: 20
        },
        {
          promoId: 'p-zoegas',
          productId: 'zoegas-skane',
          productName: 'Zoegas Skane',
          brand_canonical_id: 'zoegas',
          savings: 15
        },
        {
          promoId: 'p-barilla',
          productId: 'barilla-spaghetti',
          productName: 'Barilla spaghetti',
          brand_canonical_id: 'barilla',
          savings: 25
        }
      ]
    });

    assert.deepEqual(
      ranked.map((promo) => ({ rank: promo.rank, promoId: promo.promoId, savings: promo.savings })),
      [
        { rank: 1, promoId: 'p-barilla', savings: 25 },
        { rank: 2, promoId: 'p-zoegas', savings: 15 }
      ]
    );
  });

  it('applies topN after premium filtering', () => {
    const ranked = rankPremiumBrandPromos({
      topN: 1,
      brands: [
        { canonical_id: 'zoegas', premium: true },
        { canonical_id: 'barilla', premium: true }
      ],
      promos: [
        {
          promoId: 'p-zoegas',
          productId: 'zoegas-skane',
          productName: 'Zoegas Skane',
          brand_canonical_id: 'zoegas',
          savings: 15
        },
        {
          promoId: 'p-barilla',
          productId: 'barilla-spaghetti',
          productName: 'Barilla spaghetti',
          brand_canonical_id: 'barilla',
          savings: 25
        }
      ]
    });

    assert.deepEqual(ranked.map((promo) => promo.promoId), ['p-barilla']);
  });

  it('rejects invalid brand, promo, and topN inputs', () => {
    assert.throws(
      () =>
        rankPremiumBrandPromos({
          topN: 0,
          brands: [],
          promos: []
        }),
      /topN must be a positive integer/
    );

    assert.throws(
      () =>
        rankPremiumBrandPromos({
          brands: [{ canonical_id: '', premium: true }],
          promos: []
        }),
      /brand\.canonical_id is required/
    );

    assert.throws(
      () =>
        rankPremiumBrandPromos({
          brands: [{ canonical_id: 'zoegas', premium: true }],
          promos: [
            {
              promoId: 'p-zoegas',
              productId: 'zoegas-skane',
              productName: 'Zoegas Skane',
              brand_canonical_id: 'zoegas',
              savings: Number.NaN
            }
          ]
        }),
      /savings must be a finite number/
    );
  });
});
