import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareBasketStrategies } from '../index.js';
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
