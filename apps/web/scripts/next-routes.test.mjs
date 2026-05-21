import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const requiredFiles = [
  'src/app/page.tsx',
  'src/app/products/[slug]/page.tsx',
  'src/app/stores/[slug]/page.tsx',
  'src/app/categories/[slug]/page.tsx',
  'src/app/watchlist/page.tsx',
  'src/app/providers.tsx',
  'tailwind.config.ts',
  'src/components/ui/button.tsx'
];

describe('Next.js web scaffold', () => {
  it('declares App Router routes, Tailwind, shadcn-style UI, and TanStack Query', async () => {
    for (const file of requiredFiles) {
      const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
      assert.ok(source.length > 0, `${file} should not be empty`);
    }

    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.match(packageJson.dependencies.next, /^(\^)?16\./);
    assert.ok(packageJson.dependencies['@tanstack/react-query']);
    assert.ok(packageJson.dependencies['class-variance-authority']);
  });

  it('keeps the homepage backed by visible product and store driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const productSlugs = demoData.match(/slug: '[^']+'/g) ?? [];
    const storeNames = demoData.match(/name: '[A-ZÅÄÖ]/g) ?? [];

    assert.ok(productSlugs.length >= 14, 'homepage driver data should expose at least 14 product/category/store slugs');
    assert.ok(storeNames.length >= 7, 'homepage driver data should expose at least 7 named Stockholm stores');
    assert.match(demoData, /matmissionen-hagersten/);
    assert.match(demoData, /eldorado-basmati-rice-1kg/);
    assert.match(demoData, /barilla-spaghetti-1kg/);
    assert.match(marketShell, /stores\.map/);
    assert.match(marketShell, /\/stores\/\$\{store\.slug\}/);
    assert.match(marketShell, /Stockholm store tape/);
  });

  it('surfaces category instruments from the homepage driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const categorySection = demoData.split('export const categories = ')[1] ?? '';
    const categorySlugs = categorySection.match(/slug: '[^']+'/g) ?? [];

    assert.ok(categorySlugs.length >= 8, 'homepage driver data should expose at least 8 category instruments');
    assert.match(demoData, /slug: 'rice'/);
    assert.match(demoData, /slug: 'butter'/);
    assert.match(demoData, /ELDORADO-BASMATI-RICE-1KG/);
    assert.match(demoData, /BREGOTT-NORMALSALTAT-600G/);
    assert.match(marketShell, /categories\.map/);
    assert.match(marketShell, /\/categories\/\$\{category\.slug\}/);
    assert.match(marketShell, /Category market tape/);
  });

  it('surfaces weekly basket planning rows on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const basketSection = demoData.split('export const weeklyBasket = ')[1] ?? '';
    const basketRows = basketSection.match(/slug: '[^']+'/g) ?? [];

    assert.ok(basketRows.length >= 12, 'homepage driver data should expose at least 12 weekly basket rows');
    assert.match(demoData, /eldorado-basmati-rice-1kg/);
    assert.match(demoData, /barilla-spaghetti-1kg/);
    assert.match(demoData, /bregott-normalsaltat-600g/);
    assert.match(demoData, /garant-havregryn-1kg/);
    assert.match(demoData, /weeklyTotal: '710\.60 SEK'/);
    assert.match(marketShell, /weeklyBasket\.map/);
    assert.match(marketShell, /householdSavings\.weeklyTotal/);
    assert.match(marketShell, /Weekly basket tape/);
  });

  it('surfaces a driver-backed watchlist App Router page', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const watchlistPage = await readFile(new URL('../src/app/watchlist/page.tsx', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const alertSection = demoData.split('export const watchlistAlerts = ')[1] ?? '';
    const alertRows = alertSection.match(/productSlug: '[^']+'/g) ?? [];

    assert.ok(alertRows.length >= 4, 'watchlist driver data should expose at least 4 alert rows');
    assert.match(demoData, /zoegas-coffee-450g/);
    assert.match(demoData, /bregott-normalsaltat-600g/);
    assert.match(demoData, /allowedPriceTypes/);
    assert.match(watchlistPage, /watchlistAlerts\.map/);
    assert.match(watchlistPage, /Target-price alerts tied to real Stockholm product rows/);
    assert.match(watchlistPage, /\/products\/\$\{alert\.productSlug\}/);
    assert.match(marketShell, /href="\/watchlist"/);
  });

  it('surfaces scanner product matches and store routing from driver data', async () => {
    const scannerPage = await readFile(new URL('../src/app/scanner/page.tsx', import.meta.url), 'utf8');

    assert.match(scannerPage, /import \{ products, stores \} from "@\/lib\/demo-data"/);
    assert.match(scannerPage, /matchCandidates\.map/);
    assert.match(scannerPage, /routingStores\.map/);
    assert.match(scannerPage, /\/products\/\$\{product\.slug\}/);
    assert.match(scannerPage, /\/stores\/\$\{store\.slug\}/);
    assert.match(scannerPage, /Capture routing/);
  });

  it('surfaces unit price alert rows on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const alertSection = demoData.split('export const unitPriceAlertDesk = ')[1] ?? '';
    const alertRows = alertSection.match(/productSlug: '[^']+'/g) ?? [];

    assert.ok(alertRows.length >= 3, 'unit price driver data should expose at least 3 alert rows');
    assert.match(demoData, /santa-maria-taco-spice-28g/);
    assert.match(demoData, /426\.79 SEK\/kg/);
    assert.match(marketShell, /Package-size alerts/);
    assert.match(marketShell, /unitPriceAlertDesk\.map/);
    assert.match(marketShell, /Unit price alert desk/);
    assert.match(marketShell, /\/products\/\$\{alert\.productSlug\}/);
  });

  it('surfaces coupon stack planner rows on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const couponSection = demoData.split('export const couponStackPlanner = ')[1] ?? '';
    const couponRows = couponSection.match(/productSlug: '[^']+'/g) ?? [];

    assert.ok(couponRows.length >= 3, 'homepage driver data should expose at least 3 coupon stack rows');
    assert.match(demoData, /Coffee member match/);
    assert.match(demoData, /44\.90 SEK/);
    assert.match(demoData, /garant-havregryn-1kg/);
    assert.match(marketShell, /couponStackPlanner\.map/);
    assert.match(marketShell, /Coupon stack planner/);
    assert.match(marketShell, /Digital coupons, member prices, and receipt bonuses/);
    assert.match(marketShell, /\/products\/\$\{stack\.productSlug\}/);
    assert.match(marketShell, /\/stores\/\$\{stack\.storeSlug\}/);
  });

  it('surfaces a dedicated coupon stacks route from coupon driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const stacksPage = await readFile(new URL('../src/app/coupon-stacks/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const couponStackCenter = /);
    assert.match(demoData, /Stack decision rules/);
    assert.match(demoData, /Coffee member match/);
    assert.match(marketShell, /\/coupon-stacks/);
    assert.match(marketShell, /couponStackCenter\.headline/);
    assert.match(stacksPage, /couponStackCenter\.stacks\.map/);
    assert.match(stacksPage, /couponStackCenter\.rulesTitle/);
  });

  it('surfaces savings playbook actions on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const playbookSection = demoData.split('export const savingsPlaybook = ')[1] ?? '';
    const playbookRows = playbookSection.match(/title: '[^']+'/g) ?? [];

    assert.ok(playbookRows.length >= 4, 'homepage driver data should expose at least 4 savings playbook actions');
    assert.match(demoData, /Coffee stock-up window/);
    assert.match(demoData, /Butter caution flag/);
    assert.match(marketShell, /savingsPlaybook\.map/);
    assert.match(marketShell, /Savings playbook/);
  });

  it('surfaces meal basket ideas on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const mealBasketSection = demoData.split('export const mealBasketIdeas = ')[1] ?? '';
    const mealBasketRows = mealBasketSection.match(/title: '[^']+'/g) ?? [];

    assert.ok(mealBasketRows.length >= 3, 'homepage driver data should expose at least 3 meal basket ideas');
    assert.match(demoData, /weekday breakfast top-up/);
    assert.match(demoData, /pantry pasta night/);
    assert.match(demoData, /coffee and fika hold/);
    assert.match(marketShell, /mealBasketIdeas\.map/);
    assert.match(marketShell, /Meal basket ideas/);
  });

  it('surfaces a dedicated meal planner route from meal driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const mealPlannerPage = await readFile(new URL('../src/app/meal-planner/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const mealPlanner = /);
    assert.match(demoData, /weekLabel: 'May 21-27 dinner plan'/);
    assert.match(demoData, /plannedMeals: 6/);
    assert.match(marketShell, /\/meal-planner/);
    assert.match(marketShell, /mealPlanner\.projectedSavings/);
    assert.match(mealPlannerPage, /mealPlanner\.days\.map/);
    assert.match(mealPlannerPage, /Planning constraints/);
  });

  it('surfaces receipt review rows on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const receiptSection = demoData.split('export const receiptReviewDesk = ')[1] ?? '';
    const receiptRows = receiptSection.match(/receiptId: '[^']+'/g) ?? [];

    assert.ok(receiptRows.length >= 3, 'homepage driver data should expose at least 3 receipt review rows');
    assert.match(demoData, /R-2026-05-21-ICA-LILJEHOLMEN/);
    assert.match(demoData, /Chicken fillet weight mismatch/);
    assert.match(demoData, /Receipt privacy/);
    assert.match(marketShell, /receiptReviewDesk\.map/);
    assert.match(marketShell, /Receipt review desk/);
    assert.match(marketShell, /\/products\/\$\{line\.productSlug\}/);
  });

  it('surfaces a dedicated pantry planner route from pantry driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const pantryPlannerPage = await readFile(new URL('../src/app/pantry-planner/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const pantryPlanner = /);
    assert.match(demoData, /projectedSpend: '207\.90 SEK'/);
    assert.match(demoData, /Matmissionen Hägersten/);
    assert.match(marketShell, /\/pantry-planner/);
    assert.match(marketShell, /pantryPlanner\.projectedSavings/);
    assert.match(pantryPlannerPage, /pantryPlanner\.staples\.map/);
    assert.match(pantryPlannerPage, /Decision rules/);
  });

  it('surfaces a dedicated nutrition value route from nutrition driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const nutritionPage = await readFile(new URL('../src/app/nutrition-value/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const nutritionValueBoard = /);
    assert.match(demoData, /Protein floor/);
    assert.match(demoData, /Garant Havregryn 1kg/);
    assert.match(marketShell, /\/nutrition-value/);
    assert.match(marketShell, /nutritionValueBoard\.weeklySignal/);
    assert.match(nutritionPage, /rankNutritionPerKrona/);
    assert.match(nutritionPage, /buildNutritionProducts/);
    assert.match(nutritionPage, /nutritionRanks\.map/);
    assert.match(nutritionPage, /Protein per 10 SEK/);
    assert.match(nutritionPage, /nutritionValueBoard\.cards\.map/);
    assert.match(nutritionPage, /Nutrition ranking rules/);
  });

  it('surfaces a dedicated price reports route from report driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const reportsPage = await readFile(new URL('../src/app/price-reports/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const priceReportCenter = /);
    assert.match(demoData, /Report send checklist/);
    assert.match(demoData, /Coffee promo spread/);
    assert.match(marketShell, /\/price-reports/);
    assert.match(marketShell, /priceReportCenter\.headline/);
    assert.match(reportsPage, /priceReportCenter\.reports\.map/);
    assert.match(reportsPage, /priceReportCenter\.checklistTitle/);
  });

  it('surfaces expiry deal radar on a dedicated deals route', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const dealsPage = await readFile(new URL('../src/app/deals/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const expiryDealReports = /);
    assert.match(marketShell, /\/deals/);
    assert.match(dealsPage, /buildExpiryDealRadar/);
    assert.match(dealsPage, /expiryDealReports/);
    assert.match(dealsPage, /Expiry deal radar/);
    assert.match(dealsPage, /radar\.stores\.map/);
    assert.match(dealsPage, /radar\.alerts\.map/);
  });

  it('surfaces source coverage rows on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const sourceSection = demoData.split('export const sourceCoverage = ')[1] ?? '';
    const coverageRows = sourceSection.match(/chain: '[^']+'/g) ?? [];

    assert.ok(coverageRows.length >= 6, 'homepage driver data should expose at least 6 source coverage rows');
    assert.match(demoData, /fixture: 'Store locator'/);
    assert.match(demoData, /fixture: 'Weekly offers'/);
    assert.match(marketShell, /sourceCoverage\.map/);
    assert.match(marketShell, /Source coverage tape/);
  });

  it('surfaces a dedicated chain index route from ingested chain data', async () => {
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const chainIndexPage = await readFile(new URL('../src/app/chain-index/page.tsx', import.meta.url), 'utf8');
    const chainIndexData = await readFile(new URL('../src/lib/chain-index-data.ts', import.meta.url), 'utf8');

    assert.match(marketShell, /\/chain-index/);
    assert.match(chainIndexPage, /calculateChainPriceIndex/);
    assert.match(chainIndexPage, /calculateBrandTierIndices/);
    assert.match(chainIndexPage, /buildChainPriceObservations/);
    assert.match(chainIndexPage, /buildBrandTierPriceObservations/);
    assert.match(chainIndexPage, /Brand-tier index/);
    assert.match(chainIndexPage, /Private label savings/);
    assert.match(chainIndexData, /coopProducts/);
    assert.match(chainIndexData, /matpriskollenOffers/);
    assert.match(chainIndexData, /BrandTierPriceObservation/);
  });

  it('surfaces generated OpenPrices and OSM fixture counts on the homepage', async () => {
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    assert.match(marketShell, /pricedProducts\.length\.toLocaleString/);
    assert.match(marketShell, /totalObservedPrices\.toLocaleString/);
    assert.match(marketShell, /osmStores\.length\.toLocaleString/);
    assert.match(marketShell, /OpenPrices fixture radar/);
  });

  it('surfaces Stockholm area coverage on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const areaSection = demoData.split('export const stockholmAreas = ')[1] ?? '';
    const areaSlugs = areaSection.match(/slug: '[^']+'/g) ?? [];

    assert.ok(areaSlugs.length >= 7, 'homepage driver data should expose at least 7 Stockholm area rows');
    assert.match(demoData, /slug: 'hagersten'/);
    assert.match(demoData, /slug: 'stockholm-county'/);
    assert.match(demoData, /topSavings: 'Rice'/);
    assert.match(demoData, /topSavings: 'Pasta'/);
    assert.match(marketShell, /stockholmAreas\.map/);
    assert.match(marketShell, /Area coverage tape/);
  });

  it('surfaces a dedicated savings dashboard route from homepage driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const savingsPage = await readFile(new URL('../src/app/savings-dashboard/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const savingsDashboard = /);
    assert.match(demoData, /monthToDate/);
    assert.match(demoData, /districtSavings/);
    assert.match(marketShell, /\/savings-dashboard/);
    assert.match(marketShell, /savingsDashboard\.watchpoints\.map/);
    assert.match(savingsPage, /savingsDashboard\.districtSavings\.map/);
    assert.match(savingsPage, /Priority watchpoints/);
  });

  it('surfaces a dedicated account profile route from homepage driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const accountPage = await readFile(new URL('../src/app/account/page.tsx', import.meta.url), 'utf8');
    const profilePage = await readFile(new URL('../src/app/account/profile/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const accountProfile = /);
    assert.match(demoData, /profileCompleteness/);
    assert.match(demoData, /routeLinks/);
    assert.match(marketShell, /\/account\/profile/);
    assert.match(marketShell, /accountProfile\.routeLinks\.map/);
    assert.match(accountPage, /accountProfile\.shopperName/);
    assert.match(profilePage, /accountProfile\.preferences\.map/);
    assert.match(profilePage, /Connected routes/);
  });


  it('surfaces personal grocery inflation on the savings dashboard', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const savingsPage = await readFile(new URL('../src/app/savings-dashboard/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /calculatePersonalGroceryInflation/);
    assert.match(demoData, /export const personalGroceryInflation = /);
    assert.match(demoData, /weeklyBasket\.map/);
    assert.match(marketShell, /personalGroceryInflation\.inflationPercent/);
    assert.match(savingsPage, /personalGroceryInflation\.itemContributions\.map/);
    assert.match(savingsPage, /Personal grocery inflation/);
  });


  it('surfaces deal score verdicts on product detail routes', async () => {
    const productPage = await readFile(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8');

    assert.match(productPage, /calculateDealScore/);
    assert.match(productPage, /scoreBand/);
    assert.match(productPage, /Deal Score/);
    assert.match(productPage, /scoreBand\(dealScore\)/);
    assert.match(productPage, /verdict/);
  });

  it('surfaces category deal leaders on category routes and homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const categoriesPage = await readFile(new URL('../src/app/categories/page.tsx', import.meta.url), 'utf8');
    const categoryPage = await readFile(new URL('../src/app/categories/[slug]/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /summarizeCategoryDealLeaders/);
    assert.match(demoData, /export const categoryDealLeaders = /);
    assert.match(marketShell, /categoryDealLeaders\.map/);
    assert.match(marketShell, /Category deal leaders/);
    assert.match(categoriesPage, /categoryDealLeaders/);
    assert.match(categoryPage, /categoryDealLeaders/);
  });


  it('surfaces smart swaps on product detail routes', async () => {
    const productPage = await readFile(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8');

    assert.match(productPage, /recommendSmartSwaps/);
    assert.match(productPage, /buildSmartSwapInput/);
    assert.match(productPage, /Smart swaps/);
    assert.match(productPage, /smartSwaps\.map/);
    assert.match(productPage, /qualityRisk/);
  });

  it('surfaces cheapest-chain matched products on product and compare routes', async () => {
    const productPage = await readFile(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8');
    const comparePage = await readFile(new URL('../src/app/compare/page.tsx', import.meta.url), 'utf8');
    const axfoodProducts = await readFile(new URL('../src/lib/axfood-products.ts', import.meta.url), 'utf8');

    assert.match(axfoodProducts, /export const axfoodProducts/);
    assert.match(productPage, /axfoodProducts/);
    assert.match(productPage, /findCheapestChainMatch/);
    assert.match(productPage, /Cheapest chain match/);
    assert.match(productPage, /lowestChain/);
    assert.match(productPage, /spreadPct/);
    assert.match(comparePage, /Cheapest chain per product/);
    assert.match(comparePage, /lowestChain/);
    assert.match(comparePage, /chains\.willys/);
    assert.match(comparePage, /chains\.hemkop/);
  });
});
