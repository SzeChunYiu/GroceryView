import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDealScore, scoreBand } from '../index.js';
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
