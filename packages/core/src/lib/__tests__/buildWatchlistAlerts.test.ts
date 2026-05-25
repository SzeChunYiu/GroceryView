import { describe, expect, it } from 'vitest';
import { buildWatchlistAlerts, type WatchlistItem, type WatchlistProductSnapshot } from '../../index.js';

const realProducts: WatchlistProductSnapshot[] = [
  {
    productId: 'arla-mellanmjolk-1l',
    productName: 'Arla Mellanmjölk 1L',
    bestPrice: 10.95,
    bestStoreId: 'ica-nara-odenplan',
    bestPriceType: 'promotion',
    prices: [
      { storeId: 'willys-hemma-sodermalm', storeName: 'Willys Hemma Södermalm', price: 12.9, priceType: 'shelf' },
      { storeId: 'ica-nara-odenplan', storeName: 'ICA Nära Odenplan', price: 10.95, priceType: 'promotion' }
    ],
    dealScore: 92,
    isNew52WeekLow: true
  },
  {
    productId: 'zoegas-skane-kaffe-450g',
    productName: 'Zoégas Skånerost 450g',
    bestPrice: 54.9,
    bestStoreId: 'coop-medborgarplatsen',
    bestPriceType: 'member',
    prices: [
      { storeId: 'coop-medborgarplatsen', storeName: 'Coop Medborgarplatsen', price: 54.9, priceType: 'member' },
      { storeId: 'willys-hemma-sodermalm', storeName: 'Willys Hemma Södermalm', price: 63.9, priceType: 'shelf' }
    ],
    dealScore: 78,
    isNew52WeekLow: false
  }
];

describe('buildWatchlistAlerts', () => {
  it('builds target price, deal score, and 52-week-low alerts for real watchlist fixtures', () => {
    const watchlist: WatchlistItem[] = [
      {
        productId: 'arla-mellanmjolk-1l',
        targetPrice: 12,
        alertDealScoreAt: 90,
        favoriteStoresOnly: true,
        allowedPriceTypes: ['promotion', 'shelf']
      },
      {
        productId: 'zoegas-skane-kaffe-450g',
        targetPrice: 50,
        alertDealScoreAt: 80,
        favoriteStoresOnly: false,
        allowedPriceTypes: ['member']
      }
    ];

    const alerts = buildWatchlistAlerts({
      watchlist,
      products: realProducts,
      favoriteStoreIds: ['ica-nara-odenplan']
    });

    expect(alerts).toHaveLength(3);
    expect(alerts.map((alert) => alert.type)).toEqual(['target_price', 'deal_score', 'new_52_week_low']);
    expect(alerts[0]).toMatchObject({
      productId: 'arla-mellanmjolk-1l',
      productName: 'Arla Mellanmjölk 1L',
      severity: 'opportunity',
      trigger: {
        metric: 'price',
        value: 10.95,
        threshold: 12,
        storeId: 'ica-nara-odenplan',
        storeName: 'Ica Nara Odenplan'
      }
    });
    expect(alerts[1]).toMatchObject({
      type: 'deal_score',
      severity: 'urgent',
      trigger: { metric: 'deal_score', value: 92, threshold: 90 }
    });
    expect(alerts[2]).toMatchObject({
      type: 'new_52_week_low',
      severity: 'urgent',
      trigger: { metric: 'price_history', value: 'new_52_week_low' }
    });
  });

  it('returns no alerts for an empty watchlist and product set', () => {
    expect(buildWatchlistAlerts({ watchlist: [], products: [], favoriteStoreIds: [] })).toEqual([]);
  });

  it('skips malformed or missing-field watchlist rows without emitting alerts', () => {
    const malformedWatchlist = [
      { favoriteStoresOnly: false },
      { productId: 'missing-price-product', targetPrice: 20, favoriteStoresOnly: false },
      { productId: 'zoegas-skane-kaffe-450g', targetPrice: 60, favoriteStoresOnly: true, allowedPriceTypes: ['promotion'] }
    ] as unknown as WatchlistItem[];

    const alerts = buildWatchlistAlerts({
      watchlist: malformedWatchlist,
      products: realProducts,
      favoriteStoreIds: ['ica-nara-odenplan']
    });

    expect(alerts).toEqual([]);
  });
});
