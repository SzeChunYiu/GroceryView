import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Script } from 'node:vm';
import { buildStaticPages } from './pages.mjs';

describe('buildStaticPages', () => {
  it('generates proposal-required SEO and user-flow pages', async () => {
    const root = await mkdtemp(join(tmpdir(), 'groceryview-pages-'));
    try {
      const pages = await buildStaticPages(root);
      assert.deepEqual(pages.sort(), [
        'account/index.html',
        'admin/human-review/index.html',
        'ads/disclosure/index.html',
        'basket/index.html',
        'billing/status/index.html',
        'budget/forecast/index.html',
        'catalog/coverage/index.html',
        'categories/coffee/index.html',
        'deals/today/index.html',
        'household/index.html',
        'login/index.html',
        'loyalty/offers/index.html',
        'market/index.html',
        'meal-plans/index.html',
        'notifications/inbox/index.html',
        'nutrition/allergens/index.html',
        'pantry/index.html',
        'prices/confidence/index.html',
        'privacy/index.html',
        'products/coffee/index.html',
        'receipts/review/index.html',
        'retailers/freshness/index.html',
        'routes/shopping/index.html',
        'savings/ledger/index.html',
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
      assert.match(product, /Product price terminal/);
      assert.match(product, /Current best verified shelf price: 54\.90 SEK/);
      assert.match(product, /Best verified shelf/);
      assert.match(product, /Lowest visible promo/);
      assert.match(product, /52W range/);
      assert.match(product, /Evidence volume/);
      assert.match(product, /Stockholm vs local price distribution/);
      assert.match(product, /P05 48.90/);
      assert.match(product, /Median 59.90/);
      assert.match(product, /Odenplan local area/);
      assert.match(product, /Cheaper than 96% of local observations/);
      assert.match(product, /not treated as an official shelf-price comparison/);
      assert.match(product, /Trading-style price chart/);
      assert.match(product, /7D/);
      assert.match(product, /30D/);
      assert.match(product, /90D/);
      assert.match(product, /1Y/);
      assert.match(product, /All verified/);
      assert.match(product, /candlesticks, moving median/);
      assert.match(product, /weekly promo/);
      assert.match(product, /30D moving median/);
      assert.match(product, /52-week low touch/);
      assert.match(product, /ICA Kvantum Liljeholmen - 54\.90 SEK/);
      assert.match(product, /Willys Odenplan/);
      assert.match(product, /Current best comparable price/);
      assert.match(product, /Official shelf price/);
      assert.match(product, /Connected product terminal API/);
      assert.match(product, /Load live terminal numbers/);
      assert.match(product, /data-groceryview-flow="product-terminal"/);
      assert.match(product, /data-flow-action="load-product-terminal"/);
      assert.match(product, /data-flow-result="product-terminal"/);
      assert.match(product, /data-product-terminal-move/);
      assert.match(product, /data-product-terminal-range/);
      assert.match(product, /data-product-terminal-evidence/);
      assert.match(product, /data-api-session-panel/);
      assert.match(product, /name="apiBase"/);
      assert.match(product, /fetch\(apiUrl\('\/api\/products\/' \+ encodeURIComponent\(productId\) \+ '\/terminal'/);
      assert.match(product, /oneMonthMovePercent/);
      assert.match(product, /range52Week/);
      assert.match(product, /verifiedHistoryPoints/);
      assert.match(product, /1M move/);
      assert.match(product, /52W range/);
      assert.match(product, /verified history/);
      assert.match(product, /Local preview mode: connect the API session bridge before loading live product terminal numbers/);
      assert.match(product, /chart series/);
      assert.match(product, /Promo campaign/);
      assert.match(product, /Member-only/);
      assert.match(product, /Unverified \/ estimated/);
      assert.match(product, /Estimated fallback\. Never styled as an official shelf price/);
      assert.match(product, /2026-05-16 08:45 UTC/);
      assert.match(product, /Price evidence guardrails/);
      const productScript = product.match(/<script>([\s\S]*)<\/script>/);
      assert.ok(productScript);
      assert.doesNotThrow(() => new Script(productScript[1]));

      const styles = await readFile(join(process.cwd(), 'public/styles.css'), 'utf8');
      assert.match(styles, /\.quote-strip/);
      assert.match(styles, /\.distribution-board/);
      assert.match(styles, /\.histogram/);
      assert.match(styles, /\.price-terminal/);
      assert.match(styles, /\.terminal-live-panel/);
      assert.match(styles, /\.status\.verified/);
      assert.match(styles, /\.flow-panel/);

      const market = await readFile(join(root, 'market/index.html'), 'utf8');
      assert.match(market, /Stockholm Grocery Market/);
      assert.match(market, /Coffee Index/);
      assert.match(market, /Grocery mover board/);
      assert.match(market, /Biggest verified movers/);
      assert.match(market, /1M move/);
      assert.match(market, /52W position/);
      assert.match(market, /vs Stockholm median/);
      assert.match(market, /verified observations/);
      assert.match(market, /Estimated rows cannot top the mover board/);
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

      const retailerFreshness = await readFile(join(root, 'retailers/freshness/index.html'), 'utf8');
      assert.match(retailerFreshness, /Retailer freshness monitor/);
      assert.match(retailerFreshness, /Freshness by retailer/);
      assert.match(retailerFreshness, /Coop/);
      assert.match(retailerFreshness, /Pause new alerts/);
      assert.match(retailerFreshness, /Stale retailer-page rows cannot trigger household notifications/);

      const shoppingRoute = await readFile(join(root, 'routes/shopping/index.html'), 'utf8');
      assert.match(shoppingRoute, /Shopping route planner/);
      assert.match(shoppingRoute, /Ordered stops/);
      assert.match(shoppingRoute, /Lidl Sveavägen/);
      assert.match(shoppingRoute, /Route time can reorder stops but cannot change product deal ranking/);
      assert.match(shoppingRoute, /Unverified prices cannot justify an extra route stop/);

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

      const savingsLedger = await readFile(join(root, 'savings/ledger/index.html'), 'utf8');
      assert.match(savingsLedger, /Savings ledger/);
      assert.match(savingsLedger, /Ledger entries/);
      assert.match(savingsLedger, /Willys coffee promo/);
      assert.match(savingsLedger, /Only verified receipts can move forecast savings into realized savings/);
      assert.match(savingsLedger, /Low-confidence prices cannot increase savings totals/);

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

      const adDisclosure = await readFile(join(root, 'ads/disclosure/index.html'), 'utf8');
      assert.match(adDisclosure, /Ad disclosure center/);
      assert.match(adDisclosure, /Disclosure states/);
      assert.match(adDisclosure, /Sponsored banner/);
      assert.match(adDisclosure, /Sponsored placements cannot change Deal Score/);
      assert.match(adDisclosure, /Advertiser payloads stay aggregated and never include raw receipts/);

      const billingStatus = await readFile(join(root, 'billing/status/index.html'), 'utf8');
      assert.match(billingStatus, /Billing status/);
      assert.match(billingStatus, /Entitlement state/);
      assert.match(billingStatus, /premium_monthly/);
      assert.match(billingStatus, /Missing or past-due entitlements keep checkout required/);
      assert.match(billingStatus, /Provider updates must be newer than stored entitlement state/);

      const loyaltyOffers = await readFile(join(root, 'loyalty/offers/index.html'), 'utf8');
      assert.match(loyaltyOffers, /Loyalty offer tracker/);
      assert.match(loyaltyOffers, /Member offer queue/);
      assert.match(loyaltyOffers, /ICA Stammis linked/);
      assert.match(loyaltyOffers, /Clip coupon before checkout/);
      assert.match(loyaltyOffers, /Member-only savings never overwrite verified public shelf evidence/);

      const mealPlans = await readFile(join(root, 'meal-plans/index.html'), 'utf8');
      assert.match(mealPlans, /Meal plan builder/);
      assert.match(mealPlans, /Weekly meal plan/);
      assert.match(mealPlans, /Tuesday pasta bake/);
      assert.match(mealPlans, /Needs coffee promo confirmation/);
      assert.match(mealPlans, /Estimated produce prices cannot reduce the weekly meal budget/);

      const pantry = await readFile(join(root, 'pantry/index.html'), 'utf8');
      assert.match(pantry, /Pantry inventory/);
      assert.match(pantry, /Inventory signals/);
      assert.match(pantry, /Rice 1kg/);
      assert.match(pantry, /Use before expiry/);
      assert.match(pantry, /Meal plans consume expiring pantry items before adding duplicate basket lines/);

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

      const nutritionAllergens = await readFile(join(root, 'nutrition/allergens/index.html'), 'utf8');
      assert.match(nutritionAllergens, /Nutrition and allergen review/);
      assert.match(nutritionAllergens, /Diet review queue/);
      assert.match(nutritionAllergens, /Peanut granola/);
      assert.match(nutritionAllergens, /Blocked allergens outrank price savings and Deal Score/);
      assert.match(nutritionAllergens, /Diet conflicts stop meal-plan and basket updates until reviewed/);

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
      assert.match(scanner, /fetch\(apiUrl\('\/api\/scans\/upload-url/);
      assert.match(scanner, /fetch\(ticket\.uploadUrl/);
      assert.match(scanner, /method: 'PUT'/);
      assert.match(scanner, /body: filePayload/);
      assert.match(scanner, /fetch\(apiUrl\('\/api\/scans\/process/);
      assert.match(scanner, /payloadUri/);
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
      assert.match(privacy, /Request fulfillment deadlines/);
      assert.match(privacy, /Control states/);
      assert.match(privacy, /Receipt images/);
      assert.match(privacy, /District only/);
      assert.match(privacy, /data-groceryview-flow="privacy"/);
      assert.match(privacy, /data-flow-action="download-export"/);
      assert.match(privacy, /data-flow-action="check-fulfillment"/);
      assert.match(privacy, /data-flow-result="privacy"/);
      assert.match(privacy, /fetch\(apiUrl\('\/api\/privacy\/export/);
      assert.match(privacy, /fetch\(apiUrl\('\/api\/privacy\/deletion-plan/);
      assert.match(privacy, /fetch\(apiUrl\('\/api\/privacy\/request-fulfillment/);
      assert.match(privacy, /overdueRequestIds/);
      assert.match(privacy, /dueSoonRequestIds/);

      for (const pagePath of ['login/index.html', 'account/index.html', 'basket/index.html', 'scanner/index.html', 'privacy/index.html', 'products/coffee/index.html']) {
        const html = await readFile(join(root, pagePath), 'utf8');
        assert.match(html, /window\.GroceryViewFlowActions/);
        assert.doesNotMatch(html, /innerHTML\s*=/);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
