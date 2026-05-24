import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildExpiryDealRadar } from '../../../index.js';

describe('buildExpiryDealRadar ranker', () => {
  it('filters by store/category/distance, excludes stale rows, and ranks verified urgent markdowns first', () => {
    const radar = buildExpiryDealRadar({
      now: '2026-05-20T12:00:00.000Z',
      favoriteStoreIds: ['willys-odenplan', 'coop-odenplan'],
      categoryFilter: ['dairy'],
      maxDistanceKm: 2,
      reports: [
        { id: 'urgent-verified', productId: 'milk', productName: 'Milk', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', category: 'dairy', originalPrice: 20, currentPrice: 10, markdownPercent: 50, expiresAt: '2026-05-20T18:00:00.000Z', reportedAt: '2026-05-20T10:00:00.000Z', distanceKm: 1, verificationCount: 2, photoCount: 0 },
        { id: 'later-unverified', productId: 'yogurt', productName: 'Yogurt', storeId: 'coop-odenplan', storeName: 'Coop Odenplan', category: 'dairy', originalPrice: 30, currentPrice: 18, markdownPercent: 40, expiresAt: '2026-05-21T20:00:00.000Z', reportedAt: '2026-05-20T11:00:00.000Z', distanceKm: 1.5, verificationCount: 0, photoCount: 0 },
        { id: 'wrong-category', productId: 'bread', productName: 'Bread', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', category: 'bakery', originalPrice: 20, currentPrice: 5, markdownPercent: 75, expiresAt: '2026-05-20T16:00:00.000Z', reportedAt: '2026-05-20T11:00:00.000Z', distanceKm: 1, verificationCount: 3, photoCount: 1 },
        { id: 'too-far', productId: 'cream', productName: 'Cream', storeId: 'coop-odenplan', storeName: 'Coop Odenplan', category: 'dairy', originalPrice: 20, currentPrice: 8, markdownPercent: 60, expiresAt: '2026-05-20T16:00:00.000Z', reportedAt: '2026-05-20T11:00:00.000Z', distanceKm: 3, verificationCount: 3, photoCount: 1 },
        { id: 'expired', productId: 'cheese', productName: 'Cheese', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', category: 'dairy', originalPrice: 50, currentPrice: 20, markdownPercent: 60, expiresAt: '2026-05-20T10:00:00.000Z', reportedAt: '2026-05-20T09:00:00.000Z', distanceKm: 1, verificationCount: 2, photoCount: 1 }
      ]
    });

    assert.deepEqual(radar.staleReportIds, ['expired']);
    assert.deepEqual(radar.stores.map((store) => store.storeId), ['willys-odenplan', 'coop-odenplan']);
    assert.deepEqual(radar.stores.flatMap((store) => store.items.map((item) => item.id)), ['urgent-verified', 'later-unverified']);
    assert.deepEqual(radar.alerts.map((alert) => alert.reportId), ['urgent-verified']);
  });
});
