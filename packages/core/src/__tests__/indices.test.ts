import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistrictIndices, calculateFixedBasketIndex } from '../index.js';

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

  it('calculates selected district indices with area comparison signals', () => {
    const indices = calculateDistrictIndices({
      baseDate: '2026-01-01',
      currentDate: '2026-05-20',
      districts: [
        {
          district: 'Odenplan',
          label: 'Odenplan Grocery Index',
          basketTotal: 742,
          oneWeekMovementPercent: -0.8,
          oneMonthMovementPercent: 1.6,
          components: [
            { productId: 'coffee', category: 'Coffee', baseUnitPrice: 100, currentUnitPrice: 92, weight: 2 },
            { productId: 'dairy', category: 'Dairy', baseUnitPrice: 100, currentUnitPrice: 106, weight: 2 },
            { productId: 'protein', category: 'Protein', baseUnitPrice: 100, currentUnitPrice: 101, weight: 1 }
          ]
        },
        {
          district: 'Kista',
          label: 'Kista Student Basket Index',
          basketTotal: 698,
          oneWeekMovementPercent: -1.8,
          oneMonthMovementPercent: 2.4,
          components: [
            { productId: 'coffee', category: 'Coffee', baseUnitPrice: 100, currentUnitPrice: 90, weight: 2 },
            { productId: 'pasta', category: 'Pasta', baseUnitPrice: 100, currentUnitPrice: 97, weight: 3 }
          ]
        }
      ]
    });

    assert.equal(indices[0].label, 'Odenplan Grocery Index');
    assert.equal(indices[0].value, 99.4);
    assert.equal(indices[0].biggestDriver, 'Coffee -8%');
    assert.equal(indices[0].cheapestDistrict, false);
    assert.equal(indices[1].label, 'Kista Student Basket Index');
    assert.equal(indices[1].cheapestDistrict, true);
    assert.equal(indices[1].oneWeekMovementPercent, -1.8);
  });
});
