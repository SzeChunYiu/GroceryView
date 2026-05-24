import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { rankDealOpportunities } from '../../../index.js';

describe('rankDealOpportunities ranker', () => {
  it('filters sponsored, low-score, and low-confidence deals before ranking by score and discount', () => {
    const ranked = rankDealOpportunities({
      minimumDealScore: 60,
      minimumSourceConfidence: 0.7,
      deals: [
        { productId: 'sponsored', productName: 'Sponsored coffee', storeId: 's1', storeName: 'Willys', currentPrice: 10, regularPrice: 30, dealScore: 99, sourceConfidence: 0.95, sponsoredPlacement: true },
        { productId: 'low-score', productName: 'Weak deal', storeId: 's1', storeName: 'Willys', currentPrice: 18, regularPrice: 20, dealScore: 55, sourceConfidence: 0.95 },
        { productId: 'low-confidence', productName: 'Unverified', storeId: 's2', storeName: 'Coop', currentPrice: 12, regularPrice: 30, dealScore: 90, sourceConfidence: 0.4 },
        { productId: 'same-score-bigger-discount', productName: 'Pasta', storeId: 's2', storeName: 'Coop', currentPrice: 10, regularPrice: 20, dealScore: 80, sourceConfidence: 0.8 },
        { productId: 'highest-score', productName: 'Milk', storeId: 's1', storeName: 'Willys', currentPrice: 16, regularPrice: 20, dealScore: 85, sourceConfidence: 0.9 },
        { productId: 'same-score-smaller-discount', productName: 'Rice', storeId: 's3', storeName: 'ICA', currentPrice: 15, regularPrice: 20, dealScore: 80, sourceConfidence: 0.8 }
      ]
    });

    assert.deepEqual(ranked.map((deal) => deal.productId), [
      'highest-score',
      'same-score-bigger-discount',
      'same-score-smaller-discount'
    ]);
    assert.deepEqual(ranked.map((deal) => deal.discountPercent), [20, 50, 25]);
  });
});
