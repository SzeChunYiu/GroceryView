import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isOrganicFlyerOffer,
  organicSignalsForFlyerOffer,
  rankOrganicFlyerOffers,
  savingsPercentForFlyerOffer
} from '../index.js';

describe('rankOrganicFlyerOffers', () => {
  it('filters flyer listings to organic/krav/eco tags and ranks by savings', () => {
    const ranked = rankOrganicFlyerOffers([
      {
        productId: 'organic-bananas',
        productName: 'Ekologiska bananer',
        currentPrice: 18.9,
        regularPrice: 29.9,
        sourceConfidence: 0.91,
        labels: ['EU ecological']
      },
      {
        productId: 'krav-eggs',
        productName: 'Ägg 10-pack',
        currentPrice: 34.9,
        regularPrice: 44.9,
        sourceConfidence: 0.95,
        certifications: ['KRAV']
      },
      {
        productId: 'standard-pasta',
        productName: 'Pasta 500g',
        currentPrice: 12.9,
        regularPrice: 22.9,
        sourceConfidence: 0.99,
        tags: ['pantry']
      },
      {
        productId: 'sponsored-eco-coffee',
        productName: 'Eco coffee sponsored',
        currentPrice: 39.9,
        regularPrice: 69.9,
        sourceConfidence: 0.99,
        tags: ['eco'],
        sponsoredPlacement: true
      }
    ]);

    assert.deepEqual(ranked.map((offer) => offer.productId), ['organic-bananas', 'krav-eggs']);
    assert.equal(ranked[0].computedSavingsPercent, 36.79);
    assert.deepEqual(ranked[0].organicSignals, ['EU ecological']);
    assert.equal(ranked[1].computedSavingsPercent, 22.27);
    assert.deepEqual(ranked[1].organicSignals, ['KRAV']);
  });

  it('honors explicit savings and confidence thresholds for organic flyer rows', () => {
    const ranked = rankOrganicFlyerOffers([
      {
        productId: 'organic-yoghurt',
        productName: 'Organic yoghurt',
        currentPrice: 24,
        savingsPercent: 15,
        sourceConfidence: 0.86,
        tags: ['organic']
      },
      {
        productId: 'eco-cereal',
        productName: 'Eco cereal',
        currentPrice: 33,
        savingsPercent: 8,
        sourceConfidence: 0.95,
        badges: ['eko']
      },
      {
        productId: 'low-confidence-krav',
        productName: 'KRAV carrots',
        currentPrice: 19,
        regularPrice: 24,
        sourceConfidence: 0.44,
        labels: ['krav']
      }
    ], { minimumSavingsPercent: 10, minimumSourceConfidence: 0.6 });

    assert.deepEqual(ranked.map((offer) => offer.productId), ['organic-yoghurt']);
    assert.equal(ranked[0].computedSavingsPercent, 15);
  });

  it('exposes reusable organic signal and savings helpers', () => {
    const offer = {
      productId: 'eko-milk',
      productName: 'Eko mjölk',
      currentPrice: 17.5,
      regularPrice: 20,
      tags: ['eko', 'dairy']
    };

    assert.equal(isOrganicFlyerOffer(offer), true);
    assert.deepEqual(organicSignalsForFlyerOffer(offer), ['eko']);
    assert.equal(savingsPercentForFlyerOffer(offer), 12.5);
  });
});
