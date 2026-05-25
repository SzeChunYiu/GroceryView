import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankPercentOffPromos } from '../index.js';

describe('rankPercentOffPromos', () => {
  it('ranks promotions by percentage off list price descending', () => {
    const ranked = rankPercentOffPromos({
      promos: [
        {
          promoId: 'p-low',
          productId: 'milk',
          productName: 'Milk',
          listPrice: 20,
          effectiveUnitPrice: 15
        },
        {
          promoId: 'p-best',
          productId: 'coffee',
          productName: 'Coffee',
          listPrice: 80,
          effectiveUnitPrice: 40
        },
        {
          promoId: 'p-mid',
          productId: 'pasta',
          productName: 'Pasta',
          listPrice: 30,
          effectiveUnitPrice: 20
        }
      ]
    });

    assert.deepEqual(
      ranked.map((promo) => ({ rank: promo.rank, promoId: promo.promoId, percentOff: promo.percentOff })),
      [
        { rank: 1, promoId: 'p-best', percentOff: 50 },
        { rank: 2, promoId: 'p-mid', percentOff: 33.33 },
        { rank: 3, promoId: 'p-low', percentOff: 25 }
      ]
    );
  });

  it('filters non-discounts and applies topN after ranking', () => {
    const ranked = rankPercentOffPromos({
      topN: 1,
      promos: [
        {
          promoId: 'p-full-price',
          productId: 'eggs',
          productName: 'Eggs',
          listPrice: 40,
          effectiveUnitPrice: 40
        },
        {
          promoId: 'p-discount',
          productId: 'butter',
          productName: 'Butter',
          listPrice: 50,
          effectiveUnitPrice: 30
        },
        {
          promoId: 'p-markup',
          productId: 'juice',
          productName: 'Juice',
          listPrice: 25,
          effectiveUnitPrice: 30
        }
      ]
    });

    assert.deepEqual(ranked.map((promo) => promo.promoId), ['p-discount']);
  });

  it('uses stable tie-breakers after percent off', () => {
    const ranked = rankPercentOffPromos({
      promos: [
        {
          promoId: 'p-z',
          productId: 'z',
          productName: 'Zucchini',
          listPrice: 20,
          effectiveUnitPrice: 10
        },
        {
          promoId: 'p-a',
          productId: 'a',
          productName: 'Apple',
          listPrice: 10,
          effectiveUnitPrice: 5
        },
        {
          promoId: 'p-b',
          productId: 'b',
          productName: 'Banana',
          listPrice: 12,
          effectiveUnitPrice: 6
        }
      ]
    });

    assert.deepEqual(ranked.map((promo) => promo.promoId), ['p-a', 'p-b', 'p-z']);
  });

  it('sorts by the unrounded discount ratio before exposing rounded percent off', () => {
    const ranked = rankPercentOffPromos({
      promos: [
        {
          promoId: 'p-slightly-lower',
          productId: 'lower',
          productName: 'Lower',
          listPrice: 10000,
          effectiveUnitPrice: 6666
        },
        {
          promoId: 'p-slightly-higher',
          productId: 'higher',
          productName: 'Higher',
          listPrice: 10000,
          effectiveUnitPrice: 6665
        }
      ]
    });

    assert.deepEqual(
      ranked.map((promo) => ({ promoId: promo.promoId, percentOff: promo.percentOff })),
      [
        { promoId: 'p-slightly-higher', percentOff: 33.35 },
        { promoId: 'p-slightly-lower', percentOff: 33.34 }
      ]
    );
  });

  it('rejects invalid prices, identifiers, and topN', () => {
    assert.throws(
      () =>
        rankPercentOffPromos({
          topN: 0,
          promos: []
        }),
      /topN must be a positive integer/
    );

    assert.throws(
      () =>
        rankPercentOffPromos({
          promos: [
            {
              promoId: '',
              productId: 'milk',
              productName: 'Milk',
              listPrice: 20,
              effectiveUnitPrice: 10
            }
          ]
        }),
      /promoId is required/
    );

    assert.throws(
      () =>
        rankPercentOffPromos({
          promos: [
            {
              promoId: 'p-zero-list',
              productId: 'milk',
              productName: 'Milk',
              listPrice: 0,
              effectiveUnitPrice: 10
            }
          ]
        }),
      /listPrice must be a positive finite number/
    );

    assert.throws(
      () =>
        rankPercentOffPromos({
          promos: [
            {
              promoId: 'p-negative-effective',
              productId: 'milk',
              productName: 'Milk',
              listPrice: 20,
              effectiveUnitPrice: -1
            }
          ]
        }),
      /effectiveUnitPrice must be a non-negative finite number/
    );
  });
});
