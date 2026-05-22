import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appFiles = [
  'src/app/page.tsx',
  'src/app/products/page.tsx',
  'src/app/products/[slug]/page.tsx',
  'src/app/stores/page.tsx',
  'src/app/stores/[slug]/page.tsx',
  'src/app/categories/page.tsx',
  'src/app/categories/[slug]/page.tsx',
  'src/app/compare/page.tsx',
  'src/app/catalogue-savings/page.tsx',
  'src/app/chain-index/page.tsx',
  'src/app/chain-coverage/page.tsx',
  'src/app/map/page.tsx',
  'src/app/data-sources/page.tsx',
  'src/app/store-coverage/page.tsx',
  'src/app/openprices-depth/page.tsx',
  'src/components/market-shell.tsx',
  'src/components/data-ui.tsx',
  'src/lib/verified-data.ts'
];

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('verified-data UI', () => {
  it('keeps core routes backed by generated verified datasets', async () => {
    for (const file of appFiles) assert.ok((await read(file)).length > 0, `${file} should not be empty`);
    const verified = await read('src/lib/verified-data.ts');
    assert.match(verified, /axfoodProducts/);
    assert.match(verified, /pricedProducts/);
    assert.match(verified, /osmStores/);
    assert.match(verified, /matchedChainProducts/);
    assert.match(verified, /sourceCoverage/);
  });

  it('removes rendered dependencies on old demo and sample drivers', async () => {
    const renderedSources = await Promise.all(appFiles.map(read));
    const joined = renderedSources.join('\n');
    assert.doesNotMatch(joined, /@\/lib\/demo-data/);
    assert.doesNotMatch(joined, /@\/components\/sample-data/);
    assert.doesNotMatch(joined, /products \} from ['"]@\/lib\/demo-data/);
  });

  it('makes unavailable private features fail closed instead of showing fabricated rows', async () => {
    const featureRoutes = ['scanner','household','coupon-stacks','price-reports','shopping-trips','privacy'];
    const verified = await read('src/lib/verified-data.ts');
    assert.match(verified, /privateFeatureCopy/);
    assert.match(verified, /verifiedSurface/);
    assert.match(verified, /Gate before launch|gatedBy/);
    for (const route of featureRoutes) {
      const source = await read(`src/app/${route}/page.tsx`);
      assert.match(source, /NoVerifiedData/);
      assert.match(source, /route=\{route\}/);
      assert.match(source, /static snapshot/);
      assert.doesNotMatch(source, /@\/lib\/demo-data/);
      assert.doesNotMatch(source, /@\/components\/sample-data/);
      assert.doesNotMatch(source, /receiptReviewDesk|receiptReviewQueue/);
    }
    const profile = await read('src/app/account/profile/page.tsx');
    assert.match(profile, /route="account-profile"/);
    assert.doesNotMatch(profile, /@\/lib\/demo-data/);
    assert.doesNotMatch(profile, /accountProfile/);
    assert.match(verified, /'account-profile'/);
    const login = await read('src/app/login/page.tsx');
    assert.doesNotMatch(login, /placeholder=/);
    assert.match(login, /No test account/);
    assert.match(login, /Session source/);
    assert.match(login, /production auth provider returns a verified session/);
    assert.match(login, /source timestamps from authenticated storage/);
  });



  it('surfaces the bookmarklet import/export contract and static asset on the basket ideas route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/basket-ideas/page.tsx');
    const bookmarklet = await read('public/bookmarklets/groceryview-basket-import.js');

    assert.match(verified, /export const basketImportExportContract = /);
    assert.match(verified, /\/api\/basket\/import-export/);
    assert.match(verified, /bookmarklet/);
    assert.match(verified, /browser_extension/);
    assert.match(route, /basketImportExportContract/);
    assert.match(route, /Bookmarklet import\/export/);
    assert.match(route, /explicit shopper consent/);
    assert.match(bookmarklet, /GroceryView basket import/);
    assert.match(bookmarklet, /consentGranted/);
    assert.match(bookmarklet, /capturedLines/);
    assert.match(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces the account-bound basket import review contract on the basket ideas route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/basket-ideas/page.tsx');

    assert.match(verified, /export const basketImportReviewContract = /);
    assert.match(verified, /\/api\/basket\/import-review/);
    assert.match(route, /basketImportReviewContract/);
    assert.match(route, /Account-bound import review/);
    assert.match(route, /unmatched retailer rows stay out of the basket/i);
    assert.match(route, /signed-in shopper accepts/i);
    assert.match(route, /PostgreSQL-backed runtime repository/i);
    assert.doesNotMatch(route, /NoVerifiedData/);
    assert.match(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });


  it('surfaces account-bound saved baskets and favorite stores on the account route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const account = await read('src/app/account/page.tsx');
    const server = await read('../../packages/server/src/index.ts');
    const schema = await read('../../db/schema.sql');

    assert.match(verified, /export const accountSavedShoppingContract = /);
    assert.match(verified, /\/api\/users\/\{userId\}\/favorite-stores/);
    assert.match(verified, /weekly_baskets/);
    assert.match(verified, /basket_items/);
    assert.match(account, /accountSavedShoppingContract/);
    assert.match(account, /Saved baskets & favorite stores/);
    assert.match(account, /signed-in shoppers only/i);
    assert.match(account, /favorite stores/);
    assert.match(account, /weekly_baskets/);
    assert.match(account, /basket_items/);
    assert.match(server, /favorite-stores/);
    assert.match(schema, /create table if not exists weekly_baskets/);
    assert.match(schema, /create table if not exists basket_items/);
    assert.doesNotMatch(account, /NoVerifiedData/);
    assert.doesNotMatch(account, /@\/lib\/demo-data/);
  });

  it('ships account mutation controls for signed-in favorite stores and basket items', async () => {
    const account = await read('src/app/account/page.tsx');
    const actions = await read('src/components/account-mutation-actions.tsx');

    assert.match(account, /AccountMutationActions/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/users\/\$\{encodeURIComponent\(userId\)\}\/favorite-stores/);
    assert.match(actions, /method: 'POST'/);
    assert.match(actions, /method: 'DELETE'/);
    assert.match(actions, /\/api\/basket\/items/);
    assert.match(actions, /productId/);
    assert.match(actions, /quantity/);
    assert.match(actions, /Compare saved basket/);
    assert.match(actions, /\/api\/basket\/compare/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous mutations/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
  });


  it('surfaces the retailer handoff support matrix contract on the basket ideas route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/basket-ideas/page.tsx');

    assert.match(verified, /export const retailerHandoffContract = /);
    assert.match(verified, /\/api\/basket\/handoff/);
    assert.match(route, /retailerHandoffContract/);
    assert.match(route, /Retailer handoff support matrix/);
    assert.match(route, /basket transfer/);
    assert.match(route, /checkout confirmation/);
    assert.doesNotMatch(route, /NoVerifiedData/);
    assert.match(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces the secure retailer basket transfer preflight contract on the basket ideas route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/basket-ideas/page.tsx');

    assert.match(verified, /export const retailerBasketTransferContract = /);
    assert.match(verified, /\/api\/basket\/transfer/);
    assert.match(route, /retailerBasketTransferContract/);
    assert.match(route, /Secure basket transfer preflight/);
    assert.match(route, /block unless capability is verified/i);
    assert.match(route, /not checkout confirmation/i);
    assert.doesNotMatch(route, /NoVerifiedData/);
    assert.match(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });


  it('surfaces the basket trip-cost optimizer contract on the shopping trips route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/shopping-trips/page.tsx');

    assert.match(verified, /export const basketTripCostContract = /);
    assert.match(verified, /\/api\/basket\/trip-cost/);
    assert.match(route, /basketTripCostContract/);
    assert.match(route, /Basket \+ trip cost optimizer/);
    assert.match(route, /travel-cost optimizer/);
    assert.match(route, /NoVerifiedData/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces elderly nearest-store and delivery options without private location data', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/shopping-trips/page.tsx');

    assert.match(verified, /export const elderlyNearestDeliveryPlanner = /);
    assert.match(route, /elderlyNearestDeliveryPlanner/);
    assert.match(route, /Nearest-store \+ delivery options/);
    assert.match(route, /mobilitySupport/);
    assert.match(route, /no private home location/);
    assert.match(route, /NoVerifiedData/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
  });

  it('surfaces budget cheapest-store-for-my-list routing without private location data', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/shopping-trips/page.tsx');

    assert.match(verified, /export const budgetCheapestStoreRoutingPlanner = /);
    assert.match(route, /budgetCheapestStoreRoutingPlanner/);
    assert.match(route, /Cheapest-store-for-my-list routing/);
    assert.match(route, /routeRankInputs/);
    assert.match(route, /storeListGuardrails/);
    assert.match(route, /NoVerifiedData/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces fulfillment slot evidence guardrails on the shopping trips route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/shopping-trips/page.tsx');

    assert.match(verified, /export const fulfillmentSlotsContract = /);
    assert.match(verified, /\/api\/basket\/fulfillment-slots/);
    assert.match(route, /fulfillmentSlotsContract/);
    assert.match(route, /Delivery and pickup slot evidence/);
    assert.match(route, /not retailer reservations/);
    assert.match(route, /retailer checkout/);
    assert.match(route, /NoVerifiedData/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces the recurring basket digest product contract on the weekly basket route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/weekly-basket/page.tsx');

    assert.match(verified, /export const recurringBasketDigestContract = /);
    assert.match(verified, /\/api\/basket\/recurring-digest/);
    assert.match(route, /recurringBasketDigestContract/);
    assert.match(route, /Recurring basket digest/);
    assert.match(route, /Changed since last shop/);
    assert.match(route, /missing-price blockers/);
    assert.doesNotMatch(route, /NoVerifiedData/);
    assert.match(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces a family bulk unit-price comparison from visible package rows', async () => {
    const source = await read('src/app/weekly-basket/page.tsx');
    assert.match(source, /familyBulkUnitPriceComparison/);
    assert.match(source, /Family-pack unit prices/);
    assert.match(source, /unitSavingsPercent/);
    assert.match(source, /bulkUnitPrice/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a budget stretch-krona basket optimizer using real basket strategy output', async () => {
    const source = await read('src/app/weekly-basket/page.tsx');
    const demo = await read('src/lib/demo-data.ts');
    assert.match(demo, /budgetStretchKronaOptimizer/);
    assert.match(demo, /compareBasketStrategies/);
    assert.match(source, /budgetStretchKronaOptimizer/);
    assert.match(source, /Stretch your krona optimizer/);
    assert.match(source, /kronaSavedPerExtraStore/);
    assert.match(source, /missingPriceBlockers/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });






  it('surfaces watchlist alerts and notification planning using the real core outputs', async () => {
    const source = await read('src/app/watchlist/page.tsx');
    assert.match(source, /watchlistAlertBoard/);
    assert.match(source, /buildWatchlistAlerts/);
    assert.match(source, /planNotifications/);
    assert.match(source, /plannedNotifications/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces baby and diaper price tracking alerts using the real watchlist engine', async () => {
    const source = await read('src/app/watchlist/page.tsx');
    assert.match(source, /babyDiaperPriceTracker/);
    assert.match(source, /buildWatchlistAlerts/);
    assert.match(source, /Baby & diaper price tracking/);
    assert.match(source, /diaperUnitPrice/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces budget essentials price-drop alerts using the real watchlist engine', async () => {
    const source = await read('src/app/watchlist/page.tsx');
    const demo = await read('src/lib/demo-data.ts');
    assert.match(demo, /budgetEssentialsPriceDropAlerts/);
    assert.match(demo, /buildWatchlistAlerts/);
    assert.match(source, /budgetEssentialsPriceDropAlerts/);
    assert.match(source, /Essentials price-drop alerts/);
    assert.match(source, /essentialCategory/);
    assert.match(source, /weeklyNeed/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a student cheapest-basics board using real basket comparison output', async () => {
    const source = await read('src/app/basket-ideas/page.tsx');
    assert.match(source, /studentBasicsBoard/);
    assert.match(source, /compareBasketStrategies/);
    assert.match(source, /summarizeStoreBasketCoverage/);
    assert.match(source, /cheapestByProduct/);
    assert.match(source, /Student staples/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces deal-based meals on the meal planner route using the real core meal output', async () => {
    const source = await read('src/app/meal-planner/page.tsx');
    assert.match(source, /dealBasedMeals/);
    assert.match(source, /suggestDealBasedMeals/);
    assert.match(source, /estimatedCostPerServing/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces student recipes built from deals using real core meal output', async () => {
    const source = await read('src/app/meal-planner/page.tsx');
    assert.match(source, /studentDealRecipes/);
    assert.match(source, /suggestDealBasedMeals/);
    assert.match(source, /Student deal recipes/);
    assert.match(source, /cookSteps/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a family weekly meal planner from visible deals', async () => {
    const source = await read('src/app/meal-planner/page.tsx');
    assert.match(source, /familyMealPlannerFromDeals/);
    assert.match(source, /suggestDealBasedMeals/);
    assert.match(source, /Family weekly meal planner/);
    assert.match(source, /lunchboxLeftovers/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces pantry replenishment on the pantry planner route using the real core pantry plan output', async () => {
    const source = await read('src/app/pantry-planner/page.tsx');
    assert.match(source, /pantryReplenishmentPlan/);
    assert.match(source, /planPantryReplenishment/);
    assert.match(source, /replenishment/);
    assert.match(source, /expiringSoonProductIds/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces expiry deal radar on the deals route using the real core radar output', async () => {
    const source = await read('src/app/deals/page.tsx');
    assert.match(source, /expiryDealRadar/);
    assert.match(source, /buildExpiryDealRadar/);
    assert.match(source, /radarScore/);
    assert.match(source, /staleReportIds/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a student single-portion deal finder using real deal ranking output', async () => {
    const source = await read('src/app/deals/page.tsx');
    assert.match(source, /singlePortionDealFinder/);
    assert.match(source, /rankDealOpportunities/);
    assert.match(source, /Single-portion deals/);
    assert.match(source, /portionLabel/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a kids snack and lunchbox deal feed using real deal ranking output', async () => {
    const source = await read('src/app/deals/page.tsx');
    assert.match(source, /kidsSnackLunchboxDeals/);
    assert.match(source, /rankDealOpportunities/);
    assert.match(source, /Kids snack & lunchbox deals/);
    assert.match(source, /lunchboxFit/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces nutrition per krona on the nutrition value route using the real core ranking output', async () => {
    const source = await read('src/app/nutrition-value/page.tsx');
    assert.match(source, /nutritionPerKrona/);
    assert.match(source, /rankNutritionPerKrona/);
    assert.match(source, /valuePer10Sek/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a health macro optimizer using real nutrition rankings', async () => {
    const source = await read('src/app/nutrition-value/page.tsx');
    const demo = await read('src/lib/demo-data.ts');
    assert.match(demo, /healthMacroOptimizer/);
    assert.match(demo, /rankNutritionPerKrona/);
    assert.match(source, /healthMacroOptimizer/);
    assert.match(source, /Macro optimizer/);
    assert.match(source, /macroTargets/);
    assert.match(source, /topProtein/);
    assert.match(source, /topFiber/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a halal kosher and ethnic aisle finder from verified category rows', async () => {
    const source = await read('src/app/categories/page.tsx');
    const verified = await read('src/lib/verified-data.ts');
    assert.match(verified, /export const immigrantAisleFinder/);
    assert.match(source, /immigrantAisleFinder/);
    assert.match(source, /Halal, kosher & ethnic aisle finder/);
    assert.match(source, /dietaryTags/);
    assert.match(source, /verifiedCategorySlug/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces immigrant familiar-brand search from verified product rows', async () => {
    const source = await read('src/app/products/page.tsx');
    const verified = await read('src/lib/verified-data.ts');
    assert.match(verified, /export const immigrantFamiliarBrandSearch/);
    assert.match(source, /immigrantFamiliarBrandSearch/);
    assert.match(source, /Familiar-brand search/);
    assert.match(source, /reportedBrand/);
    assert.match(source, /verifiedProductSlug/);
    assert.match(source, /searchTokens/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces immigrant image-first browsing from verified product images', async () => {
    const source = await read('src/app/products/page.tsx');
    const verified = await read('src/lib/verified-data.ts');
    assert.match(verified, /export const immigrantImageFirstBrowsing/);
    assert.match(source, /immigrantImageFirstBrowsing/);
    assert.match(source, /Image-first browsing/);
    assert.match(source, /imageUrl/);
    assert.match(source, /visualAlt/);
    assert.match(source, /verifiedProductSlug/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces immigrant multilingual UI access in the public shell', async () => {
    const source = await read('src/components/market-shell.tsx');
    assert.match(source, /immigrantMultilingualUi/);
    assert.match(source, /Multilingual UI starter/);
    assert.match(source, /languageOptions/);
    assert.match(source, /Arabic/);
    assert.match(source, /Somali/);
    assert.match(source, /No machine-translated prices/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces an elderly fixed-income monthly budget using real budget summaries', async () => {
    const source = await read('src/app/savings-dashboard/page.tsx');
    const demo = await read('src/lib/demo-data.ts');
    assert.match(source, /elderlyFixedIncomeBudgetTracker/);
    assert.match(source, /Fixed-income monthly budget/);
    assert.match(source, /monthlyRemainingActual/);
    assert.match(source, /pensionEnvelope/);
    assert.match(demo, /summarizeBudget/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces elderly staples price stability using real price-history summaries', async () => {
    const source = await read('src/app/savings-dashboard/page.tsx');
    const demo = await read('src/lib/demo-data.ts');
    assert.match(source, /elderlyStaplesStabilityTracker/);
    assert.match(source, /Staples price stability/);
    assert.match(source, /stabilityBand/);
    assert.match(demo, /summarizePriceHistory/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces personal grocery inflation on the savings dashboard using the real core-derived driver output', async () => {
    const source = await read('src/app/savings-dashboard/page.tsx');
    assert.match(source, /personalGroceryInflation/);
    assert.match(source, /inflationPercent/);
    assert.match(source, /itemContributions/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a student weekly budget tracker using the real core budget summary', async () => {
    const source = await read('src/app/savings-dashboard/page.tsx');
    assert.match(source, /studentWeeklyBudgetTracker/);
    assert.match(source, /summarizeBudget/);
    assert.match(source, /Weekly student budget/);
    assert.match(source, /weeklyRemainingAfterEstimate/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces an elderly large-text high-contrast mode in the public shell', async () => {
    const source = await read('src/components/market-shell.tsx');
    assert.match(source, /elderlyAccessibilityMode/);
    assert.match(source, /Large-text high-contrast mode/);
    assert.match(source, /contrast-safe/);
    assert.match(source, /text-2xl/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('uses a readable global shell and provenance surfaces across the app', async () => {
    const globals = await read('src/app/globals.css');
    const nav = await read('src/components/app-nav.tsx');
    const shell = await read('src/components/market-shell.tsx');
    const page = await read('src/app/page.tsx');
    const seo = await read('src/lib/seo.ts');
    const homeMetadataSource = `${page}
${seo}`;
    assert.match(globals, /radial-gradient/);
    assert.match(nav, /Verified grocery intelligence/);
    assert.match(shell, /zero placeholder rows/);
    assert.match(shell, /Data provenance|SourceCoverage/);
    assert.match(shell, /Verified product universe/);
    assert.match(shell, /ProductPriceCards/);
    assert.match(shell, /homepageAdaptiveProductCards/);
    assert.match(shell, /Freshness board/);
    assert.match(shell, /sourceCoverage\.map/);
    assert.match(shell, /Claim boundaries/);
    assert.match(shell, /homepageClaimLedger\.map/);
    assert.match(shell, /sourceClaimLedger\.slice/);
    assert.match(shell, /Supported: \{source\.allowedClaim\}/);
    assert.match(shell, /Blocked: \{source\.blockedClaim\}/);
    assert.match(shell, /Category freshness strip/);
    assert.match(shell, /category\.latestObservation/);
    assert.match(shell, /Feature readiness queue/);
    assert.match(shell, /featureReadinessQueue\.map/);
    assert.match(shell, /privateFeatureCopy/);
    assert.match(shell, /Private evidence next steps/);
    assert.match(shell, /copy\.nextStep/);
    assert.match(shell, /featureReadinessQueue\.slice\(0, 4\)\.map/);
    assert.match(shell, /Source readiness mix/);
    assert.match(shell, /homepageSourceReadiness\.map/);
    assert.match(shell, /sourceReadinessMatrix\.slice/);
    assert.match(shell, /formatPct\(source\.rowShare \* 100\)/);
    assert.match(shell, /Catalogue savings signals/);
    assert.match(shell, /homepageChainSavings\.map/);
    assert.match(shell, /chainSavingsLedger\.slice/);
    assert.match(shell, /chain\.topProductSlug/);
    assert.match(shell, /Evidence route map/);
    assert.match(shell, /homepageRouteMap\.map/);
    assert.match(shell, /sourceRouteMap\.slice/);
    assert.match(shell, /source\.supportingRoutes\.join/);
    assert.match(shell, /Fresh OpenPrices arrivals/);
    assert.match(shell, /homepageFreshOpenPrices\.map/);
    assert.match(shell, /freshestOpenPrices\.slice\(3, 9\)/);
    assert.match(shell, /product\.observationCount\.toLocaleString/);
    assert.match(shell, /Map chain index signals/);
    assert.match(shell, /homepageMapChainIndex\.map/);
    assert.match(shell, /mapChainIndexScores\.slice/);
    assert.match(shell, /chain\.overallIndex\.toFixed/);
    assert.match(homeMetadataSource, /GroceryView verified grocery snapshot/);
    assert.match(homeMetadataSource, /product browsing/);
    assert.match(homeMetadataSource, /fresh OpenPrices observations/);
    assert.match(homeMetadataSource, /source route mapping/);
    assert.match(homeMetadataSource, /catalogue savings/);
    assert.match(homeMetadataSource, /map chain index signals/);
    assert.match(homeMetadataSource, /gated feature readiness/);
  });

  it('colors map store markers by chain index and highlights the cheapest nearby chain', async () => {
    const route = await read('src/app/map/page.tsx');
    assert.match(route, /calculateChainPriceIndex/);
    assert.match(route, /buildChainPriceObservations/);
    assert.match(route, /chainIndexByBrand/);
    assert.match(route, /markerTone/);
    assert.match(route, /cheapestChainNearMe/);
    assert.match(route, /Cheapest chain near me/);
  });

  it('surfaces a price-by-district heat overlay on the map without branch-price claims', async () => {
    const route = await read('src/app/map/page.tsx');
    assert.match(route, /districtHeatOverlay/);
    assert.match(route, /buildDistrictHeatOverlay/);
    assert.match(route, /District price heat overlay/);
    assert.match(route, /district\.averageIndex\.toFixed/);
    assert.match(route, /district\.coveredStores/);
    assert.match(route, /chain-index proxy/);
  });

  it('surfaces verified OSM store brand coverage on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /export const storeBrandLedger = /);
    assert.match(verified, /osmStores\.reduce/);
    assert.match(verified, /addressCoverage/);
    assert.match(shell, /storeBrandLedger\.map/);
    assert.match(shell, /OSM brand ledger/);
    assert.match(shell, /Store brands with verified location coverage/);
    assert.match(shell, /\/stores\/\$\{brand\.sampleSlug\}/);
  });

  it('ships an OSM nationwide refresh script and surfaces Sweden-wide copy', async () => {
    const script = await read('scripts/refresh-osm-stores.mjs');
    const verified = await read('src/lib/verified-data.ts');
    const coverage = await read('src/app/store-coverage/page.tsx');

    assert.match(script, /SWEDEN_GROCERY_OVERPASS_QUERY/);
    assert.match(script, /fetchOverpassGroceryStores/);
    assert.match(script, /OpenStreetMap Overpass Sweden extract/);
    assert.match(script, /apps\/web\/src\/lib\/osm-stores\.ts/);
    assert.match(verified, /OpenStreetMap Overpass Sweden extract/);
    assert.match(coverage, /Sweden-wide OpenStreetMap extract/);
    assert.doesNotMatch(coverage, /Stockholm extract/);
  });

  it('surfaces verified OSM store format coverage on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /export const storeFormatCoverage = /);
    assert.match(verified, /osmStores\.reduce/);
    assert.match(verified, /addressCoverage/);
    assert.match(verified, /districts: row\.districts\.size/);
    assert.match(shell, /storeFormatCoverage\.map/);
    assert.match(shell, /OSM format coverage/);
    assert.match(shell, /Store formats with verified Sweden coverage/);
    assert.match(shell, /\/stores\/\$\{format\.sampleSlug\}/);
  });

  it('surfaces verified category quality on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /export const categoryQualityMatrix = /);
    assert.match(verified, /qualityScore/);
    assert.match(verified, /chainMatches/);
    assert.match(shell, /categoryQualityMatrix\.map/);
    assert.match(shell, /Category quality matrix/);
    assert.match(shell, /Categories ranked by verified row depth/);
    assert.match(shell, /\/categories\/\$\{category\.slug\}/);
  });

  it('surfaces verified chain category coverage on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /export const chainCategoryCoverage = /);
    assert.match(verified, /matchedChainProducts\.reduce/);
    assert.match(verified, /averageSpread/);
    assert.match(verified, /leadingLowestChain/);
    assert.match(shell, /chainCategoryCoverage\.map/);
    assert.match(shell, /Chain price coverage/);
    assert.match(shell, /Categories with repeat Willys\/Hemkop matches/);
    assert.match(shell, /matched chain products/);
    assert.match(shell, /\/categories\/\$\{category\.slug\}/);
  });

  it('surfaces deal score and Buy/Wait verdict on product pages using real core scoring', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /calculateDealScore/);
    assert.match(source, /scoreBand/);
    assert.match(source, /dealScoreVerdictFor/);
    assert.match(source, /Deal Score verdict/);
    assert.match(source, /Buy\/Wait signal/);
    assert.match(source, /cross-chain spread percentile/);
    assert.match(source, /confidence/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces product smart swaps using the real core recommendation engine', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /recommendSmartSwaps/);
    assert.match(source, /smartSwapRecommendationsFor/);
    assert.match(source, /Smart swaps/);
    assert.match(source, /savingsPercent/);
    assert.match(source, /qualityRisk/);
    assert.match(source, /private-label preference/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces observed 52-week-low price history badges without overclaiming missing history', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /summarizePriceHistory/);
    assert.match(source, /summarizePriceHistoryConfidence/);
    assert.match(source, /priceHistoryBadgeFor/);
    assert.match(source, /52-week-low badge/);
    assert.match(source, /observed low only/);
    assert.match(source, /canClaimLowestInWindow/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces lowest and highest observed prices for 30, 90, and 365 day history windows', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /historyWindowDefinitions/);
    assert.match(source, /priceHistoryRangeBadgesFor/);
    assert.match(source, /rangeDays: 30/);
    assert.match(source, /rangeDays: 90/);
    assert.match(source, /rangeDays: 365/);
    assert.match(source, /Lowest \/ highest in 30 \/ 90 \/ 365 days/);
    assert.match(source, /Observed 30-day low\/high/);
    assert.match(source, /Observed 90-day low\/high/);
    assert.match(source, /Observed 365-day low\/high/);
    assert.match(source, /canClaimLowestInWindow/);
    assert.match(source, /window.observationCount/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces an honest product vs-usual signal from its own observed history', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /priceVsUsualSignalFor/);
    assert.match(source, /typicalPriceLabel/);
    assert.match(source, /historyPercentile/);
    assert.match(source, /belowTypicalPercent/);
    assert.match(source, /vs usual signal/);
    assert.match(source, /product's own observed 1-year history/);
    assert.match(source, /No forecast or seasonal prediction is shown/);
    assert.match(source, /observed-history percentile/);
    assert.match(source, /Not enough dated observations/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces product multi-timeframe price charts using the real core chart adapter and lightweight-charts', async () => {
    const product = await read('src/app/products/[slug]/page.tsx');
    const chart = await read('src/components/price-chart-terminal.tsx');

    assert.match(product, /buildPriceChartSeries/);
    assert.match(product, /priceChartTerminalFor/);
    assert.match(product, /timeframeWindows/);
    assert.match(product, /rangeDays: window\.rangeDays/);
    assert.match(product, /PriceChartTerminal/);
    assert.match(chart, /lightweight-charts/);
    assert.match(chart, /createChart/);
    assert.match(chart, /LineSeries/);
    assert.match(chart, /Price chart terminal/);
    assert.match(chart, /1W/);
    assert.match(chart, /1M/);
    assert.match(chart, /3M/);
    assert.match(chart, /1Y/);
    assert.match(chart, /ALL/);
    assert.match(chart, /crosshair value readout/);
    assert.match(chart, /lineStyle/);
    assert.match(chart, /markers/);
    assert.doesNotMatch(product, /@\/lib\/demo-data/);
    assert.doesNotMatch(chart, /@\/components\/sample-data/);
  });

  it('surfaces verified catalogue savings on the compare route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/compare/page.tsx');

    assert.match(verified, /export const chainSavingsLedger = /);
    assert.match(verified, /matchedChainProducts\.reduce/);
    assert.match(verified, /totalSavings/);
    assert.match(verified, /topProductSlug/);
    assert.match(route, /chainSavingsLedger\.map/);
    assert.match(route, /Catalogue savings ledger/);
    assert.match(route, /Listed savings are aggregated only from matched Willys\/Hemkop catalogue rows/);
    assert.match(route, /Check source caveats/);
    assert.match(route, /chain\.topProductSlug/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces a budget lowest price anywhere radar from matched chain prices', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/compare/page.tsx');

    assert.match(verified, /export const budgetLowestPriceRadar/);
    assert.match(route, /budgetLowestPriceRadar/);
    assert.match(route, /Lowest price anywhere radar/);
    assert.match(route, /cheapestChain/);
    assert.match(route, /verifiedProductSlug/);
    assert.match(route, /priceGap/);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });

  it('surfaces verified OpenPrices observation depth on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /export const openPriceObservationDepth = /);
    assert.match(verified, /pricedProducts\.reduce/);
    assert.match(verified, /observationTotal/);
    assert.match(verified, /topProductObservations/);
    assert.match(shell, /openPriceObservationDepth\.map/);
    assert.match(shell, /OpenPrices depth/);
    assert.match(shell, /Categories with the deepest community price history/);
    assert.match(shell, /Open depth board/);
    assert.match(shell, /href="\/openprices-depth"/);
    assert.match(shell, /Top product:/);
    assert.match(shell, /\/categories\/\$\{category\.slug\}/);
  });

  it('surfaces a verified price-drop movers board on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /summarizePriceHistory/);
    assert.match(verified, /export const priceDropMoversBoard = /);
    assert.match(verified, /changeFromPrevious/);
    assert.match(verified, /isNewLow/);
    assert.match(verified, /observed low only/);
    assert.match(shell, /priceDropMoversBoard\.map/);
    assert.match(shell, /Price-drop movers board/);
    assert.match(shell, /latestPrice/);
    assert.match(shell, /previousPrice/);
    assert.match(shell, /New observed low/);
    assert.match(shell, /\/products\/\$\{mover\.productSlug\}/);
    assert.doesNotMatch(shell, /@\/lib\/demo-data/);
    assert.doesNotMatch(shell, /@\/components\/sample-data/);
  });

  it('surfaces category deal leaders on the homepage and category routes using the real core summarizer', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const categoryRoute = await read('src/app/categories/[slug]/page.tsx');

    assert.match(verified, /summarizeCategoryDealLeaders/);
    assert.match(verified, /calculateDealScore/);
    assert.match(verified, /export const categoryDealLeaderCandidates = /);
    assert.match(verified, /export const categoryDealLeaders = /);
    assert.match(verified, /minimumSourceConfidence/);
    assert.match(verified, /sourceConfidence/);
    assert.match(shell, /categoryDealLeaders\.slice/);
    assert.match(shell, /Today&apos;s best category deals/);
    assert.match(shell, /leader\.categorySlug/);
    assert.match(shell, /leader\.evidenceLabel/);
    assert.match(categoryRoute, /categoryDealLeadersFor/);
    assert.match(categoryRoute, /summarizeCategoryDealLeaders/);
    assert.match(categoryRoute, /Category deal leaders/);
    assert.match(categoryRoute, /sourceConfidence/);
    assert.doesNotMatch(shell, /@\/lib\/demo-data/);
    assert.doesNotMatch(categoryRoute, /@\/lib\/demo-data/);
  });

  it('surfaces reusable data-freshness confidence badges across public routes', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const product = await read('src/app/products/[slug]/page.tsx');
    const category = await read('src/app/categories/[slug]/page.tsx');

    assert.match(verified, /export const dataFreshnessBadges = /);
    assert.match(verified, /sourceKind/);
    assert.match(verified, /freshnessLabel/);
    assert.match(verified, /confidenceBadge/);
    assert.match(shell, /dataFreshnessBadges\.map/);
    assert.match(shell, /Data freshness badges/);
    assert.match(product, /dataFreshnessBadges/);
    assert.match(product, /Data freshness badge/);
    assert.match(product, /freshnessBadge\.freshnessLabel/);
    assert.match(product, /freshnessBadge\.confidenceBadge/);
    assert.match(category, /dataFreshnessBadges\.filter/);
    assert.match(category, /Category data-freshness badges/);
    assert.doesNotMatch(product, /@\/lib\/demo-data/);
    assert.doesNotMatch(category, /@\/components\/sample-data/);
  });

  it('surfaces household planning with verified market context only', async () => {
    const householdPage = await read('src/app/household/page.tsx');

    assert.match(householdPage, /NoVerifiedData/);
    assert.match(householdPage, /static snapshot/);
    assert.match(householdPage, /sourceCoverage\.length/);
    assert.match(householdPage, /topChainSpreads\.slice/);
    assert.match(householdPage, /Household planning evidence/);
    assert.doesNotMatch(householdPage, /@\/lib\/demo-data/);
    assert.doesNotMatch(householdPage, /@\/components\/sample-data/);
  });

  it('surfaces a widened OpenFoodFacts metadata catalog without synthetic prices', async () => {
    const script = await read('scripts/refresh-openfoodfacts-catalog.mjs');
    const catalog = await read('src/lib/openfoodfacts-catalog.ts');
    const verified = await read('src/lib/verified-data.ts');
    const products = await read('src/app/products/page.tsx');
    const catalogRows = (catalog.match(/"code":/g) ?? []).length;

    assert.match(script, /fetchOpenFoodFactsSwedenCatalog/);
    assert.match(script, /GROCERYVIEW_OPENFOODFACTS_MIN_ROWS/);
    assert.match(script, /loadExistingOpenPricesMetadata/);
    assert.match(script, /apps\/web\/src\/lib\/openfoodfacts-catalog\.ts/);
    assert.match(script, /OpenFoodFacts Sweden metadata catalog/);
    assert.ok(catalogRows >= 900, `expected generated OpenFoodFacts catalog to contain at least 900 metadata rows, saw ${catalogRows}`);
    assert.match(verified, /openFoodFactsCatalog/);
    assert.match(verified, /openFoodFactsCatalogSummary/);
    assert.match(products, /OpenFoodFacts metadata catalog/);
    assert.match(products, /metadata-only/);
    assert.match(products, /No synthetic prices/);
  });

  it('ships JSON-LD organization, site search, product offer, and breadcrumb metadata', async () => {
    const layout = await read('src/app/layout.tsx');
    const productRoute = await read('src/app/products/[slug]/page.tsx');

    assert.match(layout, /application\/ld\+json/);
    assert.match(layout, /'@type': 'Organization'/);
    assert.match(layout, /'@type': 'WebSite'/);
    assert.match(layout, /SearchAction/);
    assert.match(layout, /query-input/);
    assert.match(layout, /https:\/\/grocery-web-mu\.vercel\.app/);

    assert.match(productRoute, /productJsonLdFor/);
    assert.match(productRoute, /'@type': 'Product'/);
    assert.match(productRoute, /'@type': 'AggregateOffer'/);
    assert.match(productRoute, /lowPrice/);
    assert.match(productRoute, /highPrice/);
    assert.match(productRoute, /priceCurrency: 'SEK'/);
    assert.match(productRoute, /breadcrumbJsonLdFor/);
    assert.match(productRoute, /'@type': 'BreadcrumbList'/);
    assert.match(productRoute, /application\/ld\+json/);
    assert.doesNotMatch(productRoute, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('ships a fail-closed CMP with Google Consent Mode v2 defaults and audit logging', async () => {
    const layout = await read('src/app/layout.tsx');
    const cmp = await read('src/components/consent-manager.tsx');

    assert.match(layout, /ConsentManager/);
    assert.match(cmp, /'use client'/);
    assert.match(cmp, /IAB TCF v2\.2/);
    assert.match(cmp, /accept all/i);
    assert.match(cmp, /reject all/i);
    assert.match(cmp, /manage/i);
    assert.match(cmp, /necessary/);
    assert.match(cmp, /analytics/);
    assert.match(cmp, /ads/);
    assert.match(cmp, /personalisation/);
    assert.match(cmp, /window\.dataLayer/);
    assert.match(cmp, /function gtag/);
    assert.match(cmp, /gtag\('consent', 'default'/);
    assert.match(cmp, /analytics_storage: 'denied'/);
    assert.match(cmp, /ad_storage: 'denied'/);
    assert.match(cmp, /ad_user_data: 'denied'/);
    assert.match(cmp, /ad_personalization: 'denied'/);
    assert.match(cmp, /gtag\('consent', 'update'/);
    assert.match(cmp, /allow_ad_personalization_signals/);
    assert.match(cmp, /non-personalised/);
    assert.match(cmp, /CONSENT_POLICY_VERSION/);
    assert.match(cmp, /groceryview:consent:audit/);
    assert.match(cmp, /new Date\(\)\.toISOString\(\)/);
    assert.match(cmp, /policyVersion/);
    assert.match(cmp, /timestamp/);
    assert.match(cmp, /\/privacy/);
  });


  it('wires login to the production auth session exchange without mock accounts', async () => {
    const login = await read('src/app/login/page.tsx');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(login, /LoginSessionExchange/);
    assert.match(login, /\/api\/auth\/session/);
    assert.match(login, /verified auth provider assertion/i);
    assert.match(login, /No test account/);
    assert.match(login, /source timestamps from authenticated storage/);

    const exchange = await read('src/components/login-session-exchange.tsx');
    assert.match(exchange, /'use client'/);
    assert.match(exchange, /fetch\('\/api\/auth\/session'/);
    assert.match(exchange, /provider: 'magic_link'/);
    assert.match(exchange, /sessionStorage\.setItem\('groceryview:accessToken'/);
    assert.match(exchange, /sessionStorage\.setItem\('groceryview:userId'/);
    assert.match(exchange, /Authorization: `Bearer \$\{session\.accessToken\}`/);
    assert.match(exchange, /validCode/);
    assert.match(exchange, /Session established/);
    assert.doesNotMatch(exchange, /test account|mock session|demo-data|sample-data/i);
    assert.match(server, /Auth session exchange is not configured/);
    assert.match(server, /createSessionToken/);
  });

  it('ships crawlable sitemap and robots metadata from verified route drivers', async () => {
    const sitemap = await read('src/app/sitemap.ts');
    const robots = await read('src/app/robots.ts');

    assert.match(sitemap, /MetadataRoute\.Sitemap/);
    assert.match(sitemap, /https:\/\/grocery-web-mu\.vercel\.app/);
    assert.match(sitemap, /productUniverse/);
    assert.match(sitemap, /osmStores/);
    assert.match(sitemap, /categoryLabels/);
    assert.match(sitemap, /\/products\/\$\{product\.slug\}/);
    assert.match(sitemap, /\/stores\/\$\{store\.slug\}/);
    assert.match(sitemap, /\/categories\/\$\{slug\}/);
    assert.match(sitemap, /changeFrequency/);
    assert.match(sitemap, /lastModified/);
    assert.doesNotMatch(sitemap, /@\/lib\/demo-data|@\/components\/sample-data/);

    assert.match(robots, /MetadataRoute\.Robots/);
    assert.match(robots, /https:\/\/grocery-web-mu\.vercel\.app\/sitemap\.xml/);
    assert.match(robots, /userAgent: '\*'/);
    assert.match(robots, /allow: '\/'/);
    assert.match(robots, /disallow: \[/);
    assert.match(robots, /\/account/);
    assert.match(robots, /\/login/);
  });

  it('ships canonical generateMetadata coverage for every app route', async () => {
    const routePages = [
      'src/app/page.tsx',
      'src/app/account/page.tsx',
      'src/app/account/profile/page.tsx',
      'src/app/basket-ideas/page.tsx',
      'src/app/billigaste/[slug]/page.tsx',
      'src/app/catalogue-savings/page.tsx',
      'src/app/categories/page.tsx',
      'src/app/categories/[slug]/page.tsx',
      'src/app/chain-coverage/page.tsx',
      'src/app/chain-index/page.tsx',
      'src/app/compare/page.tsx',
      'src/app/coupon-stacks/page.tsx',
      'src/app/data-sources/page.tsx',
      'src/app/deals/page.tsx',
      'src/app/household/page.tsx',
      'src/app/login/page.tsx',
      'src/app/map/page.tsx',
      'src/app/meal-planner/page.tsx',
      'src/app/nutrition-value/page.tsx',
      'src/app/openprices-depth/page.tsx',
      'src/app/pantry-planner/page.tsx',
      'src/app/price-reports/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/prisjamforelse/[slug]/page.tsx',
      'src/app/products/page.tsx',
      'src/app/products/[slug]/page.tsx',
      'src/app/savings-dashboard/page.tsx',
      'src/app/scanner/page.tsx',
      'src/app/shopping-trips/page.tsx',
      'src/app/store-coverage/page.tsx',
      'src/app/stores/page.tsx',
      'src/app/stores/[slug]/page.tsx',
      'src/app/unit-price-alerts/page.tsx',
      'src/app/watchlist/page.tsx',
      'src/app/weekly-basket/page.tsx',
      'src/app/[city]/billigaste/[slug]/page.tsx'
    ];
    const seo = await read('src/lib/seo.ts');

    assert.match(seo, /import type \{ Metadata \} from 'next'/);
    assert.match(seo, /siteUrl = 'https:\/\/grocery-web-mu\.vercel\.app'/);
    assert.match(seo, /alternates: \{ canonical:/);
    assert.match(seo, /openGraph:/);
    assert.match(seo, /twitter:/);
    assert.match(seo, /robots:/);
    assert.match(seo, /GroceryView/);

    for (const page of routePages) {
      const source = await read(page);
      assert.match(source, /generateMetadata/, `${page} should export generateMetadata`);
      assert.match(source, /routeMetadata|metadataForProduct|metadataForCategory|metadataForStore|metadataForCheapestLanding|metadataForPriceComparisonLanding|metadataForCityCheapestLanding/, `${page} should use the shared SEO metadata helpers`);
      assert.doesNotMatch(source, /export const metadata = /, `${page} should avoid stale metadata objects`);
    }

    const product = await read('src/app/products/[slug]/page.tsx');
    const category = await read('src/app/categories/[slug]/page.tsx');
    const store = await read('src/app/stores/[slug]/page.tsx');
    assert.match(product, /metadataForProduct/);
    assert.match(product, /findProduct/);
    assert.match(category, /metadataForCategory/);
    assert.match(category, /categoryLabels/);
    assert.match(store, /metadataForStore/);
    assert.match(store, /findStore/);
  });

  it('ships programmatic SEO landing pages from verified price spreads', async () => {
    const landingData = await read('src/lib/seo-landing-pages.ts');
    const landingComponent = await read('src/components/seo-landing-page.tsx');
    const cheapestRoute = await read('src/app/billigaste/[slug]/page.tsx');
    const compareRoute = await read('src/app/prisjamforelse/[slug]/page.tsx');
    const cityRoute = await read('src/app/[city]/billigaste/[slug]/page.tsx');
    const products = await read('src/app/products/page.tsx');
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(landingData, /seoLandingProducts/);
    assert.match(landingData, /topChainSpreads/);
    assert.match(landingData, /chainPriceRows/);
    assert.match(landingData, /formatSek/);
    assert.match(landingData, /formatPct/);
    assert.match(landingData, /seoLandingCities/);
    assert.match(landingData, /stockholm/);
    assert.doesNotMatch(landingData, /@\/lib\/demo-data|@\/components\/sample-data/);

    for (const route of [cheapestRoute, compareRoute, cityRoute]) {
      assert.match(route, /generateStaticParams/);
      assert.match(route, /generateMetadata/);
      assert.match(route, /findSeoLandingProduct/);
      assert.match(route, /SeoLandingPage/);
      assert.match(route, /notFound/);
    }
    assert.match(cheapestRoute, /kind="cheapest"/);
    assert.match(compareRoute, /kind="compare"/);
    assert.match(cityRoute, /findSeoLandingCity/);
    assert.match(cityRoute, /kind="city"/);

    assert.match(landingComponent, /Billigaste|prisjämförelse/i);
    assert.match(landingComponent, /Verified price spread/);
    assert.match(landingComponent, /No synthetic prices/);
    assert.match(landingComponent, /chainRows\.map/);
    assert.match(landingComponent, /\/products\/\$\{product\.slug\}/);
    assert.match(landingComponent, /\/compare/);

    assert.match(products, /SEO landing pages/);
    assert.match(products, /seoLandingProducts\.slice/);
    assert.match(products, /\/billigaste\/\$\{landing\.slug\}/);
    assert.match(products, /\/prisjamforelse\/\$\{landing\.slug\}/);

    assert.match(sitemap, /seoLandingProducts/);
    assert.match(sitemap, /seoLandingCities/);
    assert.match(sitemap, /\/billigaste\/\$\{product\.slug\}/);
    assert.match(sitemap, /\/prisjamforelse\/\$\{product\.slug\}/);
    assert.match(sitemap, /\/\$\{city\.slug\}\/billigaste\/\$\{product\.slug\}/);
  });

  it('surfaces adaptive total and unit price product cards with a compare-mode toggle', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const products = await read('src/app/products/page.tsx');
    const shell = await read('src/components/market-shell.tsx');
    const cards = await read('src/components/product-price-cards.tsx');

    assert.match(verified, /export const adaptiveProductCards/);
    assert.match(verified, /normalizeComparableUnitPrice/);
    assert.match(verified, /cheapestUnitBadge/);
    assert.match(products, /ProductPriceCards/);
    assert.match(products, /adaptiveProductCards/);
    assert.match(shell, /ProductPriceCards/);
    assert.match(shell, /homepageAdaptiveProductCards/);
    assert.match(cards, /Compare by:/);
    assert.match(cards, /localStorage/);
    assert.match(cards, /unitSortPrice/);
    assert.match(cards, /totalSortPrice/);
    assert.match(cards, /cheapest-per-unit/);
    assert.match(cards, /No synthetic unit prices/);
  });

  it('surfaces verified source coverage on the data sources route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/data-sources/page.tsx');

    assert.match(verified, /export const sourceReadinessMatrix = /);
    assert.match(verified, /sourceRowsTotal/);
    assert.match(verified, /primaryRoute/);
    assert.match(verified, /export const sourceRouteMap = /);
    assert.match(verified, /supportingRoutes/);
    assert.match(verified, /export const sourceClaimLedger = /);
    assert.match(verified, /allowedClaim/);
    assert.match(verified, /blockedClaim/);
    assert.match(route, /sourceCoverage\.map/);
    assert.match(route, /sourceReadinessMatrix\.map/);
    assert.match(route, /sourceRouteMap\.map/);
    assert.match(route, /sourceClaimLedger\.map/);
    assert.match(route, /storeBrandLedger\.map/);
    assert.match(route, /categoryQualityMatrix\.map/);
    assert.match(route, /Verified snapshot provenance/);
    assert.match(route, /Source readiness matrix/);
    assert.match(route, /Source route map/);
    assert.match(route, /Claim boundary ledger/);
    assert.match(route, /Supported claim/);
    assert.match(route, /Blocked claim/);
    assert.match(route, /source\.supportingRoutes\.map/);
    assert.match(route, /Row share, freshness, caveat/);
    assert.match(route, /source\.primaryRoute/);
    assert.match(route, /no branch-level prices|without implying branch-level prices/i);
  });

  it('surfaces verified OSM coverage on the store coverage route', async () => {
    const route = await read('src/app/store-coverage/page.tsx');

    assert.match(route, /storeBrandLedger\.map/);
    assert.match(route, /storeFormatCoverage\.map/);
    assert.match(route, /SourceCoverage/);
    assert.match(route, /OSM store coverage without inferred prices/);
    assert.match(route, /without turning coordinates into branch-level price claims/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
  });

  it('surfaces verified OpenPrices observation depth on its own route', async () => {
    const route = await read('src/app/openprices-depth/page.tsx');

    assert.match(route, /openPriceObservationDepth\.map/);
    assert.match(route, /freshestOpenPrices\.slice/);
    assert.match(route, /SourceCoverage/);
    assert.match(route, /Community SEK observation depth/);
    assert.match(route, /Claim boundary/);
    assert.match(route, /store-specific prices/);
    assert.match(route, /@\/lib\/verified-data/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces verified Willys and Hemkop category coverage on its own route', async () => {
    const route = await read('src/app/chain-coverage/page.tsx');

    assert.match(route, /chainCategoryCoverage\.map/);
    assert.match(route, /matchedChainProducts\.length/);
    assert.match(route, /topChainSpreads\.slice/);
    assert.match(route, /SourceCoverage/);
    assert.match(route, /Willys\/Hemkop category coverage/);
    assert.match(route, /Claim boundary/);
    assert.match(route, /per-store availability/);
    assert.match(route, /@\/lib\/verified-data/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces brand-tier indices on the chain index route using the real core brand-tier output', async () => {
    const source = await read('src/app/chain-index/page.tsx');
    assert.match(source, /calculateBrandTierIndices/);
    assert.match(source, /buildBrandTierPriceObservations/);
    assert.match(source, /brandTierSummary/);
    assert.match(source, /privateLabelSavingsPercent/);
    assert.match(source, /premiumGapPercent/);
  });

  it('refines the chain index with matched-basket observations on the 100-centred scale', async () => {
    const source = await read('src/app/chain-index/page.tsx');
    assert.match(source, /buildMatchedBasketChainPriceObservations/);
    assert.match(source, /matchedBasketRefinedIndex/);
    assert.match(source, /matchedBasketObservations/);
    assert.match(source, /Refined matched-basket index/);
    assert.match(source, /overallIndex\.toFixed/);
    assert.match(source, /100-centred/);
  });

  it('surfaces verified catalogue savings on its own route', async () => {
    const route = await read('src/app/catalogue-savings/page.tsx');

    assert.match(route, /chainSavingsLedger\.map/);
    assert.match(route, /matchedChainProducts/);
    assert.match(route, /chainPriceRows\(product\)/);
    assert.match(route, /SourceCoverage/);
    assert.match(route, /Matched catalogue savings ledger/);
    assert.match(route, /Claim boundary/);
    assert.match(route, /store-specific availability/);
    assert.match(route, /@\/lib\/verified-data/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });
});
