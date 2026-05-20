import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildWatchlistAlerts, searchProducts, summarizeBudget } from '../index.js';

describe('searchProducts', () => {
  it('finds products by ticker, name, category, or chain availability', () => {
    const results = searchProducts([
      { id: 'coffee', ticker: 'ZOEGAS-COFFEE-450G', name: 'Zoégas Coffee 450g', category: 'coffee', brandTier: 'national', availableChains: ['willys', 'coop'] },
      { id: 'milk', ticker: 'ARLA-MILK-1L', name: 'Arla Milk 1L', category: 'dairy', brandTier: 'national', availableChains: ['ica', 'willys'] }
    ], 'willys coffee');

    assert.deepEqual(results.map((product) => product.id), ['coffee']);
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
