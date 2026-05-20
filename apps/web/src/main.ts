import {
  applyHumanReviewDecision,
  buildWatchlistAlerts,
  calculateDealScore,
  calculateFixedBasketIndex,
  compareBasketStrategies,
  scoreBand,
  searchProducts,
  summarizeBudget,
  summarizeHumanReviewSla
} from '@groceryview/core';

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

const dailyDealActions = [
  { product: 'Zoégas Coffee 450g', store: 'Willys Odenplan', score: 82, confidence: 'Verified shelf', action: 'Buy two for this week' },
  { product: 'Eggs 12-pack', store: 'Lidl Sveavägen', score: 76, confidence: 'Retailer page', action: 'Add to split basket' },
  { product: 'Garant Bryggkaffe 450g', store: 'Willys Odenplan', score: 73, confidence: 'Verified shelf', action: 'Use as private-label swap' }
];

const basket = compareBasketStrategies({
  favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen'],
  items: [
    { productId: 'coffee', quantity: 1, prices: [{ storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9 }, { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 59.9 }] },
    { productId: 'milk', quantity: 2, prices: [{ storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9 }, { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9 }] },
    { productId: 'eggs', quantity: 1, prices: [{ storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 36.9 }, { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 34.9 }] }
  ]
});

const smartSwaps = [
  { from: 'Zoégas Coffee 450g', to: 'Garant Bryggkaffe 450g', savings: 12, rule: 'Same category, verified shelf price' },
  { from: 'Arla Milk 1L', to: 'ICA Milk 1L', savings: 2, rule: 'Household accepts private label dairy' },
  { from: 'Eggs 12-pack', to: 'Lidl Eggs 12-pack', savings: 4, rule: 'Favorite-store match, same pack size' }
];


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

const alertPreferences = [
  { rule: 'Coffee below 50 SEK', channel: 'Push', quietHours: '21:00-07:00', scope: 'Favorite stores' },
  { rule: 'Butter deal score above 80', channel: 'Email', quietHours: 'Daily digest', scope: 'All Stockholm stores' },
  { rule: 'Receipt review reminder', channel: 'Push', quietHours: 'Immediate', scope: 'Household queue' }
];

const watchlistRows = [
  { product: 'Zoégas Coffee 450g', target: '50 SEK', current: '49.90 SEK', trigger: 'Deal Score >= 80', status: 'Ready for push' },
  { product: 'Butter 600g', target: '45 SEK', current: '54.90 SEK', trigger: '52-week low', status: 'Watching' },
  { product: 'Eggs 12-pack', target: '35 SEK', current: '34.90 SEK', trigger: 'Favorite stores only', status: 'Ready for email' },
  { product: 'Loose tomatoes', target: '29 SEK/kg', current: 'Estimated', trigger: 'Confidence >= 80%', status: 'Held for review' }
];

const budget = summarizeBudget({
  weeklyBudget: 800,
  monthlyBudget: 3200,
  estimatedBasketTotal: 742,
  receiptTotalsThisWeek: [321, 180],
  receiptTotalsThisMonth: [321, 180, 760, 690]
});

const budgetForecastRows = [
  { period: 'This week actuals', budget: '800 SEK', value: `${budget.weeklyActualSpend} SEK`, variance: `${budget.weeklyRemainingActual} SEK left`, status: budget.weeklyStatus },
  { period: 'Next planned basket', budget: '800 SEK', value: `${budget.estimatedBasketTotal} SEK`, variance: `${budget.weeklyRemainingAfterEstimate} SEK left`, status: 'needs review' },
  { period: 'Month-end projection', budget: '3 200 SEK', value: '3 084 SEK', variance: '116 SEK left', status: 'on track' }
];

const scannerReviews = [
  {
    source: 'Coop Farsta receipt',
    status: 'Needs human review',
    confidence: 71,
    owner: 'Mina',
    action: 'Confirm milk line item and loyalty discount'
  },
  {
    source: 'Arla Milk barcode',
    status: 'Matched',
    confidence: 98,
    owner: 'Alex',
    action: 'Ready for basket price update'
  },
  {
    source: 'Loose tomatoes label',
    status: 'Low confidence',
    confidence: 54,
    owner: 'Sam',
    action: 'Route to product matching queue'
  }
];

const receiptReviewRows = [
  { line: 'Arla Milk 1L', match: 'ARLA-MILK-1L', confidence: 98, budgetAction: 'Post to weekly actuals', catalogAction: 'Update verified price' },
  { line: 'Coop loyalty discount', match: 'receipt discount', confidence: 84, budgetAction: 'Apply receipt total only', catalogAction: 'No shelf price update' },
  { line: 'Loose tomatoes', match: 'unknown produce', confidence: 54, budgetAction: 'Hold from forecast', catalogAction: 'Route to human review' }
];

const humanReviewAssignments = [
  {
    id: 'assignment-review-match-1-moderator-1',
    reviewId: 'review-match-1',
    subjectType: 'product_match' as const,
    subjectId: 'match-1',
    priority: 'high' as const,
    reason: 'Loose tomatoes label has low confidence and high quality risk.',
    assigneeId: 'moderator-1',
    assignedAt: '2026-05-19T10:00:00.000Z',
    dueAt: '2026-05-19T12:00:00.000Z',
    status: 'assigned' as const
  },
  {
    id: 'assignment-review-report-1-moderator-2',
    reviewId: 'review-report-1',
    subjectType: 'community_report' as const,
    subjectId: 'report-1',
    priority: 'medium' as const,
    reason: 'Community report for coffee price has low confidence score.',
    assigneeId: 'moderator-2',
    assignedAt: '2026-05-19T09:30:00.000Z',
    dueAt: '2026-05-20T09:30:00.000Z',
    status: 'in_progress' as const
  }
];

const humanReviewSla = summarizeHumanReviewSla({
  assignments: humanReviewAssignments,
  now: '2026-05-19T12:30:00.000Z'
});

const humanReviewDecisionPreview = applyHumanReviewDecision({
  item: {
    id: humanReviewAssignments[0].reviewId,
    subjectType: humanReviewAssignments[0].subjectType,
    subjectId: humanReviewAssignments[0].subjectId,
    priority: humanReviewAssignments[0].priority,
    reason: humanReviewAssignments[0].reason
  },
  decision: 'approve',
  reviewerId: humanReviewAssignments[0].assigneeId,
  decidedAt: '2026-05-19T12:45:00.000Z',
  notes: 'Shelf photo confirms equivalent produce unit.'
});

const privacyControls = [
  { setting: 'Receipt images', state: 'Auto-delete after review', detail: '7 day retention window' },
  { setting: 'Location precision', state: 'District only', detail: 'Street address hidden from exports' },
  { setting: 'Price contribution', state: 'Anonymous', detail: 'No account identifier in catalog backfill' }
];

const householdRules = [
  { member: 'Alex', budgetShare: '50%', rule: 'Owner approval over 400 SEK', dietary: 'Vegetarian, lactose ok' },
  { member: 'Mina', budgetShare: '35%', rule: 'Reviews low-confidence receipts', dietary: 'No pork, nut alert' },
  { member: 'Sam', budgetShare: '15%', rule: 'School lunch staples pinned', dietary: 'Child-friendly swaps' }
];

const storeHighlights = [
  { store: 'Willys Odenplan', category: 'Coffee', signal: '-12% vs Stockholm average', confidence: 'Verified shelf' },
  { store: 'Lidl Sveavägen', category: 'Eggs', signal: 'Best basket line', confidence: 'Retailer page' },
  { store: 'Coop Farsta', category: 'Butter', signal: 'Above usual price', confidence: 'Estimated' }
];

const storeComparisons = [
  { store: 'Willys Odenplan', basketTotal: 742, verifiedCoverage: 82, lowConfidenceRows: 2, bestCategory: 'Coffee', shopperFit: 'Primary weekly basket' },
  { store: 'Lidl Sveavägen', basketTotal: 729, verifiedCoverage: 76, lowConfidenceRows: 3, bestCategory: 'Eggs and dairy', shopperFit: 'Cheapest split basket' },
  { store: 'Coop Farsta', basketTotal: 781, verifiedCoverage: 68, lowConfidenceRows: 5, bestCategory: 'Member promos', shopperFit: 'Review before checkout' }
];

const categorySignals = [
  { category: 'Coffee', product: 'Zoégas Coffee 450g', store: 'Willys Odenplan', price: '49.90 SEK', signal: '12th historical percentile' },
  { category: 'Dairy', product: 'Arla Milk 1L', store: 'Lidl Sveavägen', price: '13.90 SEK', signal: 'Best favorite-store line' },
  { category: 'Eggs', product: 'Eggs 12-pack', store: 'Lidl Sveavägen', price: '34.90 SEK', signal: 'Private-label swap candidate' }
];

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
        <h2>Scanner review desk</h2>
        <p class="lede">Receipt and barcode captures stay visible with confidence, owner, and next action before they update budgets or catalog prices. <a href="/receipts/review/">Open receipt review</a>.</p>
        <table class="table">
          <thead><tr><th>Capture</th><th>Status</th><th>Confidence</th><th>Owner</th></tr></thead>
          <tbody>
            ${scannerReviews.map((review) => `<tr>
              <td><strong>${review.source}</strong><br><span class="footer-note">${review.action}</span></td>
              <td><span class="status">${review.status}</span></td>
              <td>${review.confidence}%</td>
              <td>${review.owner}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>Receipt line writeback</h2>
        <p class="lede">Receipt lines require a product match and sufficient confidence before they can update budgets, catalog prices, or Deal Score inputs.</p>
        <table class="table">
          <thead><tr><th>Line</th><th>Match</th><th>Confidence</th><th>Budget</th><th>Catalog</th></tr></thead>
          <tbody>
            ${receiptReviewRows.map((row) => `<tr><td>${row.line}</td><td>${row.match}</td><td>${row.confidence}%</td><td>${row.budgetAction}</td><td>${row.catalogAction}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Review routing</h2>
        <p class="lede">Low-confidence captures are separated from verified shelf and retailer-page prices so estimated data cannot masquerade as official price evidence.</p>
        <div class="grid">
          <div class="metric"><strong>${scannerReviews.filter((review) => review.status === 'Matched').length}</strong><span>matched capture</span></div>
          <div class="metric"><strong>${scannerReviews.filter((review) => review.status !== 'Matched').length}</strong><span>review queue</span></div>
          <div class="metric"><strong>${Math.round(scannerReviews.reduce((sum, review) => sum + review.confidence, 0) / scannerReviews.length)}%</strong><span>average confidence</span></div>
        </div>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Human review operations</h2>
        <p class="lede">Admin reviewers see assignment ownership, SLA state, and the exact writeback action before a product match or community report changes catalog data.</p>
        <table class="table">
          <thead><tr><th>Review</th><th>Priority</th><th>Assignee</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            ${humanReviewAssignments.map((assignment) => `<tr>
              <td><strong>${assignment.reviewId}</strong><br><span class="footer-note">${assignment.reason}</span></td>
              <td>${assignment.priority}</td>
              <td>${assignment.assigneeId}</td>
              <td>${assignment.dueAt.replace('T', ' ').slice(0, 16)}</td>
              <td><span class="status">${assignment.status}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>Decision controls</h2>
        <p class="lede">Only assigned moderators can submit decisions; approvals and rejections are previewed as auditable writeback actions.</p>
        <div class="grid">
          <div class="metric"><strong>${humanReviewSla.status}</strong><span>SLA state</span></div>
          <div class="metric"><strong>${humanReviewSla.overdueAssignments}</strong><span>overdue assignment</span></div>
          <div class="metric"><strong>${humanReviewDecisionPreview.writeback.action.replaceAll('_', ' ')}</strong><span>next writeback</span></div>
        </div>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Top movers and true deals</h2>
        <p class="lede"><a href="/deals/today/">Open today’s ranked deal board</a> for shopper actions and ranking guardrails.</p>
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
        <h2>Daily deal actions</h2>
        <p class="lede">Deal actions combine Deal Score, confidence, and basket fit so shoppers can act without treating estimates as verified prices.</p>
        <table class="table">
          <thead><tr><th>Product</th><th>Store</th><th>Deal</th><th>Confidence</th><th>Action</th></tr></thead>
          <tbody>
            ${dailyDealActions.map((deal) => `<tr><td>${deal.product}</td><td>${deal.store}</td><td>${deal.score}</td><td><span class="status">${deal.confidence}</span></td><td>${deal.action}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Category signals</h2>
        <p class="lede">Category pages expose the product, store, and signal that drives each index movement.</p>
        <table class="table">
          <thead><tr><th>Category</th><th>Product</th><th>Store</th><th>Price</th><th>Signal</th></tr></thead>
          <tbody>
            ${categorySignals.map((signal) => `<tr><td>${signal.category}</td><td>${signal.product}</td><td>${signal.store}</td><td>${signal.price}</td><td>${signal.signal}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Weekly basket strategy</h2>
        <p class="lede">Cheapest by product across selected favorite stores. Distance is informational only and never reduces savings. <a href="/budget/forecast/">Open budget forecast</a>.</p>
        <table class="table">
          <thead><tr><th>Product</th><th>Store</th><th>Total</th></tr></thead>
          <tbody>
            ${basket.cheapestByProduct.assignments.map((item) => `<tr><td>${item.productId}</td><td>${item.storeName}</td><td>${item.lineTotal.toFixed(2)} SEK</td></tr>`).join('')}
          </tbody>
        </table>
        <h2 style="margin-top:24px">Smart swaps</h2>
        <table class="table">
          <thead><tr><th>Swap</th><th>Saves</th><th>Rule</th></tr></thead>
          <tbody>
            ${smartSwaps.map((swap) => `<tr><td>${swap.from} → ${swap.to}</td><td>${swap.savings} SEK</td><td>${swap.rule}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>Budget forecast</h2>
        <p class="lede">Forecast rows compare actual receipts, planned baskets, and month-end projection before corrective swaps are applied.</p>
        <table class="table">
          <thead><tr><th>Period</th><th>Budget</th><th>Value</th><th>Variance</th><th>Status</th></tr></thead>
          <tbody>
            ${budgetForecastRows.map((row) => `<tr><td>${row.period}</td><td>${row.budget}</td><td>${row.value}</td><td>${row.variance}</td><td><span class="status">${row.status}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>


    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Watchlist alerts</h2>
        <p class="lede"><a href="/watchlist/">Open the watchlist workbench</a> for target prices, alert state, and confidence guardrails.</p>
        <table class="table">
          <thead><tr><th>Type</th><th>Message</th></tr></thead>
          <tbody>
            ${alerts.map((alert) => `<tr><td>${alert.type.replaceAll('_', ' ')}</td><td>${alert.message}</td></tr>`).join('')}
          </tbody>
        </table>
        <h2 style="margin-top:24px">Alert preferences</h2>
        <table class="table">
          <thead><tr><th>Rule</th><th>Channel</th><th>Quiet hours</th><th>Scope</th></tr></thead>
          <tbody>
            ${alertPreferences.map((preference) => `<tr><td>${preference.rule}</td><td><span class="status">${preference.channel}</span></td><td>${preference.quietHours}</td><td>${preference.scope}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>Watchlist workbench</h2>
        <p class="lede">Target-price rows show whether an alert is ready, still watching, or held because price evidence is estimated.</p>
        <table class="table">
          <thead><tr><th>Product</th><th>Target</th><th>Current</th><th>Status</th></tr></thead>
          <tbody>
            ${watchlistRows.map((row) => `<tr><td><strong>${row.product}</strong><br><span class="footer-note">${row.trigger}</span></td><td>${row.target}</td><td>${row.current}</td><td><span class="status">${row.status}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Privacy controls</h2>
        <p class="lede">Sensitive receipt, location, and contribution settings stay visible before data is shared with household or catalog workflows.</p>
        <table class="table">
          <thead><tr><th>Setting</th><th>State</th><th>Detail</th></tr></thead>
          <tbody>
            ${privacyControls.map((control) => `<tr><td>${control.setting}</td><td><span class="status">${control.state}</span></td><td>${control.detail}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Store highlights</h2>
        <p class="lede">Store cards separate verified shelf evidence, retailer-page prices, and estimates before they affect basket decisions.</p>
        <table class="table">
          <thead><tr><th>Store</th><th>Category</th><th>Signal</th><th>Confidence</th></tr></thead>
          <tbody>
            ${storeHighlights.map((highlight) => `<tr><td>${highlight.store}</td><td>${highlight.category}</td><td>${highlight.signal}</td><td><span class="status">${highlight.confidence}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>Store comparison</h2>
        <p class="lede">The comparison view ranks favorite stores by basket cost, verified coverage, low-confidence risk, and category fit.</p>
        <table class="table">
          <thead><tr><th>Store</th><th>Basket</th><th>Coverage</th><th>Risk</th><th>Fit</th></tr></thead>
          <tbody>
            ${storeComparisons.map((store) => `<tr><td><strong>${store.store}</strong><br><span class="footer-note">${store.bestCategory}</span></td><td>${store.basketTotal} SEK</td><td>${store.verifiedCoverage}%</td><td>${store.lowConfidenceRows} low-confidence</td><td>${store.shopperFit}</td></tr>`).join('')}
          </tbody>
        </table>
        <p class="footer-note"><a href="/stores/compare/">Open full store comparison</a></p>
      </div>
    </section>

    <section class="market" style="margin-top:16px">
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

    <section class="market" style="margin-top:16px">
      <div class="card">
        <h2>Household rules</h2>
        <p class="lede">Budget shares, diet constraints, and approval rules travel with basket decisions before smart swaps are recommended.</p>
        <table class="table">
          <thead><tr><th>Member</th><th>Budget</th><th>Rule</th><th>Diet</th></tr></thead>
          <tbody>
            ${householdRules.map((member) => `<tr><td>${member.member}</td><td>${member.budgetShare}</td><td>${member.rule}</td><td>${member.dietary}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>
  </main>
`;
