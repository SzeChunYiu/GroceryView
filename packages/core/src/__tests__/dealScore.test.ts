import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDealScore, rankDealOpportunities, scoreBand } from '../index.js';

describe('calculateDealScore', () => {
  it('uses the MVP weighted formula and never accepts sponsored boosts', () => {
    const score = calculateDealScore({
      currentCityPercentile: 8,
      knownPromoHistoryPercentile: 12,
      equivalentUnitPricePercentile: 18,
      discountDepthPercent: 25,
      sourceConfidence: 0.9,
      sponsoredPlacement: true
    });

    assert.equal(score, 82);
    assert.deepEqual(scoreBand(score), { label: 'Good deal', verdict: 'Buy' });
  });

  it('classifies normal prices as not a real deal', () => {
    const score = calculateDealScore({
      currentCityPercentile: 82,
      knownPromoHistoryPercentile: 76,
      equivalentUnitPricePercentile: 68,
      discountDepthPercent: 3,
      sourceConfidence: 0.5
    });

    assert.equal(score, 22);
    assert.deepEqual(scoreBand(score), { label: 'Not a real deal', verdict: 'Wait' });
  });
});

describe('rankDealOpportunities', () => {
  it('ranks organic deal opportunities and excludes sponsored placements', () => {
    const opportunities = rankDealOpportunities({
      deals: [
        {
          productId: 'coffee',
          productName: 'Zoégas Coffee 450g',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          currentPrice: 49.9,
          regularPrice: 69.9,
          dealScore: 86,
          sourceConfidence: 0.91
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          currentPrice: 42.9,
          regularPrice: 59.9,
          dealScore: 86,
          sourceConfidence: 0.88
        },
        {
          productId: 'soda',
          productName: 'Sponsored Soda 1.5L',
          storeId: 'ica-city',
          storeName: 'ICA City',
          currentPrice: 14.9,
          regularPrice: 24.9,
          dealScore: 95,
          sourceConfidence: 0.99,
          sponsoredPlacement: true
        },
        {
          productId: 'rice',
          productName: 'Rice 1kg',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          currentPrice: 18.9,
          regularPrice: 19.9,
          dealScore: 58,
          sourceConfidence: 0.9
        }
      ]
    });

    assert.deepEqual(opportunities.map((deal) => deal.productId), ['coffee', 'butter']);
    assert.deepEqual(opportunities[0], {
      productId: 'coffee',
      productName: 'Zoégas Coffee 450g',
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      currentPrice: 49.9,
      regularPrice: 69.9,
      dealScore: 86,
      sourceConfidence: 0.91,
      band: { label: 'Good deal', verdict: 'Buy' },
      priceDrop: 20,
      discountPercent: 28.61,
      reason: 'Zoégas Coffee 450g is 28.61% below regular price at Willys Odenplan with Deal Score 86.'
    });
  });

  it('honors caller thresholds for score and source confidence', () => {
    const opportunities = rankDealOpportunities({
      minimumDealScore: 80,
      minimumSourceConfidence: 0.9,
      deals: [
        {
          productId: 'coffee',
          productName: 'Zoégas Coffee 450g',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          currentPrice: 49.9,
          regularPrice: 69.9,
          dealScore: 79,
          sourceConfidence: 0.95
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          currentPrice: 42.9,
          regularPrice: 59.9,
          dealScore: 84,
          sourceConfidence: 0.89
        },
        {
          productId: 'milk',
          productName: 'Milk 1L',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          currentPrice: 11.9,
          regularPrice: 16.9,
          dealScore: 81,
          sourceConfidence: 0.91
        }
      ]
    });

    assert.deepEqual(opportunities.map((deal) => deal.productId), ['milk']);
  });
});
