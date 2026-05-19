import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFixedBasketIndex } from '../index.js';
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
});
