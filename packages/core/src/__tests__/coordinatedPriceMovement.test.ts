import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectCoordinatedPriceMovements, isoWeekStart, type CoordinatedPriceObservation } from '../index.js';

function obs(chainId: string, observedAt: string, price: number): CoordinatedPriceObservation {
  return {
    sku: 'axfood-123',
    productName: 'Matched coffee 450g',
    chainId,
    observedAt,
    price,
    sourceLabel: 'shelf history',
    sourceConfidence: 0.9
  };
}

describe('isoWeekStart', () => {
  it('returns Monday for an ISO week', () => {
    assert.equal(isoWeekStart(Date.parse('2026-05-24T12:00:00.000Z')), '2026-05-18');
  });
});

describe('detectCoordinatedPriceMovements', () => {
  it('flags same-week same-SKU movements across two chains as research-grade signals', () => {
    const observations = [
      obs('willys', '2026-05-18T09:00:00.000Z', 50),
      obs('willys', '2026-05-20T09:00:00.000Z', 55),
      obs('hemkop', '2026-05-18T09:00:00.000Z', 52),
      obs('hemkop', '2026-05-21T09:00:00.000Z', 57.2)
    ];

    const signals = detectCoordinatedPriceMovements(observations, { minimumChangePercent: 5 });

    assert.equal(signals.length, 1);
    assert.equal(signals[0].sku, 'axfood-123');
    assert.equal(signals[0].weekStart, '2026-05-18');
    assert.equal(signals[0].direction, 'up');
    assert.deepEqual(signals[0].chains, ['hemkop', 'willys']);
    assert.match(signals[0].researchGradeCopy, /not an accusation/);
  });

  it('does not group opposite directions or single-chain moves', () => {
    const observations = [
      obs('willys', '2026-05-18T09:00:00.000Z', 50),
      obs('willys', '2026-05-20T09:00:00.000Z', 55),
      obs('hemkop', '2026-05-18T09:00:00.000Z', 52),
      obs('hemkop', '2026-05-21T09:00:00.000Z', 48)
    ];

    assert.equal(detectCoordinatedPriceMovements(observations, { minimumChangePercent: 5 }).length, 0);
  });
});
