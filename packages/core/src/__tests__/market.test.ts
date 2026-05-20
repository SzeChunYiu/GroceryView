import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildWatchlistAlerts, searchProducts, summarizeBudget, summarizeStoreDealHighlights } from '../index.js';

describe('searchProducts', () => {
  it('finds products by ticker, name, category, or chain availability', () => {
    const results = searchProducts([
      { id: 'coffee', ticker: 'ZOEGAS-COFFEE-450G', name: 'Zoégas Coffee 450g', category: 'coffee', brandTier: 'national', availableChains: ['willys', 'coop'] },
      { id: 'milk', ticker: 'ARLA-MILK-1L', name: 'Arla Milk 1L', category: 'dairy', brandTier: 'national', availableChains: ['ica', 'willys'] }
    ], 'willys coffee');

    assert.deepEqual(results.map((product) => product.id), ['coffee']);
  });
});

describe('summarizeCategoryDealLeaders', () => {
  it('selects the strongest trusted deal signal for each category', () => {
    const leaders = summarizeCategoryDealLeaders({
      candidates: [
        {
          productId: 'coffee-zoegas',
          productName: 'Zoégas Coffee 450g',
          category: 'coffee',
          storeName: 'Willys Odenplan',
          price: 49.9,
          dealScore: 86,
          sourceConfidence: 0.92
        },
        {
          productId: 'coffee-garant',
          productName: 'Garant Coffee 450g',
          category: 'coffee',
          storeName: 'Hemköp City',
          price: 42.9,
          dealScore: 86,
          sourceConfidence: 0.86
        },
        {
          productId: 'milk-arla',
          productName: 'Arla Milk 1L',
          category: 'dairy',
          storeName: 'Lidl Sveavägen',
          price: 13.9,
          dealScore: 77,
          sourceConfidence: 0.75
        },
        {
          productId: 'eggs-private',
          productName: 'Private-label Eggs 12-pack',
          category: 'eggs',
          storeName: 'Coop Odenplan',
          price: 32.9,
          dealScore: 91,
          sourceConfidence: 0.42
        }
      ]
    });

    assert.deepEqual(leaders, [
      {
        productId: 'coffee-garant',
        productName: 'Garant Coffee 450g',
        category: 'coffee',
        storeName: 'Hemköp City',
        price: 42.9,
        dealScore: 86,
        sourceConfidence: 0.86,
        signal: 'Good deal at 42.90 SEK'
      },
      {
        productId: 'milk-arla',
        productName: 'Arla Milk 1L',
        category: 'dairy',
        storeName: 'Lidl Sveavägen',
        price: 13.9,
        dealScore: 77,
        sourceConfidence: 0.75,
        signal: 'Good deal at 13.90 SEK'
      }
    ]);
  });

  it('honors the caller confidence threshold', () => {
    assert.deepEqual(summarizeCategoryDealLeaders({
      minimumSourceConfidence: 0.9,
      candidates: [
        {
          productId: 'milk-arla',
          productName: 'Arla Milk 1L',
          category: 'dairy',
          storeName: 'Lidl Sveavägen',
          price: 13.9,
          dealScore: 77,
          sourceConfidence: 0.75
        }
      ]
    }), []);
  });
});

describe('buildWatchlistAlerts', () => {
  it('creates actionable alerts for target prices, deal thresholds, and 52-week lows', () => {
    const alerts = buildWatchlistAlerts({
      watchlist: [
        { productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true },
        { productId: 'butter', targetPrice: 45, alertDealScoreAt: 80, favoriteStoresOnly: false }
      ],
      products: [
        { productId: 'coffee', productName: 'Zoégas Coffee 450g', bestPrice: 49.9, bestStoreId: 'willys-odenplan', dealScore: 82, isNew52WeekLow: true },
        { productId: 'butter', productName: 'Butter 600g', bestPrice: 54.9, bestStoreId: 'coop-odenplan', dealScore: 42, isNew52WeekLow: false }
      ],
      favoriteStoreIds: ['willys-odenplan']
    });

    assert.deepEqual(alerts, [
      {
        productId: 'coffee',
        productName: 'Zoégas Coffee 450g',
        type: 'target_price',
        severity: 'opportunity',
        trigger: { metric: 'price', value: 49.9, threshold: 50, storeId: 'willys-odenplan', storeName: 'Willys Odenplan' },
        message: 'Zoégas Coffee 450g is 49.90 SEK at Willys Odenplan, below your 50.00 SEK target.'
      },
      {
        productId: 'coffee',
        productName: 'Zoégas Coffee 450g',
        type: 'deal_score',
        severity: 'opportunity',
        trigger: { metric: 'deal_score', value: 82, threshold: 80, storeId: 'willys-odenplan', storeName: 'Willys Odenplan' },
        message: 'Zoégas Coffee 450g has Deal Score 82, meeting your 80+ alert.'
      },
      {
        productId: 'coffee',
        productName: 'Zoégas Coffee 450g',
        type: 'new_52_week_low',
        severity: 'urgent',
        trigger: { metric: 'price_history', value: 'new_52_week_low', storeId: 'willys-odenplan', storeName: 'Willys Odenplan' },
        message: 'Zoégas Coffee 450g is at a new 52-week low.'
      }
    ]);
  });
});

describe('summarizeStoreDealHighlights', () => {
  it('groups discount deals by store and ranks each store by savings strength', () => {
    const highlights = summarizeStoreDealHighlights([
      { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', productId: 'coffee', productName: 'Coffee', price: 49.9, usualPrice: 59.9, dealScore: 82 },
      { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', productId: 'milk', productName: 'Milk', price: 14.9, usualPrice: 16.9, dealScore: 61 },
      { storeId: 'coop-farsta', storeName: 'Coop Farsta', productId: 'butter', productName: 'Butter', price: 39.9, usualPrice: 54.9, dealScore: 91 },
      { storeId: 'coop-farsta', storeName: 'Coop Farsta', productId: 'oats', productName: 'Oats', price: 29.9, usualPrice: 29.9, dealScore: 40 }
    ], 1);

    assert.deepEqual(highlights.map((store) => ({
      storeId: store.storeId,
      averageSavingsPercent: store.averageSavingsPercent,
      topProductIds: store.topDeals.map((deal) => deal.productId),
      topSavings: store.topDeals.map((deal) => deal.savingsPercent)
    })), [
      { storeId: 'coop-farsta', averageSavingsPercent: 27.32, topProductIds: ['butter'], topSavings: [27.32] },
      { storeId: 'willys-odenplan', averageSavingsPercent: 16.69, topProductIds: ['coffee'], topSavings: [16.69] }
    ]);
  });
});

describe('summarizeBudget', () => {
  it('summarizes weekly and monthly budget status from estimates and receipts', () => {
    const summary = summarizeBudget({
      weeklyBudget: 800,
      monthlyBudget: 3200,
      estimatedBasketTotal: 742,
      receiptTotalsThisWeek: [321, 180],
      receiptTotalsThisMonth: [321, 180, 760, 690]
    });

    assert.deepEqual(summary, {
      weeklyBudget: 800,
      monthlyBudget: 3200,
      estimatedBasketTotal: 742,
      weeklyActualSpend: 501,
      monthlyActualSpend: 1951,
      weeklyRemainingAfterEstimate: 58,
      weeklyRemainingActual: 299,
      monthlyRemainingActual: 1249,
      weeklyStatus: 'under',
      monthlyStatus: 'under'
    });
  });
});
