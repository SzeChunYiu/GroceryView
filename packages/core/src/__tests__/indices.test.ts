import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBasketTypeIndices, calculateFixedBasketIndex } from '../index.js';

describe('calculateFixedBasketIndex', () => {
  it('normalizes a fixed grocery basket against a base date', () => {
    const index = calculateFixedBasketIndex({
      id: 'stockholm-coffee-index',
      label: 'Stockholm Coffee Index',
      baseDate: '2026-01-01',
      currentDate: '2026-05-19',
      components: [
        { productId: 'coffee-a', baseUnitPrice: 100, currentUnitPrice: 90, weight: 1 },
        { productId: 'coffee-b', baseUnitPrice: 80, currentUnitPrice: 88, weight: 1 }
      ]
    });

    assert.equal(index.value, 98.89);
    assert.equal(index.movementPercent, -1.11);
    assert.equal(index.confidence, 'medium');
  });

  it('calculates lifestyle basket indices with chain, area, and driver signals', () => {
    const indices = calculateBasketTypeIndices({
      baseDate: '2026-01-01',
      currentDate: '2026-05-20',
      baskets: [
        {
          type: 'student',
          label: 'Student Basket Index',
          oneWeekMovementPercent: -1.8,
          oneMonthMovementPercent: 2.4,
          chainTotals: [
            { chain: 'ICA', total: 412 },
            { chain: 'Lidl', total: 374 },
            { chain: 'Coop', total: 398 }
          ],
          areaTotals: [
            { area: 'Odenplan', total: 392 },
            { area: 'Kista', total: 368 }
          ],
          components: [
            { productId: 'coffee', category: 'Coffee', baseUnitPrice: 100, currentUnitPrice: 92.8, weight: 2 },
            { productId: 'pasta', category: 'Pasta', baseUnitPrice: 100, currentUnitPrice: 98, weight: 3 },
            { productId: 'eggs', category: 'Eggs', baseUnitPrice: 100, currentUnitPrice: 103, weight: 1 }
          ]
        },
        {
          type: 'family',
          label: 'Family Basket Index',
          oneWeekMovementPercent: 0.6,
          oneMonthMovementPercent: 3.1,
          chainTotals: [
            { chain: 'Willys', total: 1120 },
            { chain: 'Hemköp', total: 1214 }
          ],
          areaTotals: [
            { area: 'Solna', total: 1098 },
            { area: 'Södermalm', total: 1180 }
          ],
          components: [
            { productId: 'milk', category: 'Dairy', baseUnitPrice: 100, currentUnitPrice: 106, weight: 3 },
            { productId: 'diapers', category: 'Baby', baseUnitPrice: 100, currentUnitPrice: 104, weight: 2 }
          ]
        }
      ]
    });

    assert.equal(indices[0].label, 'Student Basket Index');
    assert.equal(indices[0].value, 97.1);
    assert.equal(indices[0].oneWeekMovementPercent, -1.8);
    assert.equal(indices[0].oneMonthMovementPercent, 2.4);
    assert.equal(indices[0].cheapestChain, 'Lidl');
    assert.equal(indices[0].cheapestArea, 'Kista');
    assert.equal(indices[0].biggestDriver, 'Coffee -7.2%');
    assert.equal(indices[1].label, 'Family Basket Index');
    assert.equal(indices[1].cheapestChain, 'Willys');
  });
});
