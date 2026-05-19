import { buildWatchlistAlerts, calculateDealScore, calculateFixedBasketIndex, compareBasketStrategies, scoreBand, searchProducts, summarizeBudget } from '@groceryview/core';

type ProductRow = {
  ticker: string;
  name: string;
  price: number;
  sevenDay: number;
  cityPercentile: number;
  historyPercentile: number;
  unitPercentile: number;
  discountDepthPercent: number;
  confidence: number;
};

const products: ProductRow[] = [
  { ticker: 'ZOEGAS-COFFEE-450G', name: 'Zoégas Coffee 450g', price: 49.9, sevenDay: -12.4, cityPercentile: 8, historyPercentile: 12, unitPercentile: 18, discountDepthPercent: 25, confidence: 0.9 },
  { ticker: 'ARLA-MILK-1L', name: 'Arla Milk 1L', price: 14.9, sevenDay: -4.2, cityPercentile: 18, historyPercentile: 12, unitPercentile: 35, discountDepthPercent: 8, confidence: 0.86 },
  { ticker: 'BUTTER-600G', name: 'Butter 600g', price: 54.9, sevenDay: 2.1, cityPercentile: 58, historyPercentile: 61, unitPercentile: 52, discountDepthPercent: 2, confidence: 0.72 },
  { ticker: 'EGGS-12P', name: 'Eggs 12-pack', price: 34.9, sevenDay: -4.2, cityPercentile: 22, historyPercentile: 28, unitPercentile: 24, discountDepthPercent: 10, confidence: 0.82 }
];

const searchableProducts = products.map((product) => ({
  id: product.ticker.toLowerCase().split('-')[0],
  ticker: product.ticker,
  name: product.name,
  category: product.name.toLowerCase().includes('coffee') ? 'coffee' : product.name.toLowerCase().includes('milk') || product.name.toLowerCase().includes('butter') ? 'dairy' : 'eggs',
  brandTier: 'national' as const,
  availableChains: ['willys', 'lidl', 'coop']
}));

const searchHits = searchProducts(searchableProducts, 'willys coffee');

const scoredProducts = products.map((product) => {
  const score = calculateDealScore({
    currentCityPercentile: product.cityPercentile,
    knownPromoHistoryPercentile: product.historyPercentile,
    equivalentUnitPricePercentile: product.unitPercentile,
    discountDepthPercent: product.discountDepthPercent,
    sourceConfidence: product.confidence
  });
  return { ...product, score, band: scoreBand(score) };
});

const basket = compareBasketStrategies({
  favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen'],
  items: [
    { productId: 'coffee', quantity: 1, prices: [{ storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9 }, { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 59.9 }] },
    { productId: 'milk', quantity: 2, prices: [{ storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9 }, { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9 }] },
    { productId: 'eggs', quantity: 1, prices: [{ storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 36.9 }, { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 34.9 }] }
  ]
});


const alerts = buildWatchlistAlerts({
  watchlist: [
    { productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true },
    { productId: 'butter', targetPrice: 45, alertDealScoreAt: 80, favoriteStoresOnly: false }
  ],
  products: [
    { productId: 'coffee', productName: 'Zoégas Coffee 450g', bestPrice: 49.9, bestStoreId: 'willys-odenplan', dealScore: 82, isNew52WeekLow: true },
    { productId: 'butter', productName: 'Butter 600g', bestPrice: 54.9, bestStoreId: 'coop-odenplan', dealScore: 42, isNew52WeekLow: false }
  ],
  favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
});

const budget = summarizeBudget({
  weeklyBudget: 800,
  monthlyBudget: 3200,
  estimatedBasketTotal: 742,
  receiptTotalsThisWeek: [321, 180],
  receiptTotalsThisMonth: [321, 180, 760, 690]
});

const index = calculateFixedBasketIndex({
  id: 'stockholm-grocery-index',
  label: 'Stockholm Grocery Index',
  baseDate: '2026-01-01',
  currentDate: '2026-05-19',
  components: [
    { productId: 'coffee', baseUnitPrice: 100, currentUnitPrice: 91.6, weight: 1 },
    { productId: 'dairy', baseUnitPrice: 100, currentUnitPrice: 108.4, weight: 1 },
    { productId: 'protein', baseUnitPrice: 100, currentUnitPrice: 102.1, weight: 1 },
    { productId: 'budget-basket', baseUnitPrice: 100, currentUnitPrice: 96.8, weight: 1 },
    { productId: 'private-label', baseUnitPrice: 100, currentUnitPrice: 94.2, weight: 1 }
  ]
});

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root');

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <div class="card">
        <div class="eyebrow">Stockholm grocery market</div>
        <h1>Track grocery prices like stocks.</h1>
        <p class="lede">A chart-first GroceryView MVP: product tickers, deal scoring, favorite-store basket comparison, budget signal, and transparent confidence metadata.</p>
        <div class="toolbar">
          <span class="pill">No travel-time penalty</span>
          <span class="pill">Ads never affect Deal Score</span>
          <span class="pill">Verified vs estimated-ready</span>
        </div>
        <div class="grid">
          <div class="metric"><strong>${index.value}</strong><span>${index.label}</span></div>
          <div class="metric"><strong>${budget.weeklyRemainingAfterEstimate} SEK</strong><span>weekly budget left after plan</span></div>
          <div class="metric"><strong>${basket.cheapestByProduct.total} SEK</strong><span>favorite-store basket</span></div>
        </div>
      </div>
      <aside class="card">
        <h2>Market chart</h2>
        <div class="chart">
          ${index.components.map((component) => `<div class="bar" style="height:${component.currentUnitPrice}%" data-label="${component.productId.split('-')[0]}"></div>`).join('')}
        </div>
        <p class="footer-note">Fixed basket methodology, equal weights, confidence: ${index.confidence}.</p>
      </aside>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Top movers and true deals</h2>
        <table class="table">
          <thead><tr><th>Ticker</th><th>Best price</th><th>7D</th><th>Deal</th><th>Verdict</th></tr></thead>
          <tbody>
            ${scoredProducts.map((product) => `<tr>
              <td><strong>${product.ticker}</strong><br><span class="footer-note">${product.name}</span></td>
              <td>${product.price.toFixed(2)} SEK</td>
              <td class="${product.sevenDay < 0 ? 'negative' : 'positive'}">${product.sevenDay}%</td>
              <td>${product.score}</td>
              <td class="verdict">${product.band.verdict}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2>Weekly basket strategy</h2>
        <p class="lede">Cheapest by product across selected favorite stores. Distance is informational only and never reduces savings.</p>
        <table class="table">
          <thead><tr><th>Product</th><th>Store</th><th>Total</th></tr></thead>
          <tbody>
            ${basket.cheapestByProduct.assignments.map((item) => `<tr><td>${item.productId}</td><td>${item.storeName}</td><td>${item.lineTotal.toFixed(2)} SEK</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>


    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Watchlist alerts</h2>
        <table class="table">
          <thead><tr><th>Type</th><th>Message</th></tr></thead>
          <tbody>
            ${alerts.map((alert) => `<tr><td>${alert.type.replaceAll('_', ' ')}</td><td>${alert.message}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>Search and budget readiness</h2>
        <p class="lede">Query <strong>willys coffee</strong> returns ${searchHits.length} product ticker match. Weekly actual spend is ${budget.weeklyActualSpend} SEK, with ${budget.weeklyRemainingActual} SEK remaining.</p>
        <div class="grid">
          <div class="metric"><strong>${budget.weeklyStatus}</strong><span>weekly status</span></div>
          <div class="metric"><strong>${budget.monthlyRemainingActual}</strong><span>monthly SEK left</span></div>
          <div class="metric"><strong>${searchHits[0]?.ticker ?? '—'}</strong><span>top search match</span></div>
        </div>
      </div>
    </section>
  </main>
`;
