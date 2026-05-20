import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareBasketStrategies, summarizeStoreBasketCoverage } from '../index.js';

describe('compareBasketStrategies', () => {
  it('compares favorite-store baskets without penalizing distance', () => {
    const result = compareBasketStrategies({
      favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen'],
      items: [
        {
          productId: 'coffee',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9, distanceKm: 5.2 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 59.9, distanceKm: 0.4 }
          ]
        },
        {
          productId: 'milk',
          quantity: 2,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9, distanceKm: 5.2 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9, distanceKm: 0.4 }
          ]
        }
      ]
    });

    assert.equal(result.cheapestByProduct.total, 77.7);
    assert.deepEqual(result.cheapestByProduct.assignments.map((item) => item.storeId), [
      'willys-odenplan',
      'lidl-sveavagen'
    ]);
    assert.deepEqual(result.singleStoreOptions[0], {
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      total: 79.7,
      itemCount: 2
    });
  });
});

describe('summarizeStoreBasketCoverage', () => {
  it('compares favorite stores by basket coverage and known total', () => {
    const summary = summarizeStoreBasketCoverage({
      favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen', 'coop-odenplan'],
      items: [
        {
          productId: 'coffee',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 59.9 }
          ]
        },
        {
          productId: 'milk',
          quantity: 2,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9 },
            { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', price: 15.9 }
          ]
        },
        {
          productId: 'butter',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 42.9 },
            { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', price: 39.9 }
          ]
        }
      ]
    });

    assert.deepEqual(summary.fullCoverageStoreIds, ['willys-odenplan']);
    assert.deepEqual(summary.stores.map((store) => store.storeId), [
      'willys-odenplan',
      'coop-odenplan',
      'lidl-sveavagen'
    ]);
    assert.deepEqual(summary.bestCoverage, {
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      knownTotal: 122.6,
      availableProductIds: ['coffee', 'milk', 'butter'],
      missingProductIds: [],
      coveragePercent: 100
    });
    assert.deepEqual(summary.stores[1], {
      storeId: 'coop-odenplan',
      storeName: 'Coop Odenplan',
      knownTotal: 71.7,
      availableProductIds: ['milk', 'butter'],
      missingProductIds: ['coffee'],
      coveragePercent: 66.67
    });
  });

  it('handles an empty basket as full coverage for favorite stores', () => {
    assert.deepEqual(summarizeStoreBasketCoverage({
      favoriteStoreIds: ['willys-odenplan'],
      items: []
    }), {
      stores: [{
        storeId: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        knownTotal: 0,
        availableProductIds: [],
        missingProductIds: [],
        coveragePercent: 100
      }],
      bestCoverage: {
        storeId: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        knownTotal: 0,
        availableProductIds: [],
        missingProductIds: [],
        coveragePercent: 100
      },
      fullCoverageStoreIds: ['willys-odenplan']
    });
  });
});
