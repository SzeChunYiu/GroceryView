import { describe, expect, it } from 'vitest';
import { summarizeStoreBasketCoverage, type BasketComparisonInput } from '../../index.js';

describe('summarizeStoreBasketCoverage', () => {
  it('summarizes basket coverage and totals for favorite stores', () => {
    const input: BasketComparisonInput = {
      favoriteStoreIds: ['willys-odenplan', 'coop-odenplan'],
      items: [
        {
          productId: 'arla-standardmjolk-1l',
          quantity: 2,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9 },
            { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', price: 15.9 }
          ]
        },
        {
          productId: 'zoegas-skane-450g',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 54.9 }
          ]
        }
      ]
    };

    expect(summarizeStoreBasketCoverage(input)).toEqual({
      stores: [
        {
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          knownTotal: 84.7,
          availableProductIds: ['arla-standardmjolk-1l', 'zoegas-skane-450g'],
          missingProductIds: [],
          coveragePercent: 100
        },
        {
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          knownTotal: 31.8,
          availableProductIds: ['arla-standardmjolk-1l'],
          missingProductIds: ['zoegas-skane-450g'],
          coveragePercent: 50
        }
      ],
      bestCoverage: {
        storeId: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        knownTotal: 84.7,
        availableProductIds: ['arla-standardmjolk-1l', 'zoegas-skane-450g'],
        missingProductIds: [],
        coveragePercent: 100
      },
      fullCoverageStoreIds: ['willys-odenplan']
    });
  });

  it('marks favorite stores as fully covered for an empty basket', () => {
    expect(summarizeStoreBasketCoverage({
      favoriteStoreIds: ['lidl-sveavagen'],
      items: []
    })).toEqual({
      stores: [
        {
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavagen',
          knownTotal: 0,
          availableProductIds: [],
          missingProductIds: [],
          coveragePercent: 100
        }
      ],
      bestCoverage: {
        storeId: 'lidl-sveavagen',
        storeName: 'Lidl Sveavagen',
        knownTotal: 0,
        availableProductIds: [],
        missingProductIds: [],
        coveragePercent: 100
      },
      fullCoverageStoreIds: ['lidl-sveavagen']
    });
  });

  it('records missing coverage for malformed price input without a store id', () => {
    const input = {
      favoriteStoreIds: ['hemkop-t-centralen'],
      items: [
        {
          productId: 'kungsornen-spaghetti-1kg',
          quantity: 1,
          prices: [
            { storeName: 'Hemköp T-Centralen', price: 21.9 }
          ]
        }
      ]
    } as unknown as BasketComparisonInput;

    expect(summarizeStoreBasketCoverage(input)).toEqual({
      stores: [
        {
          storeId: 'hemkop-t-centralen',
          storeName: 'Hemkop T Centralen',
          knownTotal: 0,
          availableProductIds: [],
          missingProductIds: ['kungsornen-spaghetti-1kg'],
          coveragePercent: 0
        }
      ],
      bestCoverage: {
        storeId: 'hemkop-t-centralen',
        storeName: 'Hemkop T Centralen',
        knownTotal: 0,
        availableProductIds: [],
        missingProductIds: ['kungsornen-spaghetti-1kg'],
        coveragePercent: 0
      },
      fullCoverageStoreIds: []
    });
  });
});
