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
    const featureRoutes = ['scanner','household','account','basket-ideas','coupon-stacks','pantry-planner','price-reports','shopping-trips','privacy'];
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






  it('surfaces watchlist alerts and notification planning using the real core outputs', async () => {
    const source = await read('src/app/watchlist/page.tsx');
    assert.match(source, /watchlistAlertBoard/);
    assert.match(source, /buildWatchlistAlerts/);
    assert.match(source, /planNotifications/);
    assert.match(source, /plannedNotifications/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces deal-based meals on the meal planner route using the real core meal output', async () => {
    const source = await read('src/app/meal-planner/page.tsx');
    assert.match(source, /dealBasedMeals/);
    assert.match(source, /suggestDealBasedMeals/);
    assert.match(source, /estimatedCostPerServing/);
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

  it('surfaces nutrition per krona on the nutrition value route using the real core ranking output', async () => {
    const source = await read('src/app/nutrition-value/page.tsx');
    assert.match(source, /nutritionPerKrona/);
    assert.match(source, /rankNutritionPerKrona/);
    assert.match(source, /valuePer10Sek/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces personal grocery inflation on the savings dashboard using the real core-derived driver output', async () => {
    const source = await read('src/app/savings-dashboard/page.tsx');
    assert.match(source, /personalGroceryInflation/);
    assert.match(source, /inflationPercent/);
    assert.match(source, /itemContributions/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('uses a readable global shell and provenance surfaces across the app', async () => {
    const globals = await read('src/app/globals.css');
    const nav = await read('src/components/app-nav.tsx');
    const shell = await read('src/components/market-shell.tsx');
    const page = await read('src/app/page.tsx');
    assert.match(globals, /radial-gradient/);
    assert.match(nav, /Verified grocery intelligence/);
    assert.match(shell, /zero placeholder rows/);
    assert.match(shell, /Data provenance|SourceCoverage/);
    assert.match(shell, /Verified product universe/);
    assert.match(shell, /productUniverseRail\.map/);
    assert.match(shell, /\/products\/\$\{product\.slug\}/);
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
    assert.match(page, /GroceryView verified grocery snapshot/);
    assert.match(page, /product browsing/);
    assert.match(page, /fresh OpenPrices observations/);
    assert.match(page, /source route mapping/);
    assert.match(page, /catalogue savings/);
    assert.match(page, /map chain index signals/);
    assert.match(page, /gated feature readiness/);
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

  it('surfaces verified OSM store format coverage on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /export const storeFormatCoverage = /);
    assert.match(verified, /osmStores\.reduce/);
    assert.match(verified, /addressCoverage/);
    assert.match(verified, /districts: row\.districts\.size/);
    assert.match(shell, /storeFormatCoverage\.map/);
    assert.match(shell, /OSM format coverage/);
    assert.match(shell, /Store formats with verified Stockholm coverage/);
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
