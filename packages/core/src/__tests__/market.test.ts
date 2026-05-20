import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildWatchlistAlerts, planMobileBudgetTracker, searchProducts, summarizeBudget } from '../index.js';

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

describe('planMobileBudgetTracker', () => {
  it('tracks in-store running totals and budget-mode guidance while under budget', () => {
    const plan = planMobileBudgetTracker({
      mode: 'student',
      weeklyBudget: 800,
      monthlyBudget: 3200,
      estimatedBasketTotal: 742,
      runningCartTotal: 436,
      receiptTotalsThisWeek: [120],
      receiptTotalsThisMonth: [120, 240]
    });

    assert.equal(plan.runningRemaining, 364);
    assert.equal(plan.runningStatus, 'under');
    assert.equal(plan.weeklyRemainingAfterEstimate, 58);
    assert.equal(plan.guidance, 'Prioritize private-label swaps and lowest unit prices.');
    assert.deepEqual(plan.actions, ['continue_shopping', 'compare_favorite_stores', 'scan_receipt']);
  });

  it('flags over-budget carts with reduction and substitution actions', () => {
    const plan = planMobileBudgetTracker({
      mode: 'strict',
      weeklyBudget: 800,
      monthlyBudget: 3200,
      estimatedBasketTotal: 812,
      runningCartTotal: 824.5,
      receiptTotalsThisWeek: [812],
      receiptTotalsThisMonth: [812, 900]
    });

    assert.equal(plan.runningRemaining, -24.5);
    assert.equal(plan.runningStatus, 'over');
    assert.equal(plan.weeklyRemainingAfterEstimate, -12);
    assert.equal(plan.weeklyStatus, 'over');
    assert.equal(plan.guidance, 'Stay under the weekly limit before checkout.');
    assert.deepEqual(plan.actions, ['reduce_cart', 'review_substitutions', 'compare_favorite_stores', 'scan_receipt']);
  });
});
