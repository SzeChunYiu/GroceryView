import { describe, expect, it } from 'vitest';
import { compareBasketStrategies } from '../../index.js';

describe('compareBasketStrategies lib coverage', () => {
  it('builds the cheapest split basket from favorite-store price fixtures', () => {
    const result = compareBasketStrategies({
      favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen'],
      items: [
        {
          productId: 'standardmjolk-1l',
          quantity: 2,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 15.5 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 14.9 }
          ]
        },
        {
          productId: 'bryggkaffe-500g',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 54.9 }
          ]
        }
      ]
    });

    expect(result.cheapestByProduct.total).toBe(79.7);
    expect(result.cheapestByProduct.assignments.map((assignment) => assignment.storeId)).toEqual([
      'lidl-sveavagen',
      'willys-odenplan'
    ]);
    expect(result.bestSingleStore?.storeId).toBe('willys-odenplan');
    expect(result.savingsVsBestSingleStore).toBe(1.2);
    expect(result.splitStoreCount).toBe(2);
  });

  it('returns empty totals for an empty basket input', () => {
    const result = compareBasketStrategies({
      favoriteStoreIds: ['willys-odenplan'],
      items: []
    });

    expect(result.cheapestByProduct).toEqual({ total: 0, assignments: [] });
    expect(result.singleStoreOptions).toEqual([]);
    expect(result.bestSingleStore).toBeUndefined();
    expect(result.savingsVsBestSingleStore).toBe(0);
    expect(result.splitStoreCount).toBe(0);
    expect(result.missingProductIds).toEqual([]);
  });

  it('marks malformed missing-price rows as missing instead of estimating totals', () => {
    const result = compareBasketStrategies({
      favoriteStoreIds: ['willys-odenplan'],
      items: [
        {
          productId: 'agg-12-pack',
          quantity: 1,
          prices: []
        },
        {
          productId: 'havregryn-1kg',
          quantity: 1,
          prices: [
            { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 18.9 }
          ]
        }
      ]
    });

    expect(result.cheapestByProduct).toEqual({ total: 0, assignments: [] });
    expect(result.singleStoreOptions).toEqual([]);
    expect(result.bestSingleStore).toBeUndefined();
    expect(result.missingProductIds).toEqual(['agg-12-pack', 'havregryn-1kg']);
  });
});
