import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankMyBasketPromos } from '../index.js';

describe('rankMyBasketPromos', () => {
  it('shows only promos covering watchlist or recent basket listings sorted by savings descending', () => {
    const ranked = rankMyBasketPromos({
      asOf: '2026-05-25T12:00:00.000Z',
      user: {
        watchlist: [{ listingId: 'listing:coffee' }],
        recentBasketHistory: [
          { listingId: 'listing:milk', purchasedAt: '2026-05-20T12:00:00.000Z' },
          { listingId: 'listing:rice', purchasedAt: '2026-04-01T12:00:00.000Z' }
        ]
      },
      promos: [
        {
          promoId: 'promo:coffee-small',
          listingId: 'listing:coffee',
          savings: 12
        },
        {
          promoId: 'promo:milk',
          coveredListingIds: ['listing:milk'],
          savings: 24
        },
        {
          promoId: 'promo:rice-old',
          coveredListingIds: ['listing:rice'],
          savings: 50
        },
        {
          promoId: 'promo:unmatched',
          coveredListingIds: ['listing:soda'],
          savings: 99
        }
      ]
    });

    assert.deepEqual(ranked.map((promo) => promo.promoId), ['promo:milk', 'promo:coffee-small']);
    assert.deepEqual(ranked.map((promo) => promo.rank), [1, 2]);
    assert.deepEqual(ranked[0]?.matchedListingIds, ['listing:milk']);
    assert.deepEqual(ranked[0]?.matchReasons, ['recent_basket']);
    assert.deepEqual(ranked[1]?.matchedListingIds, ['listing:coffee']);
    assert.deepEqual(ranked[1]?.matchReasons, ['watchlist']);
  });

  it('deduplicates covered listings and reports both user match reasons', () => {
    const ranked = rankMyBasketPromos({
      asOf: '2026-05-25T12:00:00.000Z',
      user: {
        watchlist: [{ listingId: 'listing:yogurt' }],
        recentBasketHistory: [{ listingId: 'listing:yogurt', purchasedAt: '2026-05-24T12:00:00.000Z' }]
      },
      promos: [
        {
          promoId: 'promo:yogurt',
          listingId: 'listing:yogurt',
          coveredListingIds: ['listing:yogurt'],
          savings: 10
        }
      ]
    });

    assert.deepEqual(ranked[0]?.matchedListingIds, ['listing:yogurt']);
    assert.deepEqual(ranked[0]?.matchReasons, ['recent_basket', 'watchlist']);
  });

  it('validates topN, recentDays, promo savings, and listing identifiers', () => {
    assert.throws(
      () => rankMyBasketPromos({ user: {}, promos: [], topN: 0 }),
      /topN must be a positive integer/
    );
    assert.throws(
      () => rankMyBasketPromos({ user: {}, promos: [], recentDays: -1 }),
      /recentDays must be a non-negative finite number/
    );
    assert.throws(
      () => rankMyBasketPromos({ user: {}, promos: [{ promoId: 'promo:bad', listingId: 'listing:bad', savings: Number.NaN }] }),
      /savings must be a finite number/
    );
    assert.throws(
      () => rankMyBasketPromos({ user: { watchlist: [{ listingId: ' ' }] }, promos: [] }),
      /watchlist.listingId is required/
    );
  });
});
