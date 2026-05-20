import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildWatchlistAlerts, searchProducts, summarizeBudget, summarizeCategoryDealLeaders } from '../index.js';
import { buildWatchlistAlerts, searchProducts, summarizeBudget, summarizeProductAvailability } from '../index.js';

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
describe('summarizeProductAvailability', () => {
  it('separates in-stock, out-of-stock, and verified availability reports', () => {
    const summary = summarizeProductAvailability({
      productId: 'coffee',
      reports: [
        { productId: 'coffee', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', status: 'in_stock', source: 'shelf_photo', reportedAt: '2026-05-20T09:00:00Z', trustScore: 0.92 },
        { productId: 'coffee', storeId: 'coop-odenplan', storeName: 'Coop Odenplan', status: 'out_of_stock', source: 'community_report', reportedAt: '2026-05-20T08:30:00Z', trustScore: 0.61 },
        { productId: 'coffee', storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', status: 'low_stock', source: 'retailer_online', reportedAt: '2026-05-20T08:45:00Z', trustScore: 0.81 },
        { productId: 'milk', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', status: 'in_stock', source: 'receipt', reportedAt: '2026-05-20T08:00:00Z', trustScore: 0.8 }
      ]
    });

    assert.equal(summary.bestStatus, 'in_stock');
    assert.equal(summary.inStockStoreCount, 1);
    assert.equal(summary.outOfStockStoreCount, 1);
    assert.equal(summary.verifiedStoreCount, 2);
    assert.equal(summary.lastVerifiedAt, '2026-05-20T09:00:00Z');
    assert.equal(summary.storeRows[0].storeName, 'Willys Odenplan');
    assert.equal(summary.storeRows[0].verified, true);
    assert.equal(summary.storeRows.find((row) => row.storeId === 'coop-odenplan')?.verified, false);
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
