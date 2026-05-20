import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStaticPages } from './pages.mjs';

describe('buildStaticPages', () => {
  it('generates proposal-required SEO and user-flow pages', async () => {
    const root = await mkdtemp(join(tmpdir(), 'groceryview-pages-'));
    try {
      const pages = await buildStaticPages(root);
      assert.deepEqual(pages.sort(), [
        'account/index.html',
        'admin/human-review/index.html',
        'basket/index.html',
        'billing/status/index.html',
        'budget/forecast/index.html',
        'catalog/coverage/index.html',
        'categories/coffee/index.html',
        'deals/today/index.html',
        'household/index.html',
        'login/index.html',
        'market/index.html',
        'notifications/inbox/index.html',
        'prices/confidence/index.html',
        'privacy/index.html',
        'products/coffee/index.html',
        'receipts/review/index.html',
        'savings/smart-swaps/index.html',
        'scanner/index.html',
        'stores/compare/index.html',
        'stores/map/index.html',
        'stores/willys-odenplan/index.html',
        'watchlist/index.html'
      ]);

      const product = await readFile(join(root, 'products/coffee/index.html'), 'utf8');
      assert.match(product, /ZOEGAS-COFFEE-450G/);
      assert.match(product, /Deal Score/);
      assert.match(product, /Price chart/);
      assert.match(product, /7D/);
      assert.match(product, /30D/);
      assert.match(product, /90D/);
      assert.match(product, /1Y/);
      assert.match(product, /Multi-store coffee price history/);
      assert.match(product, /promo marker/);
      assert.match(product, /stroke-dasharray="8 8"/);
      assert.match(product, /Willys Odenplan/);
      assert.match(product, /ICA Kvantum Torsplan/);
      assert.match(product, /Coop Medborgarplatsen/);
      assert.match(product, /Estimated observations need review/);
      assert.match(product, /Current store prices/);
      assert.match(product, /Unit price/);
      assert.match(product, /promotion/);
      assert.match(product, /Member label: Stammis price/);
      assert.match(product, /94% verified retailer page/);
      assert.match(product, /2026-05-20 06:00/);
      assert.match(product, /Unverified estimate: do not treat as official shelf price/);
      assert.match(product, /excluded from official shelf-price claims/);

      const market = await readFile(join(root, 'market/index.html'), 'utf8');
      assert.match(market, /Stockholm Grocery Market/);
      assert.match(market, /Coffee Index/);
      assert.match(market, /Brand-tier indices/);
      assert.match(market, /Private Label Index/);
      assert.match(market, /Premium Brand Index/);
      assert.match(market, /private-label savings vs national brands/);

      const catalogCoverage = await readFile(join(root, 'catalog/coverage/index.html'), 'utf8');
      assert.match(catalogCoverage, /Catalog coverage dashboard/);
      assert.match(catalogCoverage, /Coverage by category/);
      assert.match(catalogCoverage, /Backfill member prices/);
      assert.match(catalogCoverage, /Receipt photos need human review before catalog writeback/);
      assert.match(catalogCoverage, /Products without unit prices cannot rank category savings/);

      const priceConfidence = await readFile(join(root, 'prices/confidence/index.html'), 'utf8');
      assert.match(priceConfidence, /Price confidence guide/);
      assert.match(priceConfidence, /Confidence labels/);
      assert.match(priceConfidence, /Verified shelf/);
      assert.match(priceConfidence, /Estimated and low-confidence rows are excluded/);
      assert.match(priceConfidence, /Only verified or fresh retailer-page prices can alert/);

      const deals = await readFile(join(root, 'deals/today/index.html'), 'utf8');
      assert.match(deals, /Today’s best grocery deals/);
      assert.match(deals, /Ranked deal actions/);
      assert.match(deals, /Deal Score/);
      assert.match(deals, /Ads excluded from ranking/);
      assert.match(deals, /Estimated rows held back/);

      const smartSwapsPage = await readFile(join(root, 'savings/smart-swaps/index.html'), 'utf8');
      assert.match(smartSwapsPage, /Smart grocery swaps/);
      assert.match(smartSwapsPage, /Swap candidates/);
      assert.match(smartSwapsPage, /Same roast category/);
      assert.match(smartSwapsPage, /Estimated swap prices cannot reduce forecast spend/);
      assert.match(smartSwapsPage, /Dietary restrictions outrank savings/);

      const store = await readFile(join(root, 'stores/willys-odenplan/index.html'), 'utf8');
      assert.match(store, /Store highlights/);
      assert.match(store, /Verified shelf/);
      assert.match(store, /Watchlist only/);

      const storeComparison = await readFile(join(root, 'stores/compare/index.html'), 'utf8');
      assert.match(storeComparison, /Compare Stockholm stores/);
      assert.match(storeComparison, /Favorite-store comparison/);
      assert.match(storeComparison, /Verified coverage/);
      assert.match(storeComparison, /Low-confidence rows/);
      assert.match(storeComparison, /Low-confidence receipt rows stay out of Deal Score/);

      const storeMap = await readFile(join(root, 'stores/map/index.html'), 'utf8');
      assert.match(storeMap, /Stockholm store map/);
      assert.match(storeMap, /District store list/);
      assert.match(storeMap, /Willys Odenplan/);
      assert.match(storeMap, /No travel-time penalty in Deal Score/);
      assert.match(storeMap, /Pickup notes separate from prices/);

      const category = await readFile(join(root, 'categories/coffee/index.html'), 'utf8');
      assert.match(category, /Category signals/);
      assert.match(category, /Private-label swap candidate/);
      assert.match(category, /Arvid Nordquist/);

      const login = await readFile(join(root, 'login/index.html'), 'utf8');
      assert.match(login, /Sign in to GroceryView/);
      assert.match(login, /Passkey or magic link/);
      assert.match(login, /data-groceryview-flow="login"/);
      assert.match(login, /name="email"/);
      assert.match(login, /data-api-session-panel/);
      assert.match(login, /name="apiBase"/);
      assert.match(login, /name="apiUserId"/);
      assert.match(login, /name="apiBearerToken"/);
      assert.match(login, /data-flow-result="login"/);
      assert.match(login, /sessionStorage\.setItem\('groceryview\.bearerToken'/);
      assert.match(login, /sessionStorage\.getItem\('groceryview\.bearerToken'\)/);
      assert.match(login, /localStorage\.getItem\('groceryview\.apiBase'\)/);
      assert.match(login, /fetch\(apiUrl\('\/api\/auth\/session/);
      assert.match(login, /provider: 'magic_link'/);
      assert.doesNotMatch(login, /localStorage\.setItem\('groceryview\.bearerToken'/);

      const account = await readFile(join(root, 'account/index.html'), 'utf8');
      assert.match(account, /Alert preferences/);
      assert.match(account, /Coffee below 50 SEK/);
      assert.match(account, /Daily digest/);
      assert.match(account, /Subscription access/);
      assert.match(account, /Premium access is active/);
      assert.match(account, /\/api\/account\/subscription-access/);
      assert.match(account, /Manage subscription/);
      assert.match(account, /data-groceryview-flow="account"/);
      assert.match(account, /data-flow-action="toggle-alert"/);
      assert.match(account, /data-flow-result="account"/);
      assert.match(account, /fetch\(apiUrl\('\/api\/watchlist/);
      assert.match(account, /fetch\(apiUrl\('\/api\/account\/subscription-access/);
      assert.match(account, /authorization: 'Bearer '/);

      const billingStatus = await readFile(join(root, 'billing/status/index.html'), 'utf8');
      assert.match(billingStatus, /Billing status/);
      assert.match(billingStatus, /Entitlement state/);
      assert.match(billingStatus, /premium_monthly/);
      assert.match(billingStatus, /Missing or past-due entitlements keep checkout required/);
      assert.match(billingStatus, /Provider updates must be newer than stored entitlement state/);

      const watchlist = await readFile(join(root, 'watchlist/index.html'), 'utf8');
      assert.match(watchlist, /Price watchlist workbench/);
      assert.match(watchlist, /Tracked items/);
      assert.match(watchlist, /Ready for push/);
      assert.match(watchlist, /Held for review/);
      assert.match(watchlist, /Estimated prices cannot trigger household notifications/);

      const notificationInbox = await readFile(join(root, 'notifications/inbox/index.html'), 'utf8');
      assert.match(notificationInbox, /Grocery alert inbox/);
      assert.match(notificationInbox, /Alert delivery queue/);
      assert.match(notificationInbox, /Quiet hours 21:00-07:00/);
      assert.match(notificationInbox, /Provider token invalid/);
      assert.match(notificationInbox, /Invalid tokens stop future sends/);

      const household = await readFile(join(root, 'household/index.html'), 'utf8');
      assert.match(household, /Shared household basket/);
      assert.match(household, /member attribution/);
      assert.match(household, /Household rules/);
      assert.match(household, /Owner approval over 400 SEK/);
      assert.match(household, /No pork, nut alert/);
      assert.match(household, /data-groceryview-flow="household"/);
      assert.match(household, /name="approvalLimit"/);
      assert.match(household, /fetch\(apiUrl\('\/api\/households\/current/);
      assert.match(household, /approvalPolicy/);
      assert.match(household, /data-flow-result="household"/);

      const basket = await readFile(join(root, 'basket/index.html'), 'utf8');
      assert.match(basket, /Basket lines/);
      assert.match(basket, /Lidl Sveavägen/);
      assert.match(basket, /Smart swaps/);
      assert.match(basket, /data-groceryview-flow="basket"/);
      assert.match(basket, /name="coffeeQuantity"/);
      assert.match(basket, /data-flow-result="basket"/);
      assert.match(basket, /Save basket to API/);
      assert.match(basket, /\/api\/users\/' \+ encodeURIComponent\(config\.userId\) \+ '\/favorite-stores/);
      assert.match(basket, /fetch\(apiUrl\('\/api\/basket\/items/);
      assert.match(basket, /fetch\(apiUrl\('\/api\/basket\/compare/);

      const budgetForecast = await readFile(join(root, 'budget/forecast/index.html'), 'utf8');
      assert.match(budgetForecast, /Grocery budget forecast/);
      assert.match(budgetForecast, /Forecast ledger/);
      assert.match(budgetForecast, /Month-end projection/);
      assert.match(budgetForecast, /Correction plan/);
      assert.match(budgetForecast, /Needs review before forecast credit/);

      const scanner = await readFile(join(root, 'scanner/index.html'), 'utf8');
      assert.match(scanner, /Barcode and receipt scanner/);
      assert.match(scanner, /manual review queue/);
      assert.match(scanner, /Coop Farsta receipt/);
      assert.match(scanner, /Route to product matching queue/);
      assert.match(scanner, /data-groceryview-flow="scanner"/);
      assert.match(scanner, /accept="image\/\*"/);
      assert.match(scanner, /data-flow-action="route-review"/);
      assert.match(scanner, /fetch\(apiUrl\('\/api\/scans\/process/);
      assert.match(scanner, /private-upload:\/\/scanner-preview/);

      const receiptReview = await readFile(join(root, 'receipts/review/index.html'), 'utf8');
      assert.match(receiptReview, /Receipt review desk/);
      assert.match(receiptReview, /Line-item decisions/);
      assert.match(receiptReview, /Post to weekly actuals/);
      assert.match(receiptReview, /Route to human review/);
      assert.match(receiptReview, /Cannot update catalog or Deal Score/);

      const humanReview = await readFile(join(root, 'admin/human-review/index.html'), 'utf8');
      assert.match(humanReview, /Human review operations/);
      assert.match(humanReview, /Moderator assignments/);
      assert.match(humanReview, /SLA breached/);
      assert.match(humanReview, /Approve product match/);
      assert.match(humanReview, /approve_product_match/);

      const privacy = await readFile(join(root, 'privacy/index.html'), 'utf8');
      assert.match(privacy, /Export or delete your data/);
      assert.match(privacy, /advertiser payloads stay aggregated/);
      assert.match(privacy, /Control states/);
      assert.match(privacy, /Receipt images/);
      assert.match(privacy, /District only/);
      assert.match(privacy, /data-groceryview-flow="privacy"/);
      assert.match(privacy, /data-flow-action="download-export"/);
      assert.match(privacy, /data-flow-result="privacy"/);
      assert.match(privacy, /fetch\(apiUrl\('\/api\/privacy\/export/);
      assert.match(privacy, /fetch\(apiUrl\('\/api\/privacy\/deletion-plan/);

      for (const pagePath of ['login/index.html', 'account/index.html', 'basket/index.html', 'scanner/index.html', 'privacy/index.html']) {
        const html = await readFile(join(root, pagePath), 'utf8');
        assert.match(html, /window\.GroceryViewFlowActions/);
        assert.doesNotMatch(html, /innerHTML\s*=/);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
