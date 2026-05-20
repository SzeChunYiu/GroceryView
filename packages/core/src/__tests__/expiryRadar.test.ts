import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildExpiryDealRadar } from '../index.js';

describe('buildExpiryDealRadar', () => {
  it('ranks verified expiry markdowns by urgency, savings, and favorite-store scope', () => {
    const radar = buildExpiryDealRadar({
      now: '2026-05-20T12:00:00.000Z',
      favoriteStoreIds: ['hemkop-fridhemsplan', 'coop-odenplan'],
      maxDistanceKm: 3,
      reports: [
        {
          id: 'r-chicken',
          productId: 'chicken-breast',
          productName: 'Chicken breast',
          storeId: 'hemkop-fridhemsplan',
          storeName: 'Hemkop Fridhemsplan',
          category: 'protein',
          originalPrice: 99.9,
          currentPrice: 49.9,
          markdownPercent: 50,
          expiresAt: '2026-05-20T20:00:00.000Z',
          reportedAt: '2026-05-20T11:42:00.000Z',
          distanceKm: 1.4,
          verificationCount: 2,
          photoCount: 1
        },
        {
          id: 'r-bakery',
          productId: 'bakery-bag',
          productName: 'Bakery bag',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          category: 'bakery',
          originalPrice: 59,
          currentPrice: 35,
          markdownPercent: 41,
          expiresAt: '2026-05-21T08:00:00.000Z',
          reportedAt: '2026-05-20T11:00:00.000Z',
          distanceKm: 2.1,
          verificationCount: 0,
          photoCount: 0
        },
        {
          id: 'r-far',
          productId: 'salad',
          productName: 'Salad box',
          storeId: 'ica-far',
          storeName: 'ICA Far',
          category: 'ready_meal',
          originalPrice: 70,
          currentPrice: 35,
          markdownPercent: 50,
          expiresAt: '2026-05-20T18:00:00.000Z',
          reportedAt: '2026-05-20T11:30:00.000Z',
          distanceKm: 8,
          verificationCount: 3,
          photoCount: 1
        }
      ]
    });

    assert.deepEqual(radar.stores.map((store) => store.storeId), ['hemkop-fridhemsplan', 'coop-odenplan']);
    assert.equal(radar.stores[0].items[0].urgency, 'expires_today');
    assert.equal(radar.stores[0].items[0].verification, 'verified');
    assert.equal(radar.stores[0].items[0].savings, 50);
    assert.equal(radar.stores[0].items[0].radarScore, 100);
    assert.deepEqual(radar.alerts, [
      {
        reportId: 'r-chicken',
        productId: 'chicken-breast',
        storeId: 'hemkop-fridhemsplan',
        type: 'expiry_markdown',
        message: 'Chicken breast is 50% off at Hemkop Fridhemsplan before expiry.'
      }
    ]);
  });

  it('filters categories and marks expired or stale reports as stale evidence', () => {
    const radar = buildExpiryDealRadar({
      now: '2026-05-20T12:00:00.000Z',
      categoryFilter: ['bakery'],
      reports: [
        {
          id: 'r-fresh-bakery',
          productId: 'bread',
          productName: 'Sourdough loaf',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavagen',
          category: 'bakery',
          originalPrice: 45,
          currentPrice: 27,
          markdownPercent: 40,
          expiresAt: '2026-05-21T19:00:00.000Z',
          reportedAt: '2026-05-20T10:00:00.000Z',
          verificationCount: 1,
          photoCount: 1
        },
        {
          id: 'r-expired-bakery',
          productId: 'rolls',
          productName: 'Dinner rolls',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavagen',
          category: 'bakery',
          originalPrice: 30,
          currentPrice: 15,
          markdownPercent: 50,
          expiresAt: '2026-05-20T10:00:00.000Z',
          reportedAt: '2026-05-20T09:00:00.000Z',
          verificationCount: 3,
          photoCount: 1
        },
        {
          id: 'r-stale-bakery',
          productId: 'cake',
          productName: 'Chocolate cake',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavagen',
          category: 'bakery',
          originalPrice: 80,
          currentPrice: 40,
          markdownPercent: 50,
          expiresAt: '2026-05-21T10:00:00.000Z',
          reportedAt: '2026-05-19T07:00:00.000Z',
          verificationCount: 2,
          photoCount: 1
        },
        {
          id: 'r-protein',
          productId: 'yogurt',
          productName: 'Greek yogurt',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavagen',
          category: 'dairy',
          originalPrice: 35,
          currentPrice: 24.5,
          markdownPercent: 30,
          expiresAt: '2026-05-21T08:00:00.000Z',
          reportedAt: '2026-05-20T11:00:00.000Z',
          verificationCount: 2,
          photoCount: 1
        }
      ]
    });

    assert.deepEqual(radar.stores.map((store) => store.items.map((item) => item.id)), [['r-fresh-bakery']]);
    assert.deepEqual(radar.staleReportIds, ['r-expired-bakery', 'r-stale-bakery']);
  });
});
