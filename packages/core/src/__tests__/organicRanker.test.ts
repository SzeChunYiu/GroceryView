import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankOrganicEcoListings } from '../index.js';

describe('rankOrganicEcoListings', () => {
  it('filters to organic, KRAV, or eco tagged listings and ranks by savings', () => {
    const ranked = rankOrganicEcoListings({
      listings: [
        {
          promoId: 'plain-coffee',
          productId: 'coffee',
          productName: 'Plain coffee',
          savings: 40,
          tags: ['weekly-flyer']
        },
        {
          promoId: 'krav-eggs',
          productId: 'eggs',
          productName: 'KRAV eggs',
          savings: 12,
          tags: ['KRAV']
        },
        {
          promoId: 'eco-milk',
          productId: 'milk',
          productName: 'Eco milk',
          savings: 18,
          tags: ['eco']
        },
        {
          promoId: 'organic-oats',
          productId: 'oats',
          productName: 'Organic oats',
          savings: 15,
          tags: ['organic']
        }
      ]
    });

    assert.deepEqual(
      ranked.map((listing) => ({ rank: listing.rank, promoId: listing.promoId, savings: listing.savings })),
      [
        { rank: 1, promoId: 'eco-milk', savings: 18 },
        { rank: 2, promoId: 'organic-oats', savings: 15 },
        { rank: 3, promoId: 'krav-eggs', savings: 12 }
      ]
    );
  });

  it('accepts retailer label and certification evidence without matching product names', () => {
    const ranked = rankOrganicEcoListings({
      listings: [
        {
          promoId: 'name-only',
          productId: 'name-only',
          productName: 'Organic name but untagged',
          savings: 30,
          tags: ['weekly-flyer']
        },
        {
          promoId: 'eu-label',
          productId: 'eu-label',
          productName: 'Labeled yogurt',
          savings: 9,
          labels: ['EU ecological']
        },
        {
          promoId: 'certified',
          productId: 'certified',
          productName: 'Certified carrots',
          savings: 11,
          certifications: ['KRAV-markt']
        },
        {
          promoId: 'economy-pack',
          productId: 'economy-pack',
          productName: 'Economy pack',
          savings: 50,
          labels: ['economy']
        }
      ]
    });

    assert.deepEqual(ranked.map((listing) => listing.promoId), ['certified', 'eu-label']);
  });

  it('applies topN after organic filtering and uses stable tie breakers', () => {
    const ranked = rankOrganicEcoListings({
      topN: 2,
      listings: [
        {
          promoId: 'b',
          productId: 'b',
          productName: 'Bananas',
          savings: 10,
          tags: ['eco']
        },
        {
          promoId: 'a',
          productId: 'a',
          productName: 'Apples',
          savings: 10,
          tags: ['organic']
        },
        {
          promoId: 'c',
          productId: 'c',
          productName: 'Carrots',
          savings: 8,
          tags: ['krav']
        }
      ]
    });

    assert.deepEqual(ranked.map((listing) => listing.promoId), ['a', 'b']);
  });

  it('rejects invalid listing and topN inputs', () => {
    assert.throws(
      () =>
        rankOrganicEcoListings({
          topN: 0,
          listings: []
        }),
      /topN must be a positive integer/
    );

    assert.throws(
      () =>
        rankOrganicEcoListings({
          listings: [
            {
              promoId: '',
              productId: 'milk',
              productName: 'Eco milk',
              savings: 10,
              tags: ['eco']
            }
          ]
        }),
      /promoId is required/
    );

    assert.throws(
      () =>
        rankOrganicEcoListings({
          listings: [
            {
              promoId: 'eco-milk',
              productId: 'milk',
              productName: 'Eco milk',
              savings: Number.NaN,
              tags: ['eco']
            }
          ]
        }),
      /savings must be a finite number/
    );
  });
});
