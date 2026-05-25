import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const appFiles = [
  'src/app/page.tsx',
  'src/app/products/page.tsx',
  'src/app/products/[slug]/page.tsx',
  'src/app/product/[id]/page.tsx',
  'src/app/favorites/page.tsx',
  'src/app/stores/page.tsx',
  'src/app/stores/[slug]/page.tsx',
  'src/app/categories/page.tsx',
  'src/app/categories/[slug]/page.tsx',
  'src/app/compare/page.tsx',
  'src/app/catalogue-savings/page.tsx',
  'src/app/chain-index/page.tsx',
  'src/app/chain-coverage/page.tsx',
  'src/app/coverage/page.tsx',
  'src/app/map/page.tsx',
  'src/app/my-flyer/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/data-sources/page.tsx',
  'src/app/store-coverage/page.tsx',
  'src/app/openprices-depth/page.tsx',
  'src/app/pricing/page.tsx',
  'src/app/[country]/complaint-helper/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/admin/moderation/page.tsx',
  'src/components/market-shell.tsx',
  'src/components/settings-data-export-actions.tsx',
  'src/components/data-ui.tsx',
  'src/lib/verified-data.ts'
];

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

async function fileExists(relative) {
  try {
    await access(new URL(`../${relative}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
}

describe('verified-data UI', () => {
  it('ships the requested grouped desktop navigation without legacy personal-product links', async () => {
    const nav = await read('src/components/app-nav.tsx');

    assert.match(nav, /t\('app-nav\.groups\.markets'\)[\s\S]*label: 'Screener'/);
    assert.match(nav, /t\('app-nav\.groups\.products'\)[\s\S]*t\('app-nav\.items\.browse'\)[\s\S]*t\('app-nav\.items\.compare'\)/);
    assert.match(nav, /t\('app-nav\.groups\.stores'\)[\s\S]*t\('app-nav\.items\.map'\)/);
    assert.match(nav, /t\('app-nav\.groups\.trip'\)[\s\S]*t\('app-nav\.items\.currentList'\)[\s\S]*t\('app-nav\.items\.nearbyDeals'\)[\s\S]*t\('app-nav\.items\.watchlist'\)/);
    assert.match(nav, /t\('app-nav\.groups\.personal'\)[\s\S]*t\('app-nav\.items\.savings'\)[\s\S]*t\('app-nav\.items\.myFlyer'\)[\s\S]*t\('app-nav\.items\.weeklyBasket'\)[\s\S]*t\('app-nav\.items\.mealPlanner'\)[\s\S]*href: '\/contact'/);
    assert.match(nav, /aria-haspopup="true"/);
    assert.match(nav, /group-focus-within:visible/);
    assert.match(nav, /group-hover:visible/);
    assert.match(nav, /from 'lucide-react'/);
    assert.doesNotMatch(nav, /label: 'Compare items'|label: 'Alerts'|label: 'Favorites'|label: 'Favourites'|label: 'Shopping list'|label: 'Basket'/);
  });

  it('keeps core routes backed by generated verified datasets', async () => {
    for (const file of appFiles) assert.ok((await read(file)).length > 0, `${file} should not be empty`);
    const verified = await read('src/lib/verified-data.ts');
    assert.match(verified, /axfoodProducts/);
    assert.match(verified, /pricedProducts/);
    assert.match(verified, /osmStores/);
    assert.match(verified, /matchedChainProducts/);
    assert.match(verified, /sourceCoverage/);
  });


  it('renders the authenticated MyFlyer route from a server digest snapshot', async () => {
    const route = await read('src/app/my-flyer/page.tsx');
    assert.match(route, /getCachedMyFlyerPayload/);
    assert.match(route, /Ranking controls/);
    assert.match(route, /Delivery surfaces/);
    assert.match(route, /email, push, print, PDF, and share/);
    assert.doesNotMatch(route, /useState|useEffect/);
  });

  it('ships a signed-in profile page for display name, password, and creation date controls', async () => {
    const profile = await read('src/app/profile/page.tsx');

    assert.match(profile, /\/api\/settings\/profile/);
    assert.match(profile, /\/api\/settings\/profile\/password/);
    assert.match(profile, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(profile, /Save display name/);
    assert.match(profile, /Change password/);
    assert.match(profile, /formatAccountDate/);
    assert.match(profile, /accountCreatedAt/);
    assert.match(profile, /No anonymous profile reads or account changes/);
    assert.doesNotMatch(profile, /console\./);
    assert.doesNotMatch(profile, /demo-data|sample-data|mock session/i);
  });

  it('renders the consent banner visible in the first HTML pass to avoid homepage CLS', async () => {
    const consentManager = await read('src/components/consent-manager.tsx');
    assert.match(consentManager, /useState\(true\)/);
    assert.match(consentManager, /Cookie consent banner/);
  });

  it('removes rendered dependencies on old demo and sample drivers', async () => {
    const renderedSources = await Promise.all(appFiles.map(read));
    const joined = renderedSources.join('\n');
    assert.doesNotMatch(joined, /@\/lib\/demo-data/);
    assert.doesNotMatch(joined, /@\/components\/sample-data/);
    assert.doesNotMatch(joined, /products \} from ['"]@\/lib\/demo-data/);
  });

  it('surfaces latest_prices availability as an out-of-stock product card badge', async () => {
    const productCards = await read('src/components/product-price-cards.tsx');
    const productsPage = await read('src/app/products/page.tsx');
    const lazyItemCard = await read('src/components/LazyItemCard.tsx');
    const verified = await read('src/lib/verified-data.ts');
    const substitutions = await read('src/lib/substitutions.ts');
    const storePage = await read('src/app/stores/[slug]/page.tsx');

    assert.match(productCards, /card\.isAvailable === false/);
    assert.match(productCards, /Out of stock/);
    assert.match(productCards, /substitutionPlansForUnavailableProducts/);
    assert.match(productCards, /data-store-substitution-suggestions/);
    assert.match(productsPage, /VirtualizedProductGrid/);
    assert.match(productsPage, /product\.isAvailable === false/);
    assert.match(lazyItemCard, /product\.isAvailable === false/);
    assert.match(lazyItemCard, /Out of stock/);
    assert.match(verified, /isAvailable/);
    assert.match(verified, /outOfStockLatestPriceCount/);
    assert.match(substitutions, /substitutionSuggestionsForUnavailableProduct/);
    assert.match(substitutions, /nutritionImpactLabel/);
    assert.match(storePage, /Selected-store substitutions/);
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


  it('ships signed-in household plan controls without anonymous private rows', async () => {
    const household = await read('src/app/household/page.tsx');
    const actions = await read('src/components/household-plan-actions.tsx');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(household, /HouseholdPlanActions/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/households\/current\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /method: 'GET'/);
    assert.match(actions, /method: 'PUT'/);
    assert.match(actions, /\/api\/households\/join\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /\/api\/households\/current\/basket\/check\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /inviteToken/);
    assert.match(actions, /checkedAt/);
    assert.match(actions, /checkedBy/);
    assert.match(actions, /householdId/);
    assert.match(actions, /weeklyBudget/);
    assert.match(actions, /approvalLimit/);
    assert.match(actions, /members/);
    assert.match(actions, /basketItems/);
    assert.match(actions, /sharedFavoriteStoreIds/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous household writes/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(server, /Household plan not found/);
  });

  it('surfaces shareable household lists with role-based permission guardrails', async () => {
    const household = await read('src/app/household/page.tsx');
    const core = await read('../../packages/core/src/index.ts');

    assert.match(core, /planShareableHouseholdList/);
    assert.match(core, /external_invite_cannot_edit/);
    assert.match(core, /requester_not_household_member/);
    assert.match(household, /shareableHouseholdListContract/);
    assert.match(household, /Shareable household lists/);
    assert.match(household, /role-based permissions/);
    assert.match(household, /No anonymous household edits/);
    assert.match(household, /viewer/);
    assert.match(household, /editor/);
    assert.doesNotMatch(household, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('renders collaborative household list activity for add, check, edit, and remove events', async () => {
    const household = await read('src/app/household/page.tsx');
    const activityStream = await read('src/components/activity-stream.tsx');
    const activityLog = await read('src/lib/activity-log.ts');

    assert.match(household, /ActivityStream/);
    assert.match(household, /householdActivityTimeline/);
    assert.match(household, /item_added/);
    assert.match(household, /item_checked/);
    assert.match(household, /item_edited/);
    assert.match(household, /item_removed/);
    assert.match(activityStream, /Collaborator additions, removals, price alert changes, and completed items/);
    assert.match(activityStream, /sortSharedListActivityEvents/);
    assert.match(activityLog, /'item_added'/);
    assert.match(activityLog, /'item_completed'/);
    assert.match(activityLog, /'price_alert_changed'/);
    assert.match(activityLog, /publishSharedListItemChecked/);
    assert.match(activityLog, /publishSharedListItemEdited/);
  });

  it('ships signed-in scanner upload and barcode processing controls without anonymous uploads', async () => {
    const scanner = await read('src/app/scanner/page.tsx');
    const actions = await read('src/components/scanner-upload-actions.tsx');
    const history = await read('src/components/ocr-scan-history-timeline.tsx');
    const helper = await read('src/lib/scanner-history.ts');
    const scanning = await read('../../packages/scanning/src/index.ts');

    assert.match(scanner, /ScannerUploadActions/);
    assert.match(scanner, /OcrScanHistoryTimeline/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/scans\/upload-url\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /\/api\/scans\/process\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /kind: 'receipt'/);
    assert.match(actions, /kind: 'barcode'/);
    assert.match(actions, /contentType/);
    assert.match(actions, /byteLength/);
    assert.match(actions, /private upload ticket/);
    assert.match(actions, /review work items/);
    assert.match(actions, /navigator\.mediaDevices\.getUserMedia/);
    assert.match(actions, /facingMode: \{ ideal: 'environment' \}/);
    assert.match(actions, /document\.createElement\('canvas'\)/);
    assert.match(actions, /canvas\.toBlob/);
    assert.match(actions, /fetch\(ticket\.uploadUrl/);
    assert.match(actions, /method: 'PUT'/);
    assert.match(actions, /headers: ticket\.headers/);
    assert.match(actions, /body: blob/);
    assert.match(actions, /payload: ticket\.payloadUri/);
    assert.match(actions, /Submit receipt image/);
    assert.match(actions, /Stop receipt camera/);
    assert.match(actions, /Camera access stays local/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous scan uploads/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(history, /'use client'/);
    assert.match(history, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(history, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(history, /fetchScannerHistory/);
    assert.match(history, /correctionStatusFilters/);
    assert.match(history, /filterScannerHistoryByCorrectionStatus/);
    assert.match(history, /aria-pressed=\{active\}/);
    assert.match(history, /redacted fallback/);
    assert.match(helper, /CorrectionStatusFilter/);
    assert.match(helper, /normalizeCorrectionStatus/);
    assert.match(helper, /filterScannerHistoryByCorrectionStatus/);
    assert.match(helper, /export_ready/);
    assert.match(helper, /\/api\/scans\/history\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(helper, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(helper, /cache: 'no-store'/);
    assert.match(scanning, /No scan upload storage provider configured/);
  });



  it('surfaces premium OCR scan history on scanner and pricing routes', async () => {
    const scanner = await read('src/app/scanner/page.tsx');
    const pricing = await read('src/app/pricing/page.tsx');
    const seo = await read('src/lib/seo.ts');
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(scanner, /premiumOcrScanHistory/);
    assert.match(scanner, /OCR scan history and advanced corrections/);
    assert.match(scanner, /active premium entitlement/);
    assert.match(scanner, /href="\/pricing"/);
    assert.match(pricing, /premium OCR history/i);
    assert.match(pricing, /premiumEntitlementCatalog/);
    assert.match(pricing, /Premium features fail closed until subscription access is active/);
    assert.match(pricing, /routeMetadata\('\/pricing'\)/);
    assert.match(seo, /'\/pricing'/);
    assert.match(sitemap, /entry\('\/pricing'/);
  });

  it('surfaces receipt-fed commodity alias growth without exposing private receipts', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const scanner = await read('src/app/scanner/page.tsx');

    assert.match(verified, /planReceiptAliasGrowth/);
    assert.match(verified, /receiptFedAliasGrowthPlan/);
    assert.match(verified, /chain label \+ kr \+ weight/);
    assert.match(verified, /create_commodity_alias_candidate/);
    assert.match(scanner, /receiptFedAliasGrowthPlan/);
    assert.match(scanner, /Receipt-fed commodity alias growth/);
    assert.match(scanner, /chain label \+ kr \+ weight/);
    assert.match(scanner, /human review/i);
    assert.match(scanner, /No private receipt images/);
    assert.doesNotMatch(scanner, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('ships signed-in privacy request controls without destructive anonymous actions', async () => {
    const privacy = await read('src/app/privacy/page.tsx');
    const actions = await read('src/components/privacy-request-actions.tsx');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(privacy, /PrivacyRequestActions/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/privacy\/export\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /\/api\/privacy\/deletion-plan\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /\/api\/privacy\/request-fulfillment\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /data_export/);
    assert.match(actions, /account_deletion/);
    assert.match(actions, /ad_data_opt_out/);
    assert.match(actions, /destructiveAction: false/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous privacy requests/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(server, /requiresReauthentication: true/);
  });

  it('ships a signed-in settings data export download without anonymous private rows', async () => {
    const settings = await read('src/app/settings/page.tsx');
    const actions = await read('src/components/settings-data-export-actions.tsx');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(settings, /SettingsDataExportActions/);
    assert.match(settings, /Download my data/);
    assert.match(settings, /Delete my account/);
    assert.match(settings, /lists, alerts, preferences, and analytics events/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/settings\/data-export\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /method: 'GET'/);
    assert.match(actions, /new Blob\(\[JSON\.stringify\(payload, null, 2\)\]/);
    assert.match(actions, /link\.download = `groceryview-data-export-\$\{userId\}\.json`/);
    assert.match(actions, /window\.confirm\('Delete my account\? This removes your lists, alerts, preferences, and account profile\.'/);
    assert.match(actions, /\/api\/settings\/account\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /method: 'DELETE'/);
    assert.match(actions, /body: JSON\.stringify\(\{ confirmation: 'DELETE ACCOUNT' \}\)/);
    assert.match(actions, /No anonymous account deletion/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous data exports/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.match(server, /\/api\/settings\/data-export/);
    assert.match(server, /\/api\/settings\/account/);
  });

  it('persists dietary profile onboarding from settings for personalization', async () => {
    const settings = await read('src/app/settings/page.tsx');
    const picker = await read('src/components/diet-filter-picker.tsx');
    const preferences = await read('src/lib/user-preferences.ts');

    assert.match(settings, /DietaryProfileOnboarding/);
    assert.match(settings, /Dietary profile for onboarding and settings edits/);
    assert.match(settings, /Save dietary exclusions, certification preferences, and nutrition priorities/);
    assert.match(picker, /export function DietaryProfileOnboarding/);
    assert.match(picker, /Allergy preferences/);
    assert.match(picker, /Diet preferences/);
    assert.match(picker, /Avoided ingredients/);
    assert.match(picker, /Default nutrition priorities/);
    assert.match(picker, /saveDietaryProfilePreferences/);
    assert.match(preferences, /DIETARY_PROFILE_STORAGE_KEY/);
    assert.match(preferences, /DietaryProfilePreferences/);
    assert.match(preferences, /allergies: string\[\]/);
    assert.match(preferences, /diets: string\[\]/);
    assert.match(preferences, /avoidedIngredients: string\[\]/);
    assert.match(preferences, /nutritionPriorities: string\[\]/);
    assert.match(preferences, /onboardingCompleted/);
  });

  it('wires MyFlyer account preferences to the API without local-only persistence', async () => {
    const page = await read('src/app/[country]/my-flyer/page.tsx');
    const preferences = await read('src/app/[country]/my-flyer/my-flyer-preferences.tsx');
    const api = await read('src/app/api/my-flyer/route.ts');

    assert.match(page, /MyFlyerPreferences/);
    assert.match(preferences, /Country/);
    assert.match(preferences, /FavoriteStorePicker/);
    assert.match(preferences, /Home location/);
    assert.match(preferences, /Household size/);
    assert.match(preferences, /MyFlyer account diet filters/);
    assert.match(preferences, /Algorithm choice/);
    assert.match(preferences, /fetch\('\/api\/my-flyer'/);
    assert.match(preferences, /Authorization: `Bearer \$\{session\.accessToken\}`/);
    assert.match(preferences, /favorite_stores: splitStores\(favoriteStores\)/);
    assert.match(preferences, /home_location: homeLocation/);
    assert.match(preferences, /household_size: householdSize/);
    assert.match(preferences, /diet_filters: dietFilters/);
    assert.doesNotMatch(preferences, /localStorage\.setItem|writeStoredDietFilters|writeStoredAlgorithmChoice/);
    assert.match(api, /export async function PATCH/);
    assert.match(api, /preferencesSchema/);
    assert.match(api, /favorite_stores/);
    assert.match(api, /home_location/);
    assert.match(api, /household_size/);
    assert.match(api, /diet_filters/);
  });

  it('provides skippable first-time MyFlyer setup that fills user_preferences', async () => {
    const page = await read('src/app/[country]/my-flyer/setup/page.tsx');
    const wizard = await read('src/app/[country]/my-flyer/setup/setup-wizard.tsx');
    const flyer = await read('src/app/[country]/my-flyer/page.tsx');

    assert.match(page, /MyFlyerSetupWizard/);
    assert.match(page, /routeCountry=\{country \|\| 'se'\}/);
    assert.match(wizard, /Step 1/);
    assert.match(wizard, /Pick country/);
    assert.match(wizard, /Step 2/);
    assert.match(wizard, /FavoriteStorePicker/);
    assert.match(wizard, /Step 3/);
    assert.match(wizard, /Pick algorithm/);
    assert.match(wizard, /routeCountryAliases/);
    assert.match(wizard, /USER_PREFERENCES_STORAGE_KEY/);
    assert.match(wizard, /window\.localStorage\.setItem\(USER_PREFERENCES_STORAGE_KEY/);
    assert.match(wizard, /country: selectedCountry/);
    assert.match(wizard, /favorite_stores: selectedFavoriteStores/);
    assert.match(wizard, /algorithm_choice: normalizeAlgorithmChoice\(selectedAlgorithm\)/);
    assert.match(wizard, /my_flyer_onboarding_completed: true/);
    assert.match(wizard, /my_flyer_onboarding_skipped/);
    assert.match(wizard, /groceryview:user-preferences-changed/);
    assert.match(wizard, /fetch\('\/api\/my-flyer'/);
    assert.match(wizard, /Skip setup/);
    assert.match(wizard, /Skip step/);
    assert.match(flyer, /href=\{`\/\$\{country\}\/my-flyer\/setup`\}/);
  });

  it('maps purchase history CSV imports into settings personalization and budget seeds', async () => {
    const settings = await read('src/app/settings/page.tsx');
    const bulkImport = await read('src/components/BulkImportDialog.tsx');
    const recurringBasket = await read('src/lib/recurring-basket.ts');

    assert.match(settings, /BulkImportDialog/);
    assert.match(settings, /importMode="purchase-history"/);
    assert.match(settings, /Import purchase history for recommendations and budgets/);
    assert.match(bulkImport, /parsePurchaseHistoryCsv/);
    assert.match(bulkImport, /buildPurchaseHistoryImportPreview/);
    assert.match(bulkImport, /data-import-mode=\{importMode\}/);
    assert.match(bulkImport, /Map purchase history/);
    assert.match(recurringBasket, /PurchaseHistoryImportRow/);
    assert.match(recurringBasket, /parsePurchaseHistoryCsv/);
    assert.match(recurringBasket, /recommendationSeed/);
    assert.match(recurringBasket, /budgetSeedLabel/);
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
    const bestTimeRoute = await read('src/app/api/alerts/best-time/route.ts');
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
    assert.match(account, /planAccountDeletion/);
    assert.match(account, /accountDeletionPlan/);
    assert.match(account, /Deletion plan requires owner confirmation/);
    assert.match(account, /Destructive action gated/);
    assert.match(account, /Type DELETE ACCOUNT/);
    assert.match(account, /reauthenticates/);
    assert.match(account, /action="\/api\/alerts\/best-time"/);
    assert.match(account, /name="targetStores"/);
    assert.match(account, /name="categories"/);
    assert.match(account, /name="confidenceThreshold"/);
    assert.match(bestTimeRoute, /request\.formData\(\)/);
    assert.match(bestTimeRoute, /ruleInputs/);
    assert.match(bestTimeRoute, /recommendation: recommendation \?/);
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

  it('surfaces account-bound favorites sorted by name or cheapest price', async () => {
    const page = await read('src/app/favorites/page.tsx');
    const nav = await read('src/components/app-nav.tsx');
    const apiRoute = await read('../../apps/api/src/routes/favorites.ts');
    const dbQuery = await read('../../packages/db/src/queries/favorites.ts');

    assert.match(page, /watchlistHeartProducts/);
    assert.match(page, /favoriteItems/);
    assert.match(page, /sort=price/);
    assert.match(page, /sort=name/);
    assert.match(page, /current cheapest price/i);
    assert.match(page, /cheapestStoreName/);
    assert.match(page, /signed-in/i);
    assert.match(page, /No anonymous favorites/);
    assert.doesNotMatch(nav, /href: '\/favorites'/);
    assert.match(apiRoute, /favoritesRoutes/);
    assert.match(apiRoute, /users\/\{userId\}\/favorites/);
    assert.match(apiRoute, /sort: \['name', 'price'\]/);
    assert.match(dbQuery, /watchlist_items/);
    assert.match(dbQuery, /latest_prices/);
    assert.match(dbQuery, /row_number\(\) over \(partition by latest_prices\.product_id/);
    assert.match(dbQuery, /coalesce\(latest_prices\.is_available, true\) = true/);
    assert.doesNotMatch(page, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('ships account billing controls for signed-in checkout and subscription management', async () => {
    const account = await read('src/app/account/page.tsx');
    const billingActions = await read('src/components/account-billing-actions.tsx');

    assert.match(account, /AccountBillingActions/);
    assert.match(billingActions, /'use client'/);
    assert.match(billingActions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(billingActions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(billingActions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(billingActions, /\/api\/account\/subscription-access\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(billingActions, /\/api\/billing\/checkout-sessions\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(billingActions, /\/api\/billing\/portal-sessions\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(billingActions, /premium_monthly/);
    assert.match(billingActions, /premium_yearly/);
    assert.match(billingActions, /checkoutUrl/);
    assert.match(billingActions, /portalUrl/);
    assert.match(billingActions, /window\.location\.assign/);
    assert.match(billingActions, /Sign in first/);
    assert.match(billingActions, /No anonymous billing sessions/);
    assert.doesNotMatch(billingActions, /STRIPE_SECRET_KEY|sk_test|clientSecret/);
    assert.doesNotMatch(billingActions, /localStorage\.setItem\('groceryview:userId'/);
  });

  it('surfaces busy-professional saved basket auto-reorder planning without anonymous checkout', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const account = await read('src/app/account/page.tsx');
    const actions = await read('src/components/account-mutation-actions.tsx');

    assert.match(verified, /export const savedBasketAutoReorderPlanner = /);
    assert.match(verified, /planRecurringBasketDigest/);
    assert.match(verified, /autoReorderDecision/);
    assert.match(verified, /missingCurrentPrice|missing-price blockers/);
    assert.match(account, /savedBasketAutoReorderPlanner/);
    assert.match(account, /Saved basket auto-reorder/);
    assert.match(account, /signed-in shopper confirmation/i);
    assert.match(account, /not automatic purchase/i);
    assert.match(account, /missing-price blockers/i);
    assert.match(actions, /Plan auto-reorder/);
    assert.match(actions, /\/api\/basket\/recurring-digest\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /templateId/);
    assert.match(actions, /templateName/);
    assert.match(actions, /cadence=weekly/);
    assert.match(actions, /method: 'GET'/);
    assert.match(actions, /Auto-reorder plan prepared for the signed-in account/);
    assert.match(actions, /No anonymous auto-reorder/);
    assert.doesNotMatch(actions, /checkout|purchaseNow|retailerSessionToken/);
    assert.doesNotMatch(account, /@\/lib\/demo-data/);
  });

  it('stores adaptive alert preferences with cadence, channel, and sensitivity guardrails', async () => {
    const account = await read('src/app/account/page.tsx');
    const route = await read('src/app/api/alerts/preferences/route.ts');

    assert.match(account, /Adaptive alert preferences/);
    assert.match(account, /\/api\/alerts\/preferences/);
    assert.match(account, /name="cadence"/);
    assert.match(account, /daily_digest/);
    assert.match(account, /weekly_digest/);
    assert.match(account, /name="channels"/);
    assert.match(account, /in_app_digest/);
    assert.match(account, /name="sensitivity"/);
    assert.match(account, /Save alert profile/);
    assert.match(route, /groceryViewAlertPreferencesProfiles/);
    assert.match(route, /maxDailyAlerts/);
    assert.match(route, /baselineThreshold/);
    assert.match(route, /tuneRollingAverageAlertThreshold/);
    assert.match(route, /cadence must be immediate, daily_digest, weekly_digest, or paused/);
    assert.match(route, /At least one delivery channel is required unless alerts are paused/);
  });


  it('ships signed-in ad disclosure controls without anonymous sponsored-ranking state', async () => {
    const account = await read('src/app/account/page.tsx');
    const actions = await read('src/components/ad-disclosure-actions.tsx');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(account, /AdDisclosureActions/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/ads\/disclosure\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /method: 'GET'/);
    assert.match(actions, /premiumAdsRemoved/);
    assert.match(actions, /excludedSurfaces/);
    assert.match(actions, /organicRankingSeparated/);
    assert.match(actions, /Sponsored placements cannot change Deal Score/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous ad disclosure/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(server, /\/api\/ads\/disclosure/);
  });



  it('ships signed-in coupon and loyalty offer controls without anonymous savings claims', async () => {
    const couponStacks = await read('src/app/coupon-stacks/page.tsx');
    const actions = await read('src/components/coupon-loyalty-actions.tsx');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(couponStacks, /CouponLoyaltyActions/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/loyalty\/offers\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /\/api\/account\/subscription-access\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /method: 'GET'/);
    assert.match(actions, /totalEligibleSavings/);
    assert.match(actions, /requiresActionCount/);
    assert.match(actions, /needs_coupon/);
    assert.match(actions, /needs_membership/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous coupon offers/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(server, /\/api\/loyalty\/offers/);
    assert.match(server, /\/api\/account\/subscription-access/);
  });


  it('surfaces account-safe loyalty price preference toggles by chain', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/coupon-stacks/page.tsx');

    assert.match(verified, /loyaltyPricePreferenceContract/);
    assert.match(verified, /loyaltyPriceChains/);
    assert.match(verified, /ICA/);
    assert.match(verified, /Willys/);
    assert.match(route, /loyaltyPricePreferenceContract/);
    assert.match(route, /Loyalty price preferences/);
    assert.match(route, /No retailer credentials/);
    assert.match(route, /chainToggles/);
    assert.match(route, /authenticated loyalty prices/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces member-offer aggregation and loyalty points without anonymous point balances', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/coupon-stacks/page.tsx');

    assert.match(verified, /memberOfferAggregationBoard/);
    assert.match(verified, /lidlStoreOffers/);
    assert.match(verified, /matpriskollenOffers/);
    assert.match(verified, /priceType: 'member'/);
    assert.match(verified, /requiresMembershipCard|memberOnly/);
    assert.match(verified, /totalMemberSavings/);
    assert.match(verified, /pointsEarned/);
    assert.match(verified, /pointsStatus/);
    assert.match(verified, /No retailer credentials/);
    assert.match(verified, /not estimate loyalty points|not infer loyalty points/);
    assert.match(route, /memberOfferAggregationBoard/);
    assert.match(route, /Member-offer aggregation/);
    assert.match(route, /price_type='member'/);
    assert.match(route, /pointsEarned/);
    assert.match(route, /No anonymous point balances/);
    assert.doesNotMatch(route, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('ships signed-in price-report human review controls without anonymous moderation', async () => {
    const priceReports = await read('src/app/price-reports/page.tsx');
    const actions = await read('src/components/price-report-review-actions.tsx');
    const communityReviews = await read('src/lib/community-reviews.ts');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(priceReports, /PriceReportReviewActions/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(actions, /\/api\/human-review\/assignments\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /\/api\/human-review\/assignments\/\$\{encodeURIComponent\(assignmentId\)\}\/decisions\?userId=\$\{encodeURIComponent\(userId\)\}/);
    assert.match(actions, /method: 'GET'/);
    assert.match(actions, /method: 'POST'/);
    assert.match(actions, /accept_community_report/);
    assert.match(actions, /dismiss_community_report/);
    assert.match(actions, /needs_more_info/);
    assert.match(actions, /Request more info/);
    assert.match(actions, /status.*in_progress/);
    assert.match(actions, /reviewedByHuman: true/);
    assert.match(actions, /riskScore\?: number \| null/);
    assert.match(actions, /confidenceScore\?: number \| null/);
    assert.match(actions, /hasReviewAssignmentScoring\(assignment\)/);
    assert.match(actions, /reviewAssignmentScoringLabel\(assignment\)/);
    assert.match(communityReviews, /formatReviewAssignmentScore/);
    assert.match(communityReviews, /Risk score \$\{formatReviewAssignmentScore\(assignment\.riskScore\)\}/);
    assert.match(communityReviews, /Confidence score \$\{formatReviewAssignmentScore\(assignment\.confidenceScore\)\}/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous price-report moderation/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(server, /\/api\/human-review\/assignments/);
    assert.match(server, /Session user is not a registered human reviewer/);
  });

  it('surfaces community review prompts on product pages after price reports', async () => {
    const communityReviews = await read('src/lib/community-reviews.ts');
    const actions = await read('src/components/price-report-review-actions.tsx');
    const products = await read('src/app/products/page.tsx');

    assert.match(communityReviews, /COMMUNITY_REVIEW_PROMPTS/);
    assert.match(communityReviews, /price_accuracy/);
    assert.match(communityReviews, /product_quality/);
    assert.match(communityReviews, /store_experience/);
    assert.match(communityReviews, /crowdsourced grocery data becomes more trustworthy/);
    assert.match(actions, /COMMUNITY_REVIEW_PROMPTS/);
    assert.match(actions, /Community validation prompts/);
    assert.match(actions, /aria-label=\{`\$\{prompt\.label\} rating`\}/);
    assert.match(communityReviews, /Price accuracy/);
    assert.match(communityReviews, /Product quality/);
    assert.match(communityReviews, /Store experience/);
    assert.match(products, /PriceReportReviewActions/);
    assert.match(products, /Review prompts after a price report/);
    assert.match(products, /price accuracy, product quality, and store experience/);
    assert.doesNotMatch(products, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('surfaces community review summaries on product result cards', async () => {
    const communityReviews = await read('src/lib/community-reviews.ts');
    const itemGrid = await read('src/components/ItemGrid.tsx');
    const storeProductRow = await read('src/components/store-product-row.tsx');

    assert.match(communityReviews, /CommunityProductReviewSummary/);
    assert.match(communityReviews, /averageRatingLabel/);
    assert.match(communityReviews, /reviewCount/);
    assert.match(communityReviews, /topFreshnessComplaint/);
    assert.match(communityReviews, /communityReviewSummaryForProduct/);
    assert.match(itemGrid, /communityReviewSummaryForProduct\(row\.name\)/);
    assert.match(itemGrid, /community reviews/);
    assert.match(itemGrid, /topFreshnessComplaint/);
    assert.match(storeProductRow, /communityReviewSummaryForProduct\(productName\)/);
    assert.match(storeProductRow, /community review summary/);
  });

  it('surfaces adjustable moderation risk thresholds for admin review routing', async () => {
    const communityReviews = await read('src/lib/community-reviews.ts');
    const moderation = await read('src/app/admin/moderation/page.tsx');

    assert.match(communityReviews, /export const MODERATION_RISK_THRESHOLDS/);
    assert.match(communityReviews, /moderationRiskBand/);
    assert.match(communityReviews, /MODERATION_RISK_THRESHOLDS\.high/);
    assert.match(communityReviews, /MODERATION_RISK_THRESHOLDS\.medium/);
    assert.match(moderation, /MODERATION_RISK_THRESHOLDS/);
    assert.match(moderation, /Moderation risk threshold guidance/);
    assert.match(moderation, /High risk starts at/);
    assert.match(moderation, /Threshold configuration/);
    assert.doesNotMatch(moderation, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('links admin source health to ingestion runs without public nav clutter', async () => {
    const sources = await read('src/app/admin/sources/page.tsx');
    const nav = await read('src/components/app-nav.tsx');

    assert.match(sources, /href="\/admin\/ingestion-runs"/);
    assert.match(sources, /View ingestion runs/);
    assert.doesNotMatch(nav, /\/admin\/ingestion-runs/);
  });


  it('surfaces crowd price submissions with photo evidence and trust guardrails', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const priceReports = await read('src/app/price-reports/page.tsx');

    assert.match(verified, /export const crowdPriceSubmissionContract/);
    assert.match(verified, /planCommunityReportAbuseControls/);
    assert.match(verified, /community_reporter_trust/);
    assert.match(verified, /photoEvidence/);
    assert.match(verified, /reportedPrice/);
    assert.match(priceReports, /crowdPriceSubmissionContract/);
    assert.match(priceReports, /Crowd price submissions/);
    assert.match(priceReports, /photo/i);
    assert.match(priceReports, /reportedPrice/);
    assert.match(priceReports, /manual review/i);
    assert.match(priceReports, /No anonymous price reports/);
    assert.doesNotMatch(priceReports, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('surfaces commodity mapping review through human_review_assignments without shopper exposure', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const priceReports = await read('src/app/price-reports/page.tsx');
    const actions = await read('src/components/price-report-review-actions.tsx');
    const core = await read('../../packages/core/src/index.ts');

    assert.match(core, /commodity_mapping/);
    assert.match(core, /approve_commodity_mapping/);
    assert.match(verified, /commodityMappingReviewPlan/);
    assert.match(verified, /planHumanReviewQueue/);
    assert.match(verified, /planHumanReviewAssignments/);
    assert.match(verified, /human_review_assignments/);
    assert.match(verified, /community_reporter_trust/);
    assert.match(priceReports, /Commodity mapping review/);
    assert.match(priceReports, /low-confidence maps/i);
    assert.match(priceReports, /not shown to shoppers/i);
    assert.match(priceReports, /human_review_assignments/);
    assert.match(priceReports, /community_reporter_trust/);
    assert.match(actions, /commodity_mapping/);
    assert.match(actions, /approve_commodity_mapping/);
    assert.doesNotMatch(priceReports, /@\/lib\/demo-data|@\/components\/sample-data/);
  });



  it('surfaces the fuel OSM station connector alongside operator fuel prices', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const fuelRoute = await read('src/app/fuel/page.tsx');
    const overpass = await read('../../packages/ingestion/src/connectors/overpass.ts');
    const brandedFuelConnector = await read('../../packages/ingestion/src/connectors/fuel-stations.ts');
    const fuelArtifact = await read('src/lib/ingested/fuel-stations.ts');

    assert.match(overpass, /fetchOverpassFuelStations/);
    assert.match(overpass, /amenity"="fuel/);
    assert.match(brandedFuelConnector, /SWEDEN_BRANDED_FUEL_STATIONS_OVERPASS_QUERY/);
    assert.match(brandedFuelConnector, /amenity"="fuel/);
    assert.match(brandedFuelConnector, /Circle K/);
    assert.match(brandedFuelConnector, /OKQ8/);
    assert.match(verified, /export const fuelStationSourceCoverage/);
    assert.match(verified, /fetchOverpassFuelStations/);
    assert.match(verified, /amenity=fuel/);
    assert.match(fuelArtifact, /Row count: [1-9][0-9]{2,} real OSM rows/);
    assert.match(fuelArtifact, /fetched with curl from Overpass/);
    assert.match(fuelArtifact, /"latitude"/);
    assert.match(fuelArtifact, /"longitude"/);
    assert.match(fuelRoute, /fuelStationSourceCoverage/);
    assert.match(fuelRoute, /fuelStations\.map/);
    assert.match(fuelRoute, /fuelStationPosition/);
    assert.match(fuelRoute, /fuelStationSource\.chainCounts/);
    assert.match(fuelRoute, /OSM fuel station source/);
    assert.match(fuelRoute, /amenity=fuel/);
    assert.match(fuelRoute, /verifiedFuelPriceObservations/);
    assert.match(fuelRoute, /Fuel prices by grade/);
    assert.match(fuelRoute, /price per litre/);
    assert.match(fuelRoute, /operator domain=fuel observations/);
    assert.doesNotMatch(fuelRoute, /currentPrice|price SEK/);
  });

  it('surfaces fuel target price alerts through the real watchlist engine without station-price claims', async () => {
    const fuelRoute = await read('src/app/fuel/page.tsx');
    const fuelPrices = await read('src/lib/fuel-prices.ts');
    const core = await read('../../packages/core/src/index.ts');

    assert.match(core, /export function buildWatchlistAlerts/);
    assert.match(fuelPrices, /buildWatchlistAlerts/);
    assert.match(fuelPrices, /export const fuelPriceTargetAlerts/);
    assert.match(fuelPrices, /okq8-operator-price-page/);
    assert.match(fuelPrices, /95 E10 alert/);
    assert.match(fuelRoute, /fuelPriceTargetAlerts/);
    assert.match(fuelRoute, /Fuel target price alerts/);
    assert.match(fuelPrices, /target 19 kr\/l/i);
    assert.match(fuelRoute, /target\.targetLabel/);
    assert.match(fuelPrices, /No station-level fuel alert/);
    assert.match(fuelRoute, /fuelPriceTargetAlerts\.guardrails\.map/);
    assert.doesNotMatch(fuelRoute, /near me pump price|synthetic station/i);
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

  it('surfaces online delivery versus in-store totals including explicit fees', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/shopping-trips/page.tsx');

    assert.match(verified, /planBasketTripCost/);
    assert.match(verified, /export const deliveryVsInStoreComparison/);
    assert.match(verified, /deliveryFee/);
    assert.match(verified, /pricedBasketTotal/);
    assert.match(route, /deliveryVsInStoreComparison/);
    assert.match(route, /Online delivery vs in-store total/);
    assert.match(route, /effectiveTotal/);
    assert.match(route, /not a retailer reservation/i);
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


  it('renders a changed-since-last-shop digest from the real recurring basket engine', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/weekly-basket/page.tsx');

    assert.match(verified, /planRecurringBasketDigest/);
    assert.match(verified, /weeklyBasketChangeDigest/);
    assert.match(verified, /currentUnitPrice/);
    assert.match(verified, /previousUnitPrice/);
    assert.match(route, /weeklyBasketChangeDigest/);
    assert.match(route, /Changed-since-last-shop digest/);
    assert.match(route, /changeSummary/);
    assert.match(route, /lineDelta/);
    assert.match(route, /recommendedAction/);
    assert.match(route, /Missing current prices block automatic checkout handoff/);
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

  it('surfaces a meal-prepper bulk-buy unit-price optimizer without price forecasts', async () => {
    const demo = await read('src/lib/demo-data.ts');
    const source = await read('src/app/weekly-basket/page.tsx');

    assert.match(demo, /export const mealPrepBulkBuyOptimizer = /);
    assert.match(demo, /stockUpDecision/);
    assert.match(demo, /paybackMeals/);
    assert.match(demo, /No forecast/);
    assert.match(source, /mealPrepBulkBuyOptimizer/);
    assert.match(source, /Meal-prepper bulk-buy optimizer/);
    assert.match(source, /bulkUnitPrice/);
    assert.match(source, /freezerPortions/);
    assert.match(source, /coverageGuardrails/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a multi-week stock-up list with forecast claims blocked', async () => {
    const demo = await read('src/lib/demo-data.ts');
    const source = await read('src/app/weekly-basket/page.tsx');
    const actions = await read('src/components/stock-up-list-actions.tsx');

    assert.match(demo, /export const multiWeekStockUpList = /);
    assert.match(demo, /observedHistoryWindow/);
    assert.match(demo, /noForecastReason/);
    assert.match(demo, /reviewTrigger/);
    assert.match(source, /multiWeekStockUpList/);
    assert.match(source, /StockUpListActions/);
    assert.match(source, /Multi-week stock-up list/);
    assert.match(source, /planningWeeks/);
    assert.match(source, /No price forecast/);
    assert.match(source, /observedHistoryWindow/);
    assert.match(actions, /groceryview:accessToken/);
    assert.match(actions, /basket\/stock-up-list\/rows/);
    assert.match(actions, /No stock-up row is saved anonymously or to local storage/);
    assert.match(actions, /Historical low and typical prices remain labelled as observed facts, not forecasts/);
    assert.doesNotMatch(source, /future price prediction|forecasted price/i);
  });

  it('surfaces single-shop versus split-shop comparison on the weekly basket route', async () => {
    const source = await read('src/app/weekly-basket/page.tsx');

    assert.match(source, /compareBasketStrategies/);
    assert.match(source, /summarizeStoreBasketCoverage/);
    assert.match(source, /Single vs split shop/);
    assert.match(source, /Best single shop/);
    assert.match(source, /Cheapest split shop/);
    assert.match(source, /savingsVsBestSingleStore/);
    assert.match(source, /ConfidenceBadge/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('ships a no-persistence cross-chain basket calculator from DB-backed current prices', async () => {
    const route = await read('src/app/basket/page.tsx');
    const calculator = await read('src/components/basket-calculator.tsx');
    const seo = await read('src/lib/seo.ts');
    const nav = await read('src/components/app-nav.tsx');

    assert.match(route, /BasketCalculator/);
    assert.match(route, /topChainSpreads\.slice\(0, 12\)/);
    assert.match(route, /chainPriceRows\(product\)/);
    assert.match(route, /postgres\.latest_prices/);
    assert.match(route, /@\/lib\/verified-data/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);

    assert.match(calculator, /'use client'/);
    assert.match(calculator, /useState/);
    assert.match(calculator, /compareBasketStrategies/);
    assert.match(calculator, /summarizeStoreBasketCoverage/);
    assert.match(calculator, /Best full-chain total/);
    assert.match(calculator, /Cheapest split basket/);
    assert.match(calculator, /No state persistence/);
    assert.doesNotMatch(calculator, /localStorage|sessionStorage/);

    assert.match(seo, /'\/basket'/);
    assert.doesNotMatch(nav, /href: '\/basket'/);
  });

  it('shows product price comparison rows across retailer types sorted by effective unit price', async () => {
    const route = await read('src/app/products/[slug]/page.tsx');

    assert.match(route, /chainPriceRows\(product\)/);
    assert.match(route, /matchedChainProducts\.find/);
    assert.match(route, /retailerTypeForChain\(row\.chain/);
    assert.match(route, /fuel_convenience/);
    assert.match(route, /grocery: 'Grocery'/);
    assert.match(route, /pharmacy: 'Pharmacy'/);
    assert.match(route, /variety: 'Variety'/);
    assert.match(route, /cosmetics: 'Cosmetics'/);
    assert.match(route, /row\.effectiveUnitPrice === cheapestEffectiveUnitPrice/);
    assert.match(route, /left\.effectiveUnitPrice - right\.effectiveUnitPrice/);
    assert.match(route, /row\.retailerTypeLabel/);
    assert.match(route, /Rows include grocery, pharmacy, variety, cosmetics/);
    assert.doesNotMatch(route, /@\/lib\/demo-data|@\/components\/sample-data/);
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

  it('surfaces a busy professional one-tap basket optimizer using real basket strategy output', async () => {
    const source = await read('src/app/weekly-basket/page.tsx');
    const demo = await read('src/lib/demo-data.ts');

    assert.match(demo, /oneTapBasketOptimizer/);
    assert.match(demo, /compareBasketStrategies/);
    assert.match(demo, /summarizeStoreBasketCoverage/);
    assert.match(demo, /readyAction/);
    assert.match(demo, /checkoutGuardrails/);
    assert.match(source, /oneTapBasketOptimizer/);
    assert.match(source, /One-tap basket optimizer/);
    assert.match(source, /readyAction/);
    assert.match(source, /checkoutGuardrails/);
    assert.match(source, /signed-in/i);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces signed-in saved-basket auto-reorder readiness without automatic checkout', async () => {
    const source = await read('src/app/weekly-basket/page.tsx');
    const demo = await read('src/lib/demo-data.ts');

    assert.match(demo, /savedBasketAutoReorderPlan/);
    assert.match(demo, /compareBasketStrategies/);
    assert.match(demo, /autoReorderEligibleLines/);
    assert.match(demo, /manualReviewRequired/);
    assert.match(demo, /No retailer checkout or payment is submitted automatically/);
    assert.match(source, /savedBasketAutoReorderPlan/);
    assert.match(source, /Saved basket auto-reorder readiness/);
    assert.match(source, /autoReorderEligibleLines/);
    assert.match(source, /manualReviewRequired/);
    assert.match(source, /No retailer checkout or payment is submitted automatically/);
    assert.match(source, /signed-in saved basket/i);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces loyalty-adjusted basket comparison using eligible member prices only', async () => {
    const source = await read('src/app/weekly-basket/page.tsx');
    const demo = await read('src/lib/demo-data.ts');
    const core = await read('../../packages/core/src/index.ts');

    assert.match(core, /enabledMemberStoreIds/);
    assert.match(core, /excludedMemberPriceProductIds/);
    assert.match(demo, /loyaltyAdjustedBasketComparison/);
    assert.match(demo, /compareBasketStrategies/);
    assert.match(demo, /enabledMemberStoreIds/);
    assert.match(demo, /priceType: 'member'/);
    assert.match(source, /loyaltyAdjustedBasketComparison/);
    assert.match(source, /Loyalty-adjusted basket comparison/);
    assert.match(source, /memberSavingsTotal/);
    assert.match(source, /excludedMemberPriceProductIds/);
    assert.match(source, /member prices are only counted for enabled loyalty chains/i);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces cross-chain commodity comparison by comparable unit on compare and product routes', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const chainCompare = await read('src/lib/chain-compare.ts');
    const compare = await read('src/app/compare/page.tsx');
    const product = await read('src/app/products/[slug]/page.tsx');

    assert.match(verified, /compareCommodityUnitPrices/);
    assert.match(verified, /commodityComparisons/);
    assert.match(verified, /commodityComparisonForProduct/);
    assert.match(verified, /commodity\/alias match/);
    assert.match(chainCompare, /commodityComparisonForProduct/);
    assert.match(chainCompare, /matchType: 'commodity_alias'/);
    assert.match(chainCompare, /unitLabel: `commodity\/alias kr\/\$\{comparableUnit\}`/);
    assert.match(compare, /commodityComparisons/);
    assert.match(compare, /Cross-chain commodity comparison/);
    assert.match(compare, /Commodity\/alias unit-price matches/);
    assert.match(compare, /Packaged\/barcode matches/);
    assert.match(compare, /sourceConfidence \{formatPct\(cell\.sourceConfidence \* 100\)\}/);
    assert.match(compare, /kr\/\{comparison\.comparableUnit\}/);
    assert.match(product, /commodityComparisonForProduct/);
    assert.match(product, /Cheapest chain for this commodity/);
    assert.match(product, /sourceConfidence/);
    assert.doesNotMatch(compare, /NoVerifiedData/);
  });

  it('renders distinct shelf and counter price labels on product pages', async () => {
    const product = await read('src/app/products/[slug]/page.tsx');

    assert.match(product, /function counterPriceLabelFor/);
    assert.match(product, /priceKind === 'counter_fish'/);
    assert.match(product, /Counter fish price/);
    assert.match(product, /priceKind === 'counter_deli'/);
    assert.match(product, /Counter deli price/);
    assert.match(product, /Shelf price/);
    assert.match(product, /counterPriceLabelFor\(row\)/);
  });

  it('surfaces per-chain source attribution below product price tables', async () => {
    const product = await read('src/app/products/[slug]/page.tsx');

    assert.match(product, /function chainSourceAttributionFor/);
    assert.match(product, /Prices observed from:/);
    assert.match(product, /coverageHref: '\/coverage'/);
    assert.match(product, /chainSourceAttribution\.summary/);
    assert.match(product, /chainSourceAttribution\.sourceRows\.map/);
    assert.match(product, /<ConfidenceBadge/);
    assert.match(product, /verificationLabel=\{sourceRow\.verificationLabel\}/);
  });

  it('surfaces watchlist alerts and notification planning using verified core outputs', async () => {
    const source = await read('src/app/watchlist/page.tsx');
    const watchlistData = await read('src/lib/watchlist-data.ts');
    assert.match(watchlistData, /buildWatchlistAlerts/);
    assert.match(watchlistData, /planNotifications/);
    assert.match(watchlistData, /watchlistAlertInputs/);
    assert.match(source, /watchlistAlertBoard/);
    assert.match(source, /plannedNotifications/);
    assert.match(source, /watchlistAlerts/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('keeps watchlist data shaping out of the route component', async () => {
    const route = await read('src/app/watchlist/page.tsx');
    const watchlistData = await read('src/lib/watchlist-data.ts');

    assert.match(route, /watchlistAlertBoard/);
    assert.doesNotMatch(route, /from '@groceryview\/core'/);
    assert.doesNotMatch(route, /topChainSpreads|chainPriceRows|calculateDealScore/);
    assert.match(watchlistData, /topChainSpreads/);
    assert.match(watchlistData, /chainPriceRows/);
    assert.match(watchlistData, /calculateDealScore/);
    assert.match(watchlistData, /export const watchlistAlertBoard/);
  });

  it('surfaces watchlist alert confidence and coverage as planning-ready facts', async () => {
    const route = await read('src/app/watchlist/page.tsx');
    const watchlistData = await read('src/lib/watchlist-data.ts');

    assert.match(route, /coverageConfidence/);
    assert.match(watchlistData, /confidenceForCoverage/);
    assert.match(route, /ConfidenceBadge/);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });


  it('ships signed-in notification inbox controls without anonymous delivery state', async () => {
    const route = await read('src/app/watchlist/page.tsx');
    const actions = await read('src/components/notification-inbox-actions.tsx');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(route, /NotificationInboxActions/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:accessToken'/);
    assert.match(actions, /sessionStorage\.getItem\('groceryview:userId'/);
    assert.match(actions, /Authorization: `Bearer \${accessToken}`/);
    assert.match(actions, /\/api\/notifications\/inbox\?userId=\${encodeURIComponent\(userId\)}/);
    assert.match(actions, /method: 'GET'/);
    assert.match(actions, /deliveryGuardrails/);
    assert.match(actions, /suppression/);
    assert.match(actions, /quiet-hour holds/);
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous notification inbox/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(server, /\/api\/notifications\/inbox/);
  });


  it('surfaces a weekly personalised email digest from watchlist alerts and best deals', async () => {
    const route = await read('src/app/watchlist/page.tsx');
    const demo = await read('src/lib/demo-data.ts');

    assert.match(demo, /weeklyPersonalizedEmailDigest/);
    assert.match(demo, /builtWatchlistAlerts/);
    assert.match(demo, /dealOpportunityRail/);
    assert.match(demo, /channels: \['email'\]/);
    assert.match(route, /weeklyPersonalizedEmailDigest/);
    assert.match(route, /Weekly personalised email digest/);
    assert.match(route, /watchlistAlerts/);
    assert.match(route, /bestDeals/);
    assert.match(route, /email/);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });

  it('surfaces deal-hunter new-product and price-drop alerts using real alert outputs', async () => {
    const route = await read('src/app/watchlist/page.tsx');
    const demo = await read('src/lib/demo-data.ts');

    assert.match(demo, /dealHunterNewProductPriceDropAlerts/);
    assert.match(demo, /buildWatchlistAlerts/);
    assert.match(demo, /rankDealOpportunities/);
    assert.match(demo, /newProductSignals/);
    assert.match(demo, /priceDropAlerts/);
    assert.match(route, /dealHunterNewProductPriceDropAlerts/);
    assert.match(route, /New-product & price-drop alerts/);
    assert.match(route, /newProductSignals/);
    assert.match(route, /priceDropAlerts/);
    assert.match(route, /not a retailer launch claim/i);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });


  it('surfaces account-safe custom price alert thresholds on the watchlist route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/watchlist/page.tsx');

    assert.match(verified, /priceAlertThresholdPreferenceContract/);
    assert.match(verified, /thresholdTypes/);
    assert.match(verified, /targetPrice/);
    assert.match(verified, /dealScoreMinimum/);
    assert.match(route, /priceAlertThresholdPreferenceContract/);
    assert.match(route, /Custom price alert thresholds/);
    assert.match(route, /targetPrice/);
    assert.match(route, /dealScoreMinimum/);
    assert.match(route, /No anonymous thresholds/);
    assert.match(route, /buildWatchlistAlerts/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces verified stockout substitution options on the basket ideas route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/basket-ideas/page.tsx');
    const core = await read('../../packages/core/src/index.ts');

    assert.match(core, /planStockoutSubstitutionOptions/);
    assert.match(core, /StockoutSubstitutionPolicy/);
    assert.match(verified, /stockoutSubstitutionContract/);
    assert.match(verified, /acceptableSubstitutionPolicy/);
    assert.match(verified, /dietaryTagsRequired/);
    assert.match(route, /stockoutSubstitutionContract/);
    assert.match(route, /Stockout substitutions/);
    assert.match(route, /never auto-accepted/);
    assert.match(route, /verified in-stock/);
    assert.match(route, /dietaryTagsRequired/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces retailer deep-link quality scoring on the basket ideas route', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/basket-ideas/page.tsx');
    const core = await read('../../packages/core/src/index.ts');

    assert.match(core, /scoreRetailerDeepLinkQuality/);
    assert.match(verified, /retailerDeepLinkQualityContract/);
    assert.match(verified, /canonicalProductId/);
    assert.match(route, /retailerDeepLinkQualityContract/);
    assert.match(route, /Deep-link quality scoring/);
    assert.match(route, /verified URL, HTTP, and canonical product evidence/);
    assert.match(route, /not checkout confirmation/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces baby and diaper price tracking alerts using the real watchlist engine', async () => {
    const source = await read('src/app/watchlist/page.tsx');
    assert.match(source, /babyDiaperPriceTracker/);
    assert.match(source, /buildWatchlistAlerts/);
    assert.match(source, /Baby & diaper price tracking/);
    assert.match(source, /diaperUnitPrice/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('wires the unit price alert page to the alert API controls', async () => {
    const route = await read('src/app/unit-price-alerts/page.tsx');
    const actions = await read('src/components/unit-price-alert-actions.tsx');

    assert.match(route, /UnitPriceAlertActions/);
    assert.match(route, /suggestedAlerts=/);
    assert.match(actions, /'use client'/);
    assert.match(actions, /fetch\(`\/api\/alerts\?userEmail=\$\{encodeURIComponent\(userEmail\)\}`/);
    assert.match(actions, /fetch\('\/api\/alerts'/);
    assert.match(actions, /method: 'POST'/);
    assert.match(actions, /JSON\.stringify\(\{ userEmail, productId, targetPrice: Number\(targetPrice\) \}\)/);
    assert.match(actions, /fetch\(`\/api\/alerts\/\$\{encodeURIComponent\(alertId\)\}\?userEmail=\$\{encodeURIComponent\(userEmail\)\}`/);
    assert.match(actions, /method: 'DELETE'/);
    assert.match(actions, /Sign in or enter alert email first/);
    assert.match(actions, /No anonymous unit price alert writes/);
    assert.doesNotMatch(actions, /demo-data|sample-data|localStorage\.setItem/i);
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
    const estimator = await read('src/lib/meal-cost-estimator.ts');
    assert.match(source, /dealBasedMeals/);
    assert.match(source, /suggestDealBasedMeals/);
    assert.match(source, /applyAdaptiveMealBudgetGuardrails/);
    assert.match(source, /Adaptive budget guardrails/);
    assert.match(source, /hidden from recommendations/);
    assert.match(source, /ConfidenceBadge/);
    assert.match(source, /estimatedCostPerServing/);
    assert.match(estimator, /weeklyBudgetEnvelope/);
    assert.match(estimator, /recommendedMeals/);
    assert.match(estimator, /demotedMeals/);
    assert.match(estimator, /hiddenMeals/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('wires compare page requested products through the compare snapshots endpoint', async () => {
    const source = await read('src/app/compare/page.tsx');
    const helper = await read('src/lib/compare-price-snapshots.ts');

    assert.match(source, /fetchComparePriceSnapshots/);
    assert.match(source, /endpointSnapshotMatrix/);
    assert.match(source, /\/api\/compare\?itemIds=\.\.\./);
    assert.match(source, /compareSnapshots\.missingItemIds/);
    assert.match(helper, /itemIds=/);
    assert.match(helper, /contractStoreRowsFromPayload/);
    assert.match(helper, /stores/);
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
    const checkoutRoute = await read('src/app/api/meal-planner/checkout/route.ts');
    assert.match(source, /familyMealPlannerFromDeals/);
    assert.match(source, /suggestDealBasedMeals/);
    assert.match(source, /Family weekly meal planner/);
    assert.match(source, /lunchboxLeftovers/);
    assert.match(source, /MealPlanCheckoutAction/);
    assert.match(source, /\/api\/meal-planner\/checkout/);
    assert.match(source, /Autopopulate shopping list/);
    assert.match(source, /checkoutIngredientsPayload/);
    assert.match(checkoutRoute, /buildMealPlanShoppingListExport/);
    assert.match(checkoutRoute, /selectedProducts/);
    assert.match(checkoutRoute, /quantityEstimate/);
    assert.match(checkoutRoute, /mealPlanShoppingListHref/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces a freezer batch-cook planner from real deal meal output', async () => {
    const source = await read('src/app/meal-planner/page.tsx');
    const demo = await read('src/lib/demo-data.ts');

    assert.match(demo, /freezerBatchCookPlanner/);
    assert.match(demo, /suggestDealBasedMeals/);
    assert.match(demo, /freezerPortions/);
    assert.match(demo, /batchCookSteps/);
    assert.match(source, /freezerBatchCookPlanner/);
    assert.match(source, /Freezer batch-cook planner/);
    assert.match(source, /freezerPortions/);
    assert.match(source, /batchCookSteps/);
    assert.match(source, /visible deal prices/i);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces an account-safe dietary substitution assistant on the meal planner route', async () => {
    const route = await read('src/app/meal-planner/page.tsx');
    const verified = await read('src/lib/verified-data.ts');
    const core = await read('../../packages/core/src/index.ts');

    assert.match(core, /planDietarySubstitutionAssistant/);
    assert.match(verified, /dietarySubstitutionAssistantContract/);
    assert.match(verified, /requiredDietaryTags/);
    assert.match(verified, /allergenAvoidanceTags/);
    assert.match(route, /dietarySubstitutionAssistantContract/);
    assert.match(route, /Dietary substitution assistant/);
    assert.match(route, /No dietary swap is auto-applied/);
    assert.match(route, /professional confirmation/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces ingredient-level meal costing with cheapest-chain evidence', async () => {
    const source = await read('src/app/meal-cost/page.tsx');
    const demo = await read('src/lib/demo-data.ts');
    assert.match(demo, /calculateMealCostBreakdown/);
    assert.match(demo, /mealCostBreakdown/);
    assert.match(source, /calculateMealCostBreakdown/);
    assert.match(source, /ConfidenceBadge/);
    assert.match(source, /mealCostBreakdown/);
    assert.match(source, /Ingredient-level meal costing/);
    assert.match(source, /costPerServing/);
    assert.match(source, /cheapestChain/);
    assert.match(source, /ingredientCost/);
    assert.match(source, /real ingredient offer rows/);
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


  it('surfaces a dedicated near-expiry deal radar page with confidence-backed core output', async () => {
    const source = await read('src/app/expiry-deals/page.tsx');
    assert.match(source, /buildExpiryDealRadar/);
    assert.match(source, /expiryDealRadarReports/);
    assert.match(source, /ConfidenceBadge/);
    assert.match(source, /radarScore/);
    assert.match(source, /staleReportIds/);
    assert.match(source, /near-expiry/i);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces replacement deal radar filters on the deals route', async () => {
    const route = await read('src/app/deals/page.tsx');

    assert.match(route, /buildPantryReplacementFilter/);
    assert.match(route, /pantryReplacementMatches/);
    assert.match(route, /Replacement deals for/);
    assert.match(route, /generateMetadata/);
    assert.match(route, /routeMetadata\('\/deals'\)/);
  });

  it('surfaces a verified deal screener on the dedicated screener route', async () => {
    const route = await read('src/app/screener/page.tsx');
    assert.match(route, /Sort verified deals by the signal that matters now/);
    assert.match(route, /priceDropMoversBoard/);
    assert.match(route, /topChainSpreads/);
    assert.match(route, /categoryDealLeaders/);
    assert.match(route, /Ranked deal table/);
    assert.match(route, /What the screener will and will not claim/);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });

  it('keeps the screener ranked table usable below the small breakpoint', async () => {
    const route = await read('src/app/screener/page.tsx');

    assert.match(route, /sm:min-w-\[920px\]/);
    assert.match(route, /hidden bg-slate-50[^`"]*sm:table-header-group/);
    assert.match(route, /block rounded-2xl[^`"]*sm:table-row/);
    assert.match(route, /sm:hidden[^>]*>Product</);
    assert.match(route, /sm:hidden[^>]*>Signal</);
    assert.match(route, /sm:hidden[^>]*>Price</);
    assert.match(route, /sm:hidden[^>]*>Comparison</);
    assert.match(route, /sm:hidden[^>]*>Confidence</);
    assert.doesNotMatch(route, /className="w-full min-w-\[920px\]/);
  });

  it('covers invalid sort query values on the screener route with explicit default selection', async () => {
    const route = await read('src/app/screener/page.tsx');
    const query = await read('src/lib/screener-query.ts');

    assert.match(query, /SCREENER_SORT_MODES = \['biggest-drop', 'cheapest-per-kg', 'widest-spread'\]/);
    assert.match(query, /export const SCREENER_SORT_OPTIONS = SCREENER_SORT_MODES\.map/);
    assert.match(route, /SCREENER_SORT_OPTIONS/);
    assert.match(route, /const sortOptions = SCREENER_SORT_OPTIONS/);
    assert.doesNotMatch(route, /const sortOptions = \[/);
    assert.match(route, /function selectedMode\(value: string \| undefined\): SortMode {/);
    assert.match(route, /return normalizeScreenerSort\(value\);/);
    assert.match(route, /const mode = selectedMode\(paramValue\(params\.sort\)\);/);
  });

  it('defaults unknown screener category filters back to all', async () => {
    const route = await read('src/app/screener/page.tsx');

    assert.match(route, /const category =/);
    assert.match(route, /SCREENER_DEFAULT_CATEGORY/);
    assert.match(route, /normalizeScreenerCategory\(requestedCategory, categoryOptions\.map\(\(option\) => option\.slug\)\)/);
    assert.match(route, /categoryOptions/);
    assert.match(route, /const requestedCategory = paramValue\(params\.category\) \?\? SCREENER_DEFAULT_CATEGORY;/);
    assert.match(route, /href={modeHref\(option\.mode, category, minDiscount\)}/);
    assert.match(route, /href={categoryHref\(SCREENER_DEFAULT_CATEGORY, mode, minDiscount\)}/);
  });


  it('adds a min_discount screener slider backed by the screener API contract', async () => {
    const route = await read('src/app/screener/page.tsx');
    const query = await read('src/lib/screener-query.ts');
    const apiRoute = await read('../../apps/api/src/routes/screener.ts');

    assert.match(query, /SCREENER_MIN_DISCOUNT_PARAM = 'min_discount'/);
    assert.match(query, /SCREENER_MAX_DISCOUNT = 50/);
    assert.match(query, /normalizeScreenerMinDiscount/);
    assert.match(query, /screenerDiscountHref/);
    assert.match(route, /normalizeScreenerMinDiscount/);
    assert.match(route, /const minDiscount = normalizeScreenerMinDiscount\(paramValue\(params\.min_discount\)\);/);
    assert.match(route, /sortedRows\(mode, category, minDiscount\)/);
    assert.match(route, /name=\{SCREENER_MIN_DISCOUNT_PARAM\}/);
    assert.match(route, /type="range"/);
    assert.match(route, /min=\{SCREENER_MIN_DISCOUNT\}/);
    assert.match(route, /max=\{SCREENER_MAX_DISCOUNT\}/);
    assert.match(route, /Minimum discount/);
    assert.match(route, /discountPercent/);
    assert.match(apiRoute, /screenerRoutes/);
    assert.match(apiRoute, /minDiscountParam: 'min_discount'/);
    assert.match(apiRoute, /sourceCte: 'price_history'/);
    assert.match(apiRoute, /discountPercent/);
  });

  it('ships the weekly price-drop digest API from PostgreSQL latest_prices rows', async () => {
    assert.equal(await fileExists('src/app/api/digest/route.ts'), true);
    const route = await read('src/app/api/digest/route.ts');
    assert.match(route, /createPostgresWeeklyPriceDropDigestReader/);
    assert.match(route, /createPgQueryExecutor/);
    assert.match(route, /DATABASE_URL/);
    assert.match(route, /postgres\.latest_prices/);
    assert.match(route, /NextResponse\.json/);
    assert.match(route, /force-dynamic/);
    assert.doesNotMatch(route, /process\.env\.DATABASE_URL.*json/i);
  });



  it('wires the latest ICA store-scoped promotion import to visible source surfaces', async () => {
    const generated = await read('src/lib/ingested/ica.ts');
    const summary = await read('src/lib/ingested/ica-source-summary.ts');
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const dataSources = await read('src/app/data-sources/page.tsx');

    assert.match(generated, /ICA Kvantum Kungsholmen/);
    assert.match(generated, /"storeAccountId":\s*"1004599"/);
    assert.match(generated, /ICA Focus/);
    assert.match(generated, /"storeAccountId":\s*"1004247"/);
    assert.match(generated, /ICA Karlaplan/);
    assert.match(generated, /"storeAccountId":\s*"1003714"/);
    assert.match(generated, /retrieved 2026-05-25T/);
    assert.match(summary, /AUTO-GENERATED summary from public ICA store-scoped promotions JSON/);
    assert.match(summary, /generatedFrom: 'apps\/web\/src\/lib\/ingested\/ica\.ts'/);
    assert.match(summary, /totalRowCount: \d+/);
    assert.match(summary, /storeEndpointCount: \d+/);
    assert.match(summary, /ICA Kvantum Kungsholmen/);
    assert.match(summary, /storeAccountId: '1004599'/);
    assert.match(summary, /ICA Focus/);
    assert.match(summary, /storeAccountId: '1004247'/);
    assert.match(summary, /ICA Karlaplan/);
    assert.match(summary, /storeAccountId: '1003714'/);
    assert.match(summary, /retrievedAt: '2026-05-2/);
    assert.match(verified, /import \{ icaStorePromotionSourceSummary \} from '\.\/ingested\/ica-source-summary'/);
    assert.match(verified, /export const icaStorePromotionEvidence/);
    assert.match(verified, /latestStore/);
    assert.match(verified, /storeScopedRows/);
    assert.match(verified, /ICA store-scoped promotions/);
    assert.match(verified, /No branch shelf-price claim/);
    assert.match(shell, /icaStorePromotionEvidence/);
    assert.match(shell, /Latest ICA store-scoped promotions/);
    assert.match(shell, /data-ica-store-promotion-import/);
    assert.match(shell, /href="\/data-sources"/);
    assert.match(dataSources, /icaStorePromotionEvidence/);
    assert.match(dataSources, /ICA store-scoped promotions/);
    assert.match(dataSources, /latestStores\.map/);
    assert.match(dataSources, /sourceUrl/);
    assert.doesNotMatch(`${shell}\n${dataSources}`, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('wires the all-store daily batch runner to homepage and source readiness surfaces', async () => {
    const runner = await read('../../packages/ingestion/src/connectors/all-store-runner.ts');
    const ingestion = await read('../../packages/ingestion/src/index.ts');
    const workflow = await read('../../.github/workflows/daily-ingestion.yml');
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const dataSources = await read('src/app/data-sources/page.tsx');

    assert.match(runner, /export async function runAllStoreTasks/);
    assert.match(runner, /storeConcurrency/);
    assert.match(runner, /storeRetryAttempts/);
    assert.match(runner, /failOnStoreFailure/);
    assert.match(ingestion, /GROCERYVIEW_DAILY_WILLYS_ALL_STORE_WEEKLY_OFFERS_URL/);
    assert.match(ingestion, /GROCERYVIEW_DAILY_COOP_ALL_STORE_PRODUCTS_URL/);
    assert.match(ingestion, /GROCERYVIEW_DAILY_CITY_GROSS_PUBLIC_PRODUCTS_URL/);
    assert.match(ingestion, /GROCERYVIEW_DAILY_STORE_CONCURRENCY/);
    assert.match(workflow, /ops:daily-connectors/);
    assert.match(workflow, /Export live store enumeration/);
    assert.match(workflow, /groceryview-daily-connectors/);
    assert.match(verified, /export const allStoreDailyRunnerReadiness/);
    assert.match(verified, /All-store daily batch runner/);
    assert.match(verified, /runnerControls/);
    assert.match(verified, /allStoreConnectorUrls/);
    assert.match(verified, /failOnStoreFailure/);
    assert.match(shell, /allStoreDailyRunnerReadiness/);
    assert.match(shell, /All-store daily batch runner/);
    assert.match(shell, /data-all-store-daily-runner/);
    assert.match(shell, /href="\/data-sources"/);
    assert.match(dataSources, /allStoreDailyRunnerReadiness/);
    assert.match(dataSources, /All-store daily batch runner/);
    assert.match(dataSources, /runnerControls\.map/);
    assert.match(dataSources, /allStoreConnectorUrls\.map/);
    assert.doesNotMatch(`${shell}\n${dataSources}`, /@\/lib\/demo-data|@\/components\/sample-data/);
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

  it('surfaces a high-protein deal finder from real deal and nutrition rankings', async () => {
    const source = await read('src/app/nutrition-value/page.tsx');
    const demo = await read('src/lib/demo-data.ts');

    assert.match(demo, /highProteinDealFinder/);
    assert.match(demo, /rankDealOpportunities/);
    assert.match(demo, /rankNutritionPerKrona/);
    assert.match(demo, /proteinPer10Sek/);
    assert.match(demo, /minProteinPer10Sek/);
    assert.match(source, /highProteinDealFinder/);
    assert.match(source, /High-protein deal finder/);
    assert.match(source, /proteinPer10Sek/);
    assert.match(source, /dealScore/);
    assert.match(source, /visible deal rows and package nutrition labels/i);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('surfaces organic Keyhole and vegan health filters from verified labels', async () => {
    const source = await read('src/app/nutrition-value/page.tsx');
    const verified = await read('src/lib/verified-data.ts');

    assert.match(verified, /export const healthVerifiedLabelFilters = /);
    assert.match(verified, /keyhole/);
    assert.match(verified, /organic|ecological|eu_ecological/);
    assert.match(verified, /vegan/);
    assert.match(source, /healthVerifiedLabelFilters/);
    assert.match(source, /Organic, Keyhole & vegan filters/);
    assert.match(source, /verifiedProductCount/);
    assert.match(source, /evidenceLabels/);
    assert.match(source, /not a medical claim/i);
    assert.match(source, /not inferred from browsing/i);
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

  it('surfaces Swedish dietary scenario filters from verified labels only', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/categories/page.tsx');

    assert.match(verified, /dietaryScenarioFilters/);
    assert.match(verified, /glutenfree/);
    assert.match(verified, /laktosfree/);
    assert.match(verified, /krav|ecological/);
    assert.match(route, /Dietary scenario filters/);
    assert.match(route, /glutenfri/i);
    assert.match(route, /laktosfri/i);
    assert.match(route, /verified label evidence/i);
    assert.match(route, /not inferred from browsing/i);
    assert.doesNotMatch(route, /@\/lib\/demo-data|@\/components\/sample-data/);
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

  it('uses next/image for product visual discovery imagery', async () => {
    const products = await read('src/app/products/page.tsx');
    const nextConfig = await read('next.config.mjs');

    assert.match(products, /import Image from 'next\/image'/);
    assert.match(products, /<Image/);
    assert.match(products, /width=\{160\}/);
    assert.match(products, /height=\{160\}/);
    assert.match(products, /sizes=/);
    assert.doesNotMatch(products, /<img\b/);
    assert.match(nextConfig, /remotePatterns/);
    assert.match(nextConfig, /assets\.axfood\.se/);
    assert.match(nextConfig, /images\.openfoodfacts\.org/);
  });

  it('ships a Lighthouse CI performance budget gate for web terminal routes', async () => {
    const pkg = await read('package.json');
    const lhci = await read('lighthouserc.cjs');
    const previewLhci = await read('lighthouserc.preview.cjs');
    const sizeLimit = await read('size-limit.config.cjs');
    const workflow = await read('../../.github/workflows/ci.yml');
    const previewWorkflow = await read('../../.github/workflows/lighthouse.yml');
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(pkg, /"perf:lighthouse:ci"/);
    assert.match(pkg, /"perf:lighthouse:preview"/);
    assert.match(pkg, /"perf:bundle:profile"/);
    assert.match(pkg, /next build --profile/);
    assert.match(pkg, /size-limit --config \.\/size-limit\.config\.cjs/);
    assert.match(pkg, /@lhci\/cli/);
    assert.match(pkg, /"size-limit"/);
    assert.match(pkg, /"@size-limit\/file"/);
    assert.match(lhci, /http:\/\/127\.0\.0\.1:3000\//);
    assert.match(lhci, /numberOfRuns:\s*3/);
    assert.match(lhci, /categories:performance/);
    assert.match(lhci, /largest-contentful-paint/);
    assert.match(lhci, /cumulative-layout-shift/);
    assert.match(lhci, /'cumulative-layout-shift': \['error', \{ maxNumericValue: 0\.15 \}\]/);
    assert.match(lhci, /total-byte-weight/);
    assert.match(lhci, /filesystem/);
    assert.match(sizeLimit, /name:\s*'Next main JS chunk'/);
    assert.match(sizeLimit, /path:\s*'\.next\/static\/chunks\/main\*\.js'/);
    assert.match(sizeLimit, /limit:\s*'250 KB'/);
    assert.match(sizeLimit, /gzip:\s*true/);
    assert.match(workflow, /Lighthouse performance budget/);
    assert.match(workflow, /npm run perf:lighthouse:ci -w @groceryview\/web/);
    assert.match(workflow, /Next profile bundle budget/);
    assert.match(workflow, /npm run perf:bundle:profile -w @groceryview\/web/);
    assert.match(previewLhci, /LHCI_PREVIEW_URL/);
    assert.match(previewLhci, /categories:performance': \['error', \{ minScore: 0\.85 \}\]/);
    assert.match(previewLhci, /largest-contentful-paint': \['error', \{ maxNumericValue: 2500 \}\]/);
    assert.match(previewWorkflow, /pull_request:/);
    assert.match(previewWorkflow, /environment: 'Preview'/);
    assert.match(previewWorkflow, /core\.exportVariable\('LHCI_PREVIEW_URL'/);
    assert.match(previewWorkflow, /\.\/node_modules\/\.bin\/lhci autorun --config=\.lighthouserc\.json/);
    assert.match(previewWorkflow, /--collect\.url=\$\{base\}\$\{route\}/);
    assert.match(verified, /export const webPerformanceBudgetGate/);
    assert.match(verified, /Core Web Vitals budget/);
    assert.match(verified, /≤ 0\.15 layout shift/);
    assert.match(shell, /webPerformanceBudgetGate/);
    assert.match(shell, /Lighthouse CI budget/);
    assert.doesNotMatch(shell, /NoVerifiedData/);
  });


  it('ships a persisted language preference switcher with RTL and browser-language detection', async () => {
    const nav = await read('src/components/app-nav.tsx');
    const switcher = await read('src/components/language-preference-switcher.tsx');
    const i18n = await read('src/lib/i18n.ts');

    assert.match(nav, /LanguagePreferenceSwitcher/);
    assert.match(switcher, /'use client'/);
    assert.match(switcher, /localStorage\.getItem\('groceryview:locale'/);
    assert.match(switcher, /localStorage\.setItem\('groceryview:locale'/);
    assert.match(switcher, /navigator\.languages/);
    assert.match(switcher, /document\.documentElement\.lang/);
    assert.match(switcher, /document\.documentElement\.dir/);
    assert.match(switcher, /Arabic/);
    assert.match(switcher, /Somali/);
    assert.match(switcher, /dir: 'rtl'/);
    assert.match(switcher, /No prices or product names are machine-translated/);
    assert.match(i18n, /supportedLocales/);
    assert.match(i18n, /currency: 'SEK'/);
    assert.match(i18n, /sv-SE/);
    assert.match(i18n, /ar-SE/);
    assert.match(i18n, /so-SE/);
    assert.doesNotMatch(switcher, /demo-data|sample-data|mock session/i);
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
    assert.match(source, /ConfidenceBadge/);
    assert.doesNotMatch(source, /NoVerifiedData/);
  });

  it('sets Twitter card metadata for the savings dashboard from OpenGraph fields', async () => {
    const source = await read('src/app/savings-dashboard/page.tsx');
    assert.match(source, /const openGraph = metadata\.openGraph/);
    assert.match(source, /twitter:\s*\{/);
    assert.match(source, /card:\s*'summary_large_image'/);
    assert.match(source, /title:\s*openGraph\?\.title/);
    assert.match(source, /description:\s*openGraph\?\.description/);
    assert.match(source, /images:\s*openGraph\?\.images/);
  });

  it('surfaces the dedicated screener route in navigation, metadata, and sitemap', async () => {
    const nav = await read('src/components/app-nav.tsx');
    const route = await read('src/app/screener/page.tsx');
    const seo = await read('src/lib/seo.ts');
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(nav, /href: '\/screener', label: 'Screener'/);
    assert.match(route, /routeMetadata\('\/screener'\)/);
    assert.match(seo, /'\/screener'/);
    assert.match(seo, /Verified deal screener/);
    assert.match(sitemap, /entry\('\/screener'/);
  });

  it('surfaces a seasonal best time to buy produce calendar from historical monthly averages', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/seasonal-calendar/page.tsx');
    const shell = await read('src/components/market-shell.tsx');
    const seo = await read('src/lib/seo.ts');
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(verified, /export const seasonalProduceCalendar/);
    assert.match(verified, /produceSeasonalityRows/);
    assert.match(verified, /historicalMonthlyAverage/);
    assert.match(verified, /bestBuyMonth/);
    assert.match(verified, /No forecast or synthetic seasonal prediction/);
    assert.match(verified, /ecoSeasonalGuidance/);

    assert.match(route, /seasonalProduceCalendar/);
    assert.match(route, /Seasonal best time to buy produce calendar/);
    assert.match(route, /historical monthly averages/);
    assert.match(route, /Best time to buy/);
    assert.match(route, /No forecast or synthetic seasonal prediction/);
    assert.match(route, /routeMetadata\('\/seasonal-calendar'\)/);
    assert.doesNotMatch(route, /@\/lib\/demo-data|@\/components\/sample-data/);

    assert.match(shell, /seasonalProduceCalendar/);
    assert.match(shell, /\/seasonal-calendar/);
    assert.match(seo, /'\/seasonal-calendar'/);
    assert.match(sitemap, /entry\('\/seasonal-calendar'/);
  });

  it('surfaces holiday sale pattern detection on item pages without unsupported forecast claims', async () => {
    const analytics = await read('../../packages/analytics/src/seasonality.ts');
    const analyticsPackage = await read('../../packages/analytics/package.json');
    const itemPage = await read('src/app/items/[id]/page.tsx');
    const productPage = await read('src/app/products/[slug]/page.tsx');
    const itemsRoute = await read('../../apps/api/src/routes/items.ts');

    assert.match(analyticsPackage, /@groceryview\/analytics/);
    assert.match(analytics, /export function detectSeasonalSalePattern/);
    assert.match(analytics, /midsommarSeasonalHoliday/);
    assert.match(analytics, /leadWindowDays/);
    assert.match(analytics, /Likely on sale before Midsommar/);
    assert.match(analytics, /minSeasonCount/);
    assert.match(itemPage, /products\/\[slug\]\/page/);
    assert.match(itemPage, /generateProductMetadata/);
    assert.match(productPage, /detectSeasonalSalePattern/);
    assert.match(productPage, /midsommarSeasonalHoliday/);
    assert.match(productPage, /seasonalSalePattern/);
    assert.match(productPage, /Likely on sale before Midsommar/);
    assert.match(productPage, /explicit historical holiday-window price evidence/);
    assert.match(itemsRoute, /itemsRoutes/);
    assert.match(itemsRoute, /seasonalSalePattern/);
    assert.match(itemsRoute, /midsommar/);
    assert.match(itemsRoute, /holidayWindow/);
  });

  it('surfaces item substitution suggestions for out-of-stock or very expensive items', async () => {
    const analytics = await read('../../packages/analytics/src/substitutions.ts');
    const itemPage = await read('src/app/items/[id]/page.tsx');
    const productPage = await read('src/app/products/[slug]/page.tsx');
    const itemsRoute = await read('../../apps/api/src/routes/items.ts');

    assert.match(analytics, /export function buildItemSubstitutionSuggestions/);
    assert.match(analytics, /maxSuggestions/);
    assert.match(analytics, /same-category, in-stock candidates with a verified lower current price/i);
    assert.match(itemPage, /products\/\[slug\]\/page/);
    assert.match(productPage, /buildItemSubstitutionSuggestions/);
    assert.match(productPage, /itemSubstitutionSuggestionsFor/);
    assert.match(productPage, /Item substitution suggestions/);
    assert.match(productPage, /out of stock or very expensive/i);
    assert.match(productPage, /up to 3/);
    assert.match(productPage, /lower current price/i);
    assert.match(itemsRoute, /substitutionSuggestions/);
    assert.match(itemsRoute, /maxSuggestions: 3/);
  });

  it('surfaces eco-conscious local and seasonal picks without origin or carbon invention', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/seasonal-calendar/page.tsx');

    assert.match(verified, /export const localSeasonalPicks = /);
    assert.match(verified, /Swedish origin label/);
    assert.match(verified, /historicalMonthlyAverage/);
    assert.match(verified, /from_sweden|swedish_flag/);
    assert.match(route, /localSeasonalPicks/);
    assert.match(route, /Local & seasonal picks/);
    assert.match(route, /originEvidence/);
    assert.match(route, /seasonalEvidence/);
    assert.match(route, /No carbon or harvest claim/);
    assert.match(route, /explicit Swedish-origin label/i);
    assert.doesNotMatch(route, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('surfaces an eco-conscious sustainable-brand filter from verified label evidence', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/categories/page.tsx');

    assert.match(verified, /export const sustainableBrandFilter/);
    assert.match(verified, /openFoodFactsCatalog/);
    assert.match(verified, /ecoEvidenceForProduct/);
    assert.match(verified, /evidenceLabels/);
    assert.match(route, /sustainableBrandFilter/);
    assert.match(route, /Sustainable-brand filter/);
    assert.match(route, /verified label evidence/i);
    assert.match(route, /not a carbon claim/i);
    assert.match(route, /evidenceLabels/);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });

  it('surfaces a cheaper and greener basket scorecard without fabricated carbon data', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const source = await read('src/app/savings-dashboard/page.tsx');

    assert.match(verified, /export const ecoBasketScorecard/);
    assert.match(verified, /openFoodFactsCatalog/);
    assert.match(verified, /ecoScore/);
    assert.match(verified, /carbonKgCo2e/);
    assert.match(source, /ecoBasketScorecard/);
    assert.match(source, /Cheaper \+ greener basket/);
    assert.match(source, /carbon data unavailable/i);
    assert.match(source, /confidence/);
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


  it('surfaces a Grocery Index market terminal on the homepage without placeholder rows', async () => {
    const shell = await read('src/components/market-shell.tsx');

    assert.match(shell, /homepageMarketTerminal/);
    assert.match(shell, /Grocery Index market terminal/);
    assert.match(shell, /mapChainIndexScores\[0\]/);
    assert.match(shell, /priceDropMoversBoard\[0\]/);
    assert.match(shell, /openPriceObservationDepth\.reduce/);
    assert.match(shell, /sourceCoverage\.map/);
    assert.match(shell, /No forecast, sponsored boost, or synthetic placeholder row/);
    assert.match(shell, /Open Grocery Index/);
    assert.doesNotMatch(shell, /NoVerifiedData|@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('surfaces a grocery market heatmap on homepage and chain-index from verified market tiles', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const route = await read('src/app/chain-index/page.tsx');

    assert.match(verified, /export const marketHeatmapTiles/);
    assert.match(verified, /marketHeatmapSourceSignals/);
    assert.match(verified, /categoryDealLeaders/);
    assert.match(verified, /openPriceObservationDepth/);
    assert.match(verified, /chainCategoryCoverage/);
    assert.match(shell, /homepageMarketHeatmap/);
    assert.match(shell, /marketHeatmapTiles\.slice\(0, 6\)/);
    assert.match(shell, /Grocery market heatmap/);
    assert.match(shell, /data-heatmap-tile/);
    assert.match(shell, /tile\.heatScore/);
    assert.match(route, /marketHeatmapTiles/);
    assert.match(route, /Market heatmap/);
    assert.match(route, /heatScore\.toFixed/);
    assert.match(route, /No forecast/);
    assert.doesNotMatch(verified, /Math\.random/);
  });

  it('surfaces a chain price index trend chart from dated campaign tape on homepage and chain-index', async () => {
    const chainData = await read('src/lib/chain-index-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const route = await read('src/app/chain-index/page.tsx');

    assert.match(chainData, /willysWeeklyDiscounts/);
    assert.match(chainData, /hemkopWeeklyDiscounts/);
    assert.match(chainData, /export function buildChainIndexTrendSeries/);
    assert.match(chainData, /parseCampaignDate/);
    assert.match(chainData, /campaignTrendObservations/);
    assert.match(chainData, /calculateChainPriceIndex/);
    assert.match(shell, /homepageChainIndexTrend/);
    assert.match(shell, /Chain index trend tape/);
    assert.match(shell, /data-chain-index-trend/);
    assert.match(route, /chainIndexTrendSeries/);
    assert.match(route, /Chain Price Index trend chart/);
    assert.match(route, /campaign tape/);
    assert.match(route, /No forecast/);
    assert.match(route, /data-chain-index-trend/);
    assert.doesNotMatch(chainData, /Math\.random|Date\.now/);
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
    assert.match(globals, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(globals, /transition-duration: 1ms !important/);
    assert.match(nav, /groceryTranslator/);
    assert.match(nav, /href: '\/screener', label: 'Screener'/, 'Screener nav item should point to the dedicated /screener route');
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

  it('mounts a glassmorphic mobile bottom navigation in the shared page shell', async () => {
    const bottomNav = await read('src/components/bottom-nav.tsx');
    const dataUi = await read('src/components/data-ui.tsx');

    assert.match(bottomNav, /export function BottomNav/);
    assert.match(bottomNav, /Primary mobile navigation/);
    assert.match(bottomNav, /fixed inset-x-3 bottom-3/);
    assert.match(bottomNav, /backdrop-blur-xl/);
    assert.match(bottomNav, /lg:hidden/);
    assert.match(bottomNav, /Markets/);
    assert.match(bottomNav, /Search/);
    assert.match(bottomNav, /Map/);
    assert.match(bottomNav, /ScanLine/);
    assert.match(bottomNav, /href: '\/scanner[^']*#scan'/);
    assert.match(bottomNav, /label: 'Scan'/);
    assert.match(bottomNav, /grid-cols-8/);
    assert.match(bottomNav, /useHaptic/);
    assert.match(bottomNav, /impact\(\)/);
    assert.match(bottomNav, /Deals/);
    assert.match(bottomNav, /List/);
    assert.match(bottomNav, /Nearby/);
    assert.match(bottomNav, /Watchlist/);
    assert.match(bottomNav, /href: '\/contact'[\s\S]*label: 'Contact'/);
    assert.match(dataUi, /import \{ BottomNav \} from '\.\/bottom-nav'/);
    assert.match(dataUi, /pb-20/);
    assert.match(dataUi, /lg:pb-6/);
    assert.match(dataUi, /<BottomNav \/>/);
  });

  it('surfaces scanner quick action copy and target anchor for mobile bottom nav', async () => {
    const scanner = await read('src/app/scanner/page.tsx');
    const haptic = await read('src/hooks/useHaptic.ts');

    assert.match(scanner, /Mobile scanner shortcut/);
    assert.match(scanner, /Bottom nav keeps in-store workflows one tap away/);
    assert.match(scanner, /id="scan"/);
    assert.match(scanner, /ScannerUploadActions/);
    assert.match(haptic, /impact: \(\) => vibrate\(\[10, 18, 10\]\)/);
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

  it('surfaces synced map and list selection on the map route', async () => {
    const route = await read('src/app/map/page.tsx');
    const map = await read('src/components/store-map.tsx');

    assert.match(route, /StoreMap/);
    assert.match(route, /Synced map \+ list/);
    assert.match(route, /map ↔ list sync/);
    assert.match(map, /syncedMapListStores/);
    assert.match(map, /selectedStoreSlug/);
    assert.match(map, /setSelectedStoreSlug/);
    assert.match(map, /data-store-slug/);
    assert.match(map, /aria-pressed/);
    assert.match(map, /mapRef/);
    assert.match(map, /easeTo|flyTo/);
    assert.match(map, /chainIndexScore/);
    assert.match(map, /osmStores/);
    assert.doesNotMatch(map, /Math\.random/);
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

  it('surfaces a basket-cost heatmap by area from the weekly basket optimizer without branch-price invention', async () => {
    const heatmap = await read('src/lib/map-basket-cost-heatmap.ts');
    const route = await read('src/app/map/page.tsx');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(heatmap, /basketCostHeatmap/);
    assert.match(heatmap, /compareBasketStrategies/);
    assert.match(heatmap, /summarizeStoreBasketCoverage/);
    assert.match(heatmap, /weeklyBasketOptimizerInput/);
    assert.match(heatmap, /storeUniverse/);
    assert.match(heatmap, /branch-level basket prices are not invented/);
    assert.match(route, /basketCostHeatmap/);
    assert.match(route, /Basket-cost heatmap by area/);
    assert.match(route, /data-basket-cost-heatmap/);
    assert.match(route, /No branch-level basket quote/);
    assert.match(shell, /homepageBasketCostHeatmap/);
    assert.match(shell, /Basket-cost heatmap/);
    assert.match(shell, /data-basket-cost-heatmap/);
    assert.match(shell, /Basket-cost heatmap by area/);
    assert.doesNotMatch(`${heatmap}\n${route}\n${shell}`, /Math\.random|Date\.now/);
  });

  it('surfaces a cheapest-branch-near-me highlight from branch-level evidence', async () => {
    const route = await read('src/app/map/page.tsx');

    assert.match(route, /storePricePercentileRanks/);
    assert.match(route, /cheapestBranchNearMe/);
    assert.match(route, /Cheapest branch near me/);
    assert.match(route, /branch-level evidence/);
    assert.match(route, /per-branch Lidl offer observations/);
    assert.match(route, /cheaperThanNationalLabel/);
    assert.match(route, /coverageLabel/);
    assert.match(route, /No private location/);
    assert.doesNotMatch(route, /Math\.random/);
  });

  it('surfaces a fail-closed regional price statistics gate on the map', async () => {
    const route = await read('src/app/map/page.tsx');

    assert.match(route, /regionalPriceStatisticsGate/);
    assert.match(route, /buildRegionalPriceStatisticsGate/);
    assert.match(route, /cityPriceStatisticRows/);
    assert.match(route, /districtPriceStatisticRows/);
    assert.match(route, /Regional \/ district \/ city price statistics/);
    assert.match(route, /per-branch observations/);
    assert.match(route, /No regional price statistic is calculated without per-branch observations/);
    assert.match(route, /confidence\/coverage/);
    assert.match(route, /storeUniverse/);
    assert.doesNotMatch(route, /Math\.random/);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });

  it('surfaces a fail-closed store price-percentile rank gate on store pages', async () => {
    const route = await read('src/app/stores/[slug]/page.tsx');

    assert.match(route, /storePricePercentileRankFor/);
    assert.match(route, /storeUniverse/);
    assert.match(route, /price-percentile rank/);
    assert.match(route, /your store vs everyone/);
    assert.match(route, /kommun cohort/);
    assert.match(route, /national cohort/);
    assert.match(route, /per-branch observations/);
    assert.match(route, /No percentile is calculated without per-branch observations/);
    assert.match(route, /confidence\/coverage/);
    assert.doesNotMatch(route, /Math\.random/);
    assert.doesNotMatch(route, /NoVerifiedData/);
  });

  it('surfaces store detail opening hours and category-sorted assortment overview', async () => {
    const route = await read('src/app/stores/[slug]/page.tsx');
    const verified = await read('src/lib/verified-data.ts');

    assert.match(verified, /storeOpeningHoursLabel/);
    assert.match(verified, /storeAssortmentOverviewForStore/);
    assert.match(verified, /sort\(\(left, right\) => left\.category\.localeCompare\(right\.category/);
    assert.match(route, /Opening hours/);
    assert.match(route, /Assortment overview/);
    assert.match(route, /assortmentOverview\.categories\.map/);
    assert.match(route, /assortmentOverview\.items\.slice/);
    assert.match(route, /branch-specific assortment rows/i);
    assert.match(route, /No branch-specific assortment rows/i);
    assert.doesNotMatch(route, /Math\.random/);
    assert.doesNotMatch(route, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('adds an ICA locator entry point from the store directory', async () => {
    const route = await read('src/app/stores/page.tsx');
    assert.match(route, /href="\/stores\/ica"/);
    assert.match(route, /ICA chain locator/);
  });

  it('surfaces real store price percentiles from branch-scoped Lidl observations when matched', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/stores/[slug]/page.tsx');

    assert.match(verified, /storePricePercentileRanks/);
    assert.match(verified, /lidlStoreOffers/);
    assert.match(verified, /matchedPerBranchObservationCount/);
    assert.match(verified, /nationalPricePercentile/);
    assert.match(verified, /kommunPricePercentile/);
    assert.match(verified, /cheaperThanNationalPct/);
    assert.match(verified, /kommunDerivedFrom/);
    assert.match(route, /storePricePercentileRanks/);
    assert.match(route, /per-branch Lidl offer observations/);
    assert.match(route, /cheaper than/);
    assert.match(route, /nationalPricePercentile/);
    assert.match(route, /kommunPricePercentile/);
    assert.match(route, /confidence\/coverage/);
    assert.doesNotMatch(route, /Math\.random/);
    assert.doesNotMatch(route, /@\/lib\/demo-data|@\/components\/sample-data/);
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

  it('surfaces launch fixture store slugs on the homepage visible artifact', async () => {
    const shell = await read('src/components/market-shell.tsx');

    assert.match(shell, /launchFixtureStores/);
    assert.match(shell, /willys-odenplan/);
    assert.match(shell, /ica-nara-sergels-torg/);
    assert.match(shell, /coop-swedenborgsgatan/);
    assert.match(shell, /lidl-sveavagen/);
    assert.match(shell, /data-store-slug=\{store\.slug\}/);
    assert.match(shell, /data-product-slug=\{product\.slug\}/);
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

  it('surfaces a private-label dupe finder using the real smart-swap engine', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const compare = await read('src/app/compare/page.tsx');

    assert.match(verified, /recommendSmartSwaps/);
    assert.match(verified, /privateLabelDupeFinder/);
    assert.match(verified, /budget_private_label/);
    assert.match(verified, /standard_private_label/);
    assert.match(verified, /nationalBrand/);
    assert.match(shell, /Private-label dupe finder/);
    assert.match(shell, /privateLabelDupeFinder\.topDupes/);
    assert.match(compare, /privateLabelDupeFinder/);
    assert.match(compare, /No brand-name row is paired with a private label unless recommendSmartSwaps clears/);
    assert.doesNotMatch(shell, /@\/lib\/demo-data/);
    assert.doesNotMatch(compare, /@\/components\/sample-data/);
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

  it('surfaces a factual typical price range and volatility band from observed history', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /priceTypicalRangeBandFor/);
    assert.match(source, /quantileFor/);
    assert.match(source, /typicalRangeLabel/);
    assert.match(source, /volatilityBandLabel/);
    assert.match(source, /volatilityPercentLabel/);
    assert.match(source, /Typical range \/ volatility band/);
    assert.match(source, /middle 50%/);
    assert.match(source, /usually/);
    assert.match(source, /product's own observed 1-year price tape/);
    assert.match(source, /No forecast or seasonal prediction is shown/);
    assert.match(source, /Not enough dated observations/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });
  it('adds accessible volatility methodology popovers to product cards', async () => {
    const cards = await read('src/components/product-price-cards.tsx');
    const intelligence = await read('src/lib/price-intelligence.ts');

    assert.match(cards, /volatilityBadgeMethodology/);
    assert.match(cards, /<details/);
    assert.match(cards, /aria-label=\{`\$\{card\.name\} volatility score methodology`\}/);
    assert.match(cards, /historical observations/);
    assert.match(intelligence, /0-100 volatility score/);
    assert.match(intelligence, /observationCount/);
    assert.match(intelligence, /No future price forecast/);
  });


  it('surfaces a factual price-change event log from consecutive observed prices', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /priceChangeEventLogFor/);
    assert.match(source, /priceChangeEvents/);
    assert.match(source, /changePercentLabel/);
    assert.match(source, /price-change event log/);
    assert.match(source, /consecutive dated observations/);
    assert.match(source, /dropped/);
    assert.match(source, /rose/);
    assert.match(source, /No forecast or seasonal prediction is shown/);
    assert.match(source, /Not enough dated observations/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces price-move explanation notes from observed event logs without invented causes', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /priceMoveNotesFor/);
    assert.match(source, /priceChangeEventLogFor/);
    assert.match(source, /Why this price moved/);
    assert.match(source, /price_change/);
    assert.match(source, /chartMarkerKey/);
    assert.match(source, /data-price-move-chart-marker/);
    assert.match(source, /sourceProvenance/);
    assert.match(source, /consecutive OpenPrices rows/);
    assert.match(source, /No news or retailer cause is inferred/);
    assert.match(source, /no promotion or seasonality claim/i);
    assert.doesNotMatch(source, /invented cause|retailer news claim|synthetic explanation/i);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces a seasonal-by-month view from historical monthly averages without forecasting', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /seasonalMonthlyAveragesFor/);
    assert.match(source, /monthlySeasonalityRows/);
    assert.match(source, /monthAverageLabel/);
    assert.match(source, /monthObservationCount/);
    assert.match(source, /seasonal-by-month view/);
    assert.match(source, /historical monthly average/);
    assert.match(source, /avg price per month/);
    assert.match(source, /No forecast or seasonal prediction is shown/);
    assert.match(source, /Not enough dated observations/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces an honest cross-chain history overlay gate without synthetic chain history', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /crossChainHistoryOverlayFor/);
    assert.match(source, /crossChainOverlaySeries/);
    assert.match(source, /chainHistoryCoverageRows/);
    assert.match(source, /cross-chain history overlay/);
    assert.match(source, /per-chain dated price tape/);
    assert.match(source, /No forecast or synthetic chain history is shown/);
    assert.match(source, /Not enough per-chain dated observations/);
    assert.match(source, /buildPriceChartSeries/);
    assert.doesNotMatch(source, /@\/lib\/demo-data/);
    assert.doesNotMatch(source, /@\/components\/sample-data/);
  });

  it('surfaces an honest intra-chain branch spread gate without branch-price claims', async () => {
    const source = await read('src/app/products/[slug]/page.tsx');

    assert.match(source, /intraChainBranchSpreadFor/);
    assert.match(source, /branchSpreadRows/);
    assert.match(source, /cheapestBranchLabel/);
    assert.match(source, /dearestBranchLabel/);
    assert.match(source, /intra-chain branch spread/);
    assert.match(source, /per-branch shelf observations/);
    assert.match(source, /No branch spread is calculated from chain-wide catalogue prices/);
    assert.match(source, /confidence\/coverage/);
    assert.match(source, /chainPriceRows/);
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
    assert.match(chart, /import\('lightweight-charts'\)/);
    assert.match(chart, /createChart/);
    assert.match(chart, /LineSeries/);
    assert.match(chart, /chartLoadStatus/);
    assert.match(chart, /aria-live="polite"/);
    assert.doesNotMatch(chart, /import\s+\{[^}]*createChart[^}]*\}\s+from 'lightweight-charts'/);
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

  it('surfaces query-driven chain comparison table on the compare route', async () => {
    const route = await read('src/app/compare/page.tsx');
    const compareLib = await read('src/lib/chain-compare.ts');

    assert.match(route, /searchParams\?: Promise<SearchParams>/);
    assert.match(route, /buildChainComparisonTable/);
    assert.match(route, /productsParam/);
    assert.match(route, /Chain comparison table/);
    assert.match(route, /<table/);
    assert.match(route, /comparison\.products\.filter/);
    assert.match(route, /rowSections\.map/);
    assert.match(route, /section\.rows\.map/);
    assert.match(route, /ICA/);
    assert.match(route, /Willys/);
    assert.match(route, /Coop/);
    assert.match(compareLib, /COMPARE_CHAIN_ORDER = \[/);
    assert.match(compareLib, /id: 'ica'/);
    assert.match(compareLib, /id: 'willys'/);
    assert.match(compareLib, /id: 'coop'/);
    assert.match(compareLib, /dbSiteSnapshotGeneratedAt/);
    assert.match(compareLib, /postgres\.latest_prices\/observations/);
    assert.match(compareLib, /productsParam\.split\(','\)/);
    assert.match(compareLib, /axfoodProducts/);
    assert.doesNotMatch(compareLib, /Math\.random|placeholder|synthetic/i);
  });

  it('surfaces an item comparison route with four-item nutrition, store price, and trend coverage', async () => {
    const route = await read('src/app/compare-items/page.tsx');
    const table = await read('src/components/ItemComparisonTable.tsx');
    const verified = await read('src/lib/verified-data.ts');
    const nav = await read('src/components/app-nav.tsx');
    const seo = await read('src/lib/seo.ts');
    const sitemap = await read('src/app/sitemap.ts');
    const apiCompare = await read('../../apps/api/src/routes/compare.ts');

    assert.match(route, /routeMetadata\('\/compare-items'\)/);
    assert.match(route, /buildItemComparisonView/);
    assert.match(route, /ItemComparisonTable/);
    assert.match(route, /items\?: string \| string\[\]/);
    assert.match(route, /up to four items/i);
    assert.match(table, /export function ItemComparisonTable/);
    assert.match(table, /data-item-comparison-table/);
    assert.match(table, /Nutrition/);
    assert.match(table, /Price across stores/);
    assert.match(table, /Trend charts/);
    assert.match(table, /trendPoints/);
    assert.match(verified, /MAX_ITEM_COMPARISON_ITEMS = 4/);
    assert.match(verified, /export function buildItemComparisonView/);
    assert.match(verified, /slice\(0, MAX_ITEM_COMPARISON_ITEMS\)/);
    assert.match(verified, /nutriScore/);
    assert.match(verified, /storePrices/);
    assert.match(verified, /trendPoints/);
    assert.match(apiCompare, /compareRoutes/);
    assert.match(apiCompare, /itemComparison/);
    assert.match(apiCompare, /maxItems: 4/);
    assert.match(apiCompare, /nutrition/);
    assert.match(apiCompare, /storePrices/);
    assert.match(apiCompare, /trendPoints/);
    assert.doesNotMatch(nav, /href: '\/compare-items'/);
    assert.match(seo, /'\/compare-items'/);
    assert.match(sitemap, /entry\('\/compare-items'/);
  });

  it('surfaces a compare-overlay chart from real price chart series output', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/compare/page.tsx');

    assert.match(verified, /compareOverlayChart/);
    assert.match(verified, /buildPriceChartSeries/);
    assert.match(verified, /rangeDays: 365/);
    assert.match(verified, /provenanceLabel/);
    assert.match(route, /compareOverlayChart/);
    assert.match(route, /Compare-overlay chart/);
    assert.match(route, /overlaySeries/);
    assert.match(route, /lineStyle/);
    assert.match(route, /No forecast/);
    assert.doesNotMatch(route, /Math\.random|placeholder|synthetic/i);
  });

  it('surfaces a retailer browser overlay contract backed by the cheapest-now API', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/compare/page.tsx');
    const overlay = await read('public/extension/retailer-overlay.js');
    const manifest = await read('public/extension/manifest.json');
    const server = await read('../../packages/server/src/index.ts');

    assert.match(verified, /export const browserExtensionOverlayContract = /);
    assert.match(verified, /\/extension\/manifest\.json/);
    assert.match(verified, /\/extension\/retailer-overlay\.js/);
    assert.match(verified, /\/api\/products\/\{productId\}\/cheapest-now/);
    assert.match(verified, /JSON-LD gtin\/ean/);
    assert.match(route, /browserExtensionOverlayContract/);
    assert.match(route, /Retailer browser overlay/);
    assert.match(route, /data-groceryview-product-id/);
    assert.match(route, /Extension manifest/);
    assert.match(overlay, /data-groceryview-product-id/);
    assert.match(overlay, /gtin13|gtin14|gtin12|gtin8/);
    assert.match(overlay, /commodityAliases/);
    assert.match(overlay, /MutationObserver/);
    assert.match(overlay, /\/api\/products\/\$\{encodeURIComponent\(productId\)\}\/cheapest-now/);
    assert.match(overlay, /cheapest\.chain/);
    assert.match(overlay, /confidence/);
    assert.match(overlay, /No anonymous|anonymous shopper profile/);
    assert.doesNotMatch(overlay, /sessionStorage|localStorage\.setItem|demo-data|sample-data/i);
    assert.match(manifest, /"manifest_version": 3/);
    assert.match(manifest, /"https:\/\/\*\.ica\.se\/\*"/);
    assert.match(manifest, /"https:\/\/\*\.coop\.se\/\*"/);
    assert.match(manifest, /"https:\/\/\*\.willys\.se\/\*"/);
    assert.match(manifest, /retailer-overlay\.js/);
    assert.match(server, /cheapest-now/);
    assert.match(server, /getProductCheapestNow/);
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

  it('surfaces a trending products carousel from DB time-series price changes on the homepage', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const carousel = await read('src/components/TrendingCarousel.tsx');

    assert.match(verified, /summarizeTrendingProductPriceChanges/);
    assert.match(verified, /type TrendingPriceChangePoint/);
    assert.match(verified, /export const homepageTrendingPriceChanges = /);
    assert.match(verified, /windowDays: 7/);
    assert.match(verified, /limit: 10/);
    assert.match(shell, /TrendingCarousel/);
    assert.match(shell, /homepageTrendingPriceChanges/);
    assert.match(carousel, /Most price changes in the last 7 days/);
    assert.match(carousel, /data-trending-carousel/);
    assert.match(carousel, /item\.changeCount/);
    assert.match(carousel, /\/products\/\$\{item\.productSlug\}/);
    assert.doesNotMatch(carousel, /@\/lib\/demo-data/);
    assert.doesNotMatch(carousel, /@\/components\/sample-data/);
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

  it('promotes friend-shared deal suggestions in discovery from opted-in social signals', async () => {
    const core = await read('../../packages/core/src/index.ts');
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(core, /suggestFriendSharedDeals/);
    assert.match(core, /optedIn/);
    assert.match(core, /socialProofScore/);
    assert.match(verified, /friendSharedDealShareSignals/);
    assert.match(verified, /friendSharedDealSuggestions/);
    assert.match(verified, /suggestFriendSharedDeals/);
    assert.match(verified, /no anonymous or non-consented shares/);
    assert.match(shell, /Friend-shared deal suggestions/);
    assert.match(shell, /data-friend-shared-deal/);
    assert.match(shell, /suggestion\.socialProofScore/);
    assert.doesNotMatch(shell, /@\/lib\/demo-data/);
  });

  it('surfaces friend price sightings in the social feed with product, store, time, and confidence', async () => {
    const social = await read('src/lib/social.ts');
    const feed = await read('src/components/feed/social-feed.tsx');
    const badge = await read('src/components/confidence-badge.tsx');

    assert.match(social, /FriendPriceSighting/);
    assert.match(social, /friendPriceSightings/);
    assert.match(social, /productName/);
    assert.match(social, /storeName/);
    assert.match(social, /observedAt/);
    assert.match(social, /confidence/);
    assert.match(feed, /Opt-in friend price sightings/);
    assert.match(feed, /listFriendPriceSightings/);
    assert.match(feed, /sighting\.productName/);
    assert.match(feed, /sighting\.storeName/);
    assert.match(feed, /sighting\.observedAt/);
    assert.match(feed, /ConfidenceBadge/);
    assert.match(badge, /confidenceCopy/);
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

  it('ships a product detail alias with visible image, current chain prices, and full price-history chart', async () => {
    const canonicalProductRoute = await read('src/app/products/[slug]/page.tsx');
    const singularProductRoute = await read('src/app/product/[id]/page.tsx');

    assert.match(singularProductRoute, /ProductPage/);
    assert.match(singularProductRoute, /generateProductMetadata/);
    assert.match(singularProductRoute, /params\.then\(\(\{ id \}\) => \(\{ slug: id \}\)\)/);

    assert.match(canonicalProductRoute, /<Image/);
    assert.match(canonicalProductRoute, /src=\{product\.image/);
    assert.match(canonicalProductRoute, /alt=\{product\.name\}/);
    assert.match(canonicalProductRoute, /Primary price evidence/);
    assert.match(canonicalProductRoute, /Chain price rows/);
    assert.match(canonicalProductRoute, /chainPriceRows\(product\)/);
    assert.match(canonicalProductRoute, /PriceChartTerminal/);
    assert.match(canonicalProductRoute, /rangeDays: 90/);
    assert.doesNotMatch(canonicalProductRoute, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('renders category pages with a DB hierarchy-backed breadcrumb component', async () => {
    const categoryRoute = await read('src/app/categories/[slug]/page.tsx');
    const breadcrumb = await read('src/components/Breadcrumb.tsx');
    const db = await read('../../packages/db/src/index.ts');

    assert.match(db, /groceryCategoryHierarchy/);
    assert.match(db, /categoryPathForSlug/);
    assert.match(breadcrumb, /aria-label="Breadcrumb"/);
    assert.match(breadcrumb, /@groceryview\/db/);
    assert.match(breadcrumb, /CategoryBreadcrumb/);
    assert.match(categoryRoute, /CategoryBreadcrumb/);
    assert.match(categoryRoute, /categoryLabel=\{categoryLabel\}/);
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

  it('ships Swedish and English privacy plus cookie policy pages for consent compliance', async () => {
    const privacy = await read('src/app/privacy/page.tsx');
    const cookies = await read('src/app/cookies/page.tsx');
    const cmp = await read('src/components/consent-manager.tsx');
    const seo = await read('src/lib/seo.ts');
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(privacy, /Integritetspolicy/);
    assert.match(privacy, /Privacy policy/);
    assert.match(privacy, /buildPrivacyExport/);
    assert.match(privacy, /privacyExportContract/);
    assert.match(privacy, /Export my data/);
    assert.match(privacy, /Core export contract/);
    assert.match(privacy, /privacyExportContract\.sections/);
    assert.match(privacy, /Delete my account/);
    assert.match(privacy, /receipt/i);
    assert.match(privacy, /retention/i);
    assert.match(privacy, /encryption/i);
    assert.match(privacy, /GDPR data subject rights/i);
    assert.match(privacy, /No anonymous privacy requests/);
    assert.doesNotMatch(privacy, /demo-data|sample-data|mock session/i);

    assert.match(cookies, /Cookiepolicy/);
    assert.match(cookies, /Cookie policy/);
    assert.match(cookies, /IAB TCF v2\.2/);
    assert.match(cookies, /Google Consent Mode v2/);
    assert.match(cookies, /necessary/);
    assert.match(cookies, /analytics/);
    assert.match(cookies, /ads/);
    assert.match(cookies, /personalisation/);
    assert.match(cookies, /non-personalised/);
    assert.match(cookies, /policyVersion/);
    assert.match(cookies, /timestamp/);

    assert.match(cmp, /\/cookies/);
    assert.match(seo, /'\/cookies'/);
    assert.match(sitemap, /entry\('\/cookies'/);
  });

  it('ships Nordic per-country terms with consumer protection clauses', async () => {
    const terms = await read('src/app/[country]/terms/page.tsx');

    assert.match(terms, /generateStaticParams/);
    assert.match(terms, /slug: 'norway'/);
    assert.match(terms, /slug: 'iceland'/);
    assert.match(terms, /Forbrukerkjøpsloven/);
    assert.match(terms, /Forbrukertilsynet/);
    assert.match(terms, /Forbrukerradet/);
    assert.match(terms, /Neytendastofa/);
    assert.match(terms, /Kærunefnd vöru- og þjónustukaupa/);
    assert.match(terms, /mandatory consumer protection rules/);
    assert.match(terms, /notFound\(\)/);
    assert.match(terms, /\/\$\{terms\.slug\}\/terms/);
    assert.doesNotMatch(terms, /demo-data|sample-data|mock session|TODO|console\./i);
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
    assert.match(sitemap, /axfoodProducts/);
    assert.match(sitemap, /pricedProducts/);
    assert.match(sitemap, /osmStores/);
    assert.match(sitemap, /groceryCategoryHierarchy/);
    assert.match(sitemap, /\/products\/\$\{product\.slug\}/);
    assert.match(sitemap, /\/stores\/\$\{store\.slug\}/);
    assert.match(sitemap, /\/categories\/\$\{category\.slug\}/);
    assert.match(sitemap, /entry\('\/screener'/);
    assert.match(sitemap, /changeFrequency/);
    assert.match(sitemap, /lastModified/);
    assert.doesNotMatch(sitemap, /@\/lib\/demo-data|@\/components\/sample-data/);

    assert.match(robots, /MetadataRoute\.Robots/);
    assert.match(robots, /https:\/\/grocery-web-mu\.vercel\.app\/sitemap\.xml/);
    assert.match(robots, /userAgent: '\*'/);
    assert.match(robots, /allow: \[/);
    assert.match(robots, /\/products/);
    assert.match(robots, /\/categories/);
    assert.match(robots, /disallow: \[/);
    assert.match(robots, /\/account/);
    assert.match(robots, /\/login/);
    assert.match(robots, /\/api/);
    assert.match(robots, /\/admin/);
    assert.match(robots, /\/users/);
  });

  it('drives dynamic product, category, and store sitemap URLs from DB catalog-shaped records', async () => {
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(sitemap, /@groceryview\/db/);
    assert.match(sitemap, /ProductCatalogRecord/);
    assert.match(sitemap, /StoreCatalogRecord/);
    assert.match(sitemap, /buildCatalogSitemapEntries/);
    assert.match(sitemap, /const productSitemapRecords: ProductSitemapRecord\[\] = \[/);
    assert.match(sitemap, /\.\.\.axfoodProducts\.map\(\(product\) =>/);
    assert.match(sitemap, /\.\.\.pricedProducts\.map\(\(product\) =>/);
    assert.match(sitemap, /groceryCategoryHierarchy\.filter\(\(category\) => category\.routable\)/);
    assert.match(sitemap, /uniqueRecordsBySlug\(productSitemapRecords\)/);
    assert.match(sitemap, /uniqueRecordsBySlug\(storeSitemapRecords\)/);
    assert.match(sitemap, /lastModifiedFrom\(product\.updatedAt\)/);
    assert.match(sitemap, /lastModifiedFrom\(store\.updatedAt\)/);
    assert.match(sitemap, /\/products\/\$\{product\.slug\}/);
    assert.match(sitemap, /\/categories\/\$\{category\.slug\}/);
    assert.match(sitemap, /\/stores\/\$\{store\.slug\}/);
    assert.doesNotMatch(sitemap, /productUniverse/);
    assert.doesNotMatch(sitemap, /osmStores\.slice\(0,\s*80\)/);
  });

  it('emits sitemap entries for Nordic country terms URLs', async () => {
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(sitemap, /countryTermsRoutes/);
    for (const country of ['sweden', 'norway', 'denmark', 'finland', 'iceland']) {
      assert.match(sitemap, new RegExp(`'${country}'`));
    }
    assert.match(sitemap, /entry\(`\/\$\{country\}\/terms`, 0\.52, 'monthly'\)/);
  });

  it('keeps public item and search entry points in sitemap and canonical metadata coverage', async () => {
    const seo = await read('src/lib/seo.ts');
    const sitemap = await read('src/app/sitemap.ts');
    const itemsPage = await read('src/app/items/page.tsx');
    const searchPage = await read('src/app/search/page.tsx');

    assert.match(seo, /'\/items'/);
    assert.match(seo, /'\/search'/);
    assert.match(seo, /Item detail lookup/);
    assert.match(seo, /Product search/);
    assert.match(sitemap, /entry\('\/items'/);
    assert.match(sitemap, /entry\('\/search'/);
    assert.match(sitemap, /public entry points/i);
    assert.match(itemsPage, /routeMetadata\('\/items'\)/);
    assert.match(itemsPage, /ProductsPage/);
    assert.match(searchPage, /routeMetadata\('\/search'\)/);
    assert.match(searchPage, /buildProductSearchView/);
    assert.match(searchPage, /Cursor-paginated search results/);
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
      'src/app/compare-items/page.tsx',
      'src/app/coverage/page.tsx',
      'src/app/coupon-stacks/page.tsx',
      'src/app/cookies/page.tsx',
      'src/app/data-sources/page.tsx',
      'src/app/deals/page.tsx',
      'src/app/fuel/page.tsx',
      'src/app/favorites/page.tsx',
      'src/app/household/page.tsx',
      'src/app/items/page.tsx',
      'src/app/items/[id]/page.tsx',
      'src/app/login/page.tsx',
      'src/app/map/page.tsx',
      'src/app/meal-planner/page.tsx',
      'src/app/nutrition-value/page.tsx',
      'src/app/openprices-depth/page.tsx',
      'src/app/pantry-planner/page.tsx',
      'src/app/pharmacy/page.tsx',
      'src/app/price-reports/page.tsx',
      'src/app/pricing/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/prisjamforelse/[slug]/page.tsx',
      'src/app/products/page.tsx',
      'src/app/products/[slug]/page.tsx',
      'src/app/savings-dashboard/page.tsx',
      'src/app/scanner/page.tsx',
      'src/app/search/page.tsx',
      'src/app/screener/page.tsx',
      'src/app/seasonal-calendar/page.tsx',
      'src/app/shopping-trips/page.tsx',
      'src/app/store-coverage/page.tsx',
      'src/app/stores/page.tsx',
      'src/app/stores/[slug]/page.tsx',
      'src/app/unit-price-alerts/page.tsx',
      'src/app/watchlist/page.tsx',
      'src/app/widgets/grocery-index-ticker/page.tsx',
      'src/app/weekly-basket/page.tsx',
      'src/app/[country]/billigaste/[slug]/page.tsx'
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

  it('ships metadataBase and hreflang alternates for the supported locale pair', async () => {
    const seo = await read('src/lib/seo.ts');
    const localeHome = await read('src/components/locale-home-page.tsx');
    const routing = await read('src/lib/i18n-routing.ts');
    const layout = await read('src/app/layout.tsx');

    assert.match(routing, /supportedLocales = \['sv', 'en'\]/);
    assert.match(layout, /metadataBase: new URL\(siteUrl\)/);
    assert.match(seo, /metadataBase: new URL\(siteUrl\)/);
    assert.match(seo, /languageAlternateUrls/);
    assert.match(seo, /'sv-SE'/);
    assert.match(seo, /'en-SE'/);
    assert.match(seo, /'x-default'/);
    assert.match(seo, /alternates: \{[\s\S]*canonical:[\s\S]*languages: languageAlternateUrls\(config\.path\)/);
    assert.match(seo, /locale-negotiated current route/i);
    assert.match(localeHome, /metadataBase: new URL\(siteUrl\)/);
    assert.match(localeHome, /languageHomeAlternates/);
    assert.match(localeHome, /\/sv/);
    assert.match(localeHome, /\/en/);
    assert.doesNotMatch(seo, /NoVerifiedData/);
  });

  it('keeps programmatic city/product SEO pages canonicalized behind coverage guards', async () => {
    const seo = await read('src/lib/seo.ts');
    const landing = await read('src/lib/seo-landing-pages.ts');

    assert.match(seo, /canonicalPath\?: string/);
    assert.match(seo, /const alternatePath = config\.canonicalPath \?\? config\.path/);
    assert.match(seo, /canonical: canonical, languages: languageAlternateUrls\(alternatePath\)/);
    assert.match(seo, /follow: config\.noIndexFollow \?\? false/);

    assert.match(landing, /programmaticSeoIndexingGuard/);
    assert.match(landing, /minimumVerifiedChainRows: 2/);
    assert.match(landing, /minimumCityVerifiedChainRows: 3/);
    assert.match(landing, /hasCitySpecificAvailability: false/);
    assert.match(landing, /cityCheapestLandingSeoDecision/);
    assert.match(landing, /canonicalPath: indexable \? cityPath : fallbackCanonicalPath/);
    assert.match(landing, /noIndex: !indexable/);
    assert.match(landing, /metadataForCityCheapestLanding/);
    assert.match(landing, /noIndexFollow: seoDecision\.noIndexFollow/);
  });

  it('ships an installable PWA-first web manifest for mobile grocery checks', async () => {
    const manifestPath = 'src/app/manifest.ts';
    assert.equal(await fileExists(manifestPath), true, 'App Router should expose /manifest.webmanifest');

    const manifest = await read(manifestPath);
    const seo = await read('src/lib/seo.ts');
    const shell = await read('src/components/market-shell.tsx');
    const pwaIcon = await read('public/pwa-icon.svg');
    const maskableIcon = await read('public/pwa-maskable-icon.svg');

    assert.match(manifest, /import type \{ MetadataRoute \} from 'next'/);
    assert.match(manifest, /display: 'standalone'/);
    assert.match(manifest, /start_url:/);
    assert.match(manifest, /scope:/);
    assert.match(manifest, /theme_color: '#064e3b'/);
    assert.match(manifest, /pwa-icon\.svg/);
    assert.match(manifest, /pwa-maskable-icon\.svg/);
    assert.match(manifest, /purpose: 'maskable'/);
    assert.match(seo, /manifest\.webmanifest/);
    assert.match(shell, /PWA-first mobile install/);
    assert.match(shell, /Install on phone/);
    assert.match(shell, /manifest\.webmanifest/);
    assert.match(shell, /verified prices load before the app shell asks for anything private/);
    assert.match(pwaIcon, /GroceryView/);
    assert.match(maskableIcon, /maskable GroceryView icon/);
  });

  it('registers a service worker that caches the last 50 item pages for offline browsing', async () => {
    assert.equal(await fileExists('public/sw.js'), true, 'service worker should be served from /sw.js');
    assert.equal(await fileExists('src/lib/swRegister.ts'), true, 'browser registration helper should exist');

    const worker = await read('public/sw.js');
    const registrar = await read('src/lib/swRegister.ts');
    const layout = await read('src/app/layout.tsx');

    assert.match(worker, /MAX_ITEM_PAGE_CACHE_ENTRIES = 50/);
    assert.match(worker, /ITEM_PAGE_CACHE_NAME/);
    assert.match(worker, /isItemPageRequest/);
    assert.match(worker, /\\\/products\\\/\[\^\/\]\+/);
    assert.match(worker, /\\\/product\\\/\[\^\/\]\+/);
    assert.match(worker, /trimItemPageCache/);
    assert.match(worker, /cache\.keys\(\)/);
    assert.match(worker, /event\.respondWith/);
    assert.match(worker, /ignoreSearch: true/);
    assert.match(registrar, /navigator\.serviceWorker\.register\('\/sw\.js'/);
    assert.match(registrar, /ServiceWorkerRegistrar/);
    assert.match(layout, /ServiceWorkerRegistrar/);
  });

  it('caches the active shopping list and last known prices for offline store trips', async () => {
    const manifest = await read('src/app/manifest.ts');
    const worker = await read('public/sw.js');
    const registrar = await read('src/lib/swRegister.ts');
    const shoppingListPage = await read('src/app/list/page.tsx');
    const listSharePreview = await read('src/components/list-share-preview.tsx');

    assert.match(manifest, /Open shopping list/);
    assert.match(manifest, /url: '\/list'/);
    assert.match(worker, /SHOPPING_LIST_CACHE_NAME = 'groceryview-shopping-list-route-v1'/);
    assert.match(worker, /isShoppingListRequest/);
    assert.match(worker, /\\\/list\\\/\?\$/);
    assert.match(worker, /shoppingListNetworkFirst/);
    assert.match(registrar, /SHOPPING_LIST_ROUTE_CACHE_NAME = 'groceryview-shopping-list-route-v1'/);
    assert.match(registrar, /OFFLINE_SAVED_LIST_BASE_ROUTES = \['\/list'/);
    assert.match(registrar, /cache\.add\(route\)/);
    assert.doesNotMatch(registrar, /console\./);
    assert.match(shoppingListPage, /ListSharePreview/);
    assert.match(listSharePreview, /OFFLINE_SHOPPING_LIST_CACHE_KEY = 'groceryview:shopping-list:offline-cache:v1'/);
    assert.match(listSharePreview, /cheapestSourceForProductSlug/);
    assert.match(listSharePreview, /lastKnownPrices/);
    assert.match(listSharePreview, /window\.localStorage\.setItem\(OFFLINE_SHOPPING_LIST_CACHE_KEY/);
  });


  it('embeds Google Maps pins and directions on store detail pages', async () => {
    const storePage = await read('src/app/stores/[slug]/page.tsx');
    const storeMap = await read('src/components/StoreMap.tsx');
    const mapsConfig = await read('src/lib/mapsConfig.ts');

    assert.match(storePage, /StoreMap/);
    assert.match(storePage, /store\.lat/);
    assert.match(storePage, /store\.lng/);
    assert.match(storeMap, /iframe/);
    assert.match(storeMap, /Google Maps location/);
    assert.match(storeMap, /Open Google Maps directions/);
    assert.match(mapsConfig, /googleMapsEmbedUrl/);
    assert.match(mapsConfig, /output=embed/);
    assert.match(mapsConfig, /googleMapsDirectionsUrl/);
    assert.match(mapsConfig, /api=1&destination/);
  });


  it('ships dynamic product OG price images from verified price data', async () => {
    const ogPath = 'src/app/products/[slug]/opengraph-image.tsx';
    assert.equal(await fileExists(ogPath), true, 'product pages should expose a dynamic opengraph-image route');

    const ogImage = await read(ogPath);
    const seo = await read('src/lib/seo.ts');
    const productRoute = await read('src/app/products/[slug]/page.tsx');

    assert.match(ogImage, /ImageResponse/);
    assert.match(ogImage, /from 'next\/og'/);
    assert.match(ogImage, /export const size = \{ width: 1200, height: 630 \}/);
    assert.match(ogImage, /export const contentType = 'image\/png'/);
    assert.match(ogImage, /generateStaticParams/);
    assert.match(ogImage, /productUniverse/);
    assert.match(ogImage, /findProduct/);
    assert.match(ogImage, /notFound/);
    assert.match(ogImage, /chainPriceRows/);
    assert.match(ogImage, /formatSek/);
    assert.match(ogImage, /No synthetic prices/);
    assert.match(ogImage, /Verified price signal/);
    assert.doesNotMatch(ogImage, /@\/lib\/demo-data|@\/components\/sample-data/);

    assert.match(seo, /opengraph-image/);
    assert.match(seo, /openGraph:[\s\S]*images/);
    assert.match(seo, /twitter:[\s\S]*images/);
    assert.match(productRoute, /metadataForProduct/);
  });

  it('ships programmatic SEO landing pages from verified price spreads', async () => {
    const landingData = await read('src/lib/seo-landing-pages.ts');
    const landingComponent = await read('src/components/seo-landing-page.tsx');
    const cheapestRoute = await read('src/app/billigaste/[slug]/page.tsx');
    const compareRoute = await read('src/app/prisjamforelse/[slug]/page.tsx');
    const cityRoute = await read('src/app/[country]/billigaste/[slug]/page.tsx');
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

  it('surfaces instant faceted product search from real catalogue price rows', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const products = await read('src/app/products/page.tsx');
    const packageJson = await read('package.json');

    assert.match(verified, /buildFacetedProductSearch/);
    assert.match(verified, /export const facetedProductSearch/);
    assert.match(verified, /facetedSearchRows/);
    assert.match(verified, /sourceTables/);
    assert.match(products, /Instant faceted search/);
    assert.match(products, /facetedProductSearch/);
    assert.match(products, /categoryFacets/);
    assert.match(products, /labelFacets/);
    assert.match(products, /chainFacets/);
    assert.match(products, /priceRange/);
    assert.match(products, /inStockOnly/);
    assert.match(products, /kr\/kg|kr\/l|per-unit/i);
    assert.match(products, /latest_prices/);
    assert.match(packageJson, /@groceryview\/api/);
  });

  it('uses crawlable URL query params for instant product search facets', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const products = await read('src/app/products/page.tsx');
    const filterPanel = await read('src/components/FilterPanel.tsx');
    const searchFilters = await read('src/lib/search-filters.ts');
    const api = await read('../../packages/api/src/index.ts');

    assert.match(api, /labels\?: string\[\]/);
    assert.match(api, /inStockOnly\?: boolean/);
    assert.match(api, /minConfidence\?: number/);
    assert.match(api, /row\.labels/);
    assert.match(api, /row\.unitPrice/);
    assert.match(verified, /buildProductSearchView/);
    assert.match(verified, /const filters = \{ query, categories, labels, originCountries, chains, minPrice, maxPrice, inStockOnly, minConfidence/);
    assert.match(verified, /buildFacetedProductSearch\(\{ rows: facetedSearchRows, filters/);
    assert.match(products, /type SearchParams = \{/);
    assert.match(products, /q\?: string \| string\[\]/);
    assert.match(products, /category\?: string \| string\[\]/);
    assert.match(products, /label\?: string \| string\[\]/);
    assert.match(products, /origin\?: string \| string\[\]/);
    assert.match(products, /chain\?: string \| string\[\]/);
    assert.match(products, /minPrice\?: string \| string\[\]/);
    assert.match(products, /maxPrice\?: string \| string\[\]/);
    assert.match(products, /inStockOnly\?: string \| string\[\]/);
    assert.match(products, /minConfidence\?: string \| string\[\]/);
    assert.match(products, /buildProductSearchView\(resolvedSearchParams, \{ accountAvoidAllergensDefault: allergenDefault\.checked \}\)/);
    assert.match(products, /search\.activeFilters/);
    assert.match(products, /href=\{searchFacetUrl\(\{ label: facet\.value \}\)\}/);
    assert.match(products, /href=\{searchFacetUrl\(\{ chain: facet\.value \}\)\}/);
    assert.match(products, /name="q"/);
    assert.match(products, /<AdvancedFilterDrawer/);
    assert.match(products, /inStockOnly=\{search\.filters\.inStockOnly\}/);
    assert.match(filterPanel, /name="inStockOnly"/);
    assert.doesNotMatch(api, /Math\.random|placeholder/i);
  });

  it('ships a cached product and category typeahead suggest API', async () => {
    assert.equal(await fileExists('src/app/api/suggest/route.ts'), true);
    const route = await read('src/app/api/suggest/route.ts');

    assert.match(route, /adaptiveProductCards/);
    assert.match(route, /categorySummaries/);
    assert.match(route, /searchParams\.get\('q'\)/);
    assert.match(route, /query\.length < 1/);
    assert.match(route, /SUGGESTION_LIMIT = 10/);
    assert.match(route, /CACHE_TTL_MS = 60_000/);
    assert.match(route, /suggestionCache/);
    assert.match(route, /startsWith\(query\)/);
    assert.match(route, /word\.startsWith\(query\)/);
    assert.match(route, /includes\(query\)/);
    assert.match(route, /\/products\/\$\{product\.slug\}/);
    assert.match(route, /\/categories\/\$\{category\.slug\}/);
    assert.match(route, /s-maxage=60/);
    assert.doesNotMatch(route, /console\./);
    assert.doesNotMatch(route, /TODO/);
  });

  it('adds common dietary allergen checkbox filters to product listing search', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const products = await read('src/app/products/page.tsx');
    const filterPanel = await read('src/components/FilterPanel.tsx');
    const searchFilters = await read('src/lib/search-filters.ts');

    assert.match(verified, /export const commonDietaryFilterOptions = /);
    assert.match(verified, /value: 'glutenfree'/);
    assert.match(verified, /label: 'Gluten-free'/);
    assert.match(verified, /value: 'laktosfree'/);
    assert.match(verified, /label: 'Lactose-free'/);
    assert.match(verified, /value: 'vegan'/);
    assert.match(verified, /dietaryLabelsForProduct/);
    assert.match(verified, /dietary\?: SearchParamValue/);
    assert.match(verified, /avoidAllergens\?: SearchParamValue/);
    assert.match(verified, /const dietaryLabels = dietarySearchValues\(searchParams\.dietary\)/);
    assert.match(verified, /const avoidAllergens = firstSearchValue\(searchParams\.avoidAllergens\)/);
    assert.match(verified, /options\.accountAvoidAllergensDefault \?\? false/);
    assert.match(verified, /const labels = \[\.\.\.new Set\(\[\.\.\.labelFilters, \.\.\.dietaryLabels\]\)\]/);
    assert.match(verified, /dietaryFilters: commonDietaryFilterOptions\.map/);
    assert.match(verified, /allergenAvoidance/);
    assert.match(verified, /dietary=\$\{dietaryFilterLabel/);

    assert.match(products, /dietary\?: string \| string\[\]/);
    assert.match(products, /avoidAllergens\?: string \| string\[\]/);
    assert.match(products, /setAllParams\(params, 'dietary', source\.dietary\)/);
    assert.match(products, /setFirstParam\(params, 'avoidAllergens', source\.avoidAllergens\)/);
    assert.match(products, /Exclude allergen-risk items/);
    assert.match(products, /allergenRiskBadgesForText/);
    assert.match(products, /dietaryFilters=\{search\.dietaryFilters\}/);
    assert.match(searchFilters, /avoidAllergens/);
    assert.match(searchFilters, /Allergen filter: exclude risky items/);
    assert.match(filterPanel, /Diet and certification/);
    assert.match(filterPanel, /dietaryFilters\.map/);
    assert.match(filterPanel, /name="dietary"/);
    assert.match(filterPanel, /value=\{filter\.value\}/);
    assert.match(filterPanel, /defaultChecked=\{filter\.checked\}/);
    assert.match(filterPanel, /optionLabel\(filter\)/);
  });

  it('surfaces account-bound save-to-watchlist hearts on product cards', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const products = await read('src/app/products/page.tsx');

    assert.match(verified, /buildWatchlistAlerts/);
    assert.match(verified, /export const watchlistHeartProducts/);
    assert.match(verified, /sourceProductSlug/);
    assert.match(verified, /accountBound/);
    assert.match(verified, /targetPrice/);
    assert.match(verified, /No anonymous saves/);
    assert.match(products, /watchlistHeartProducts/);
    assert.match(products, /Save to watchlist/);
    assert.match(products, /♡/);
    assert.match(products, /Signed-in shoppers only/);
    assert.match(products, /account-bound/i);
    assert.match(products, /target price/i);
    assert.match(products, /buildWatchlistAlerts/);
    assert.match(products, /\/products\/\$\{product\.sourceProductSlug\}/);
    assert.doesNotMatch(products, /@\/lib\/demo-data/);
    assert.doesNotMatch(products, /@\/components\/sample-data/);
  });

  it('surfaces adaptive total and unit price product cards with a compare-mode toggle', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const products = await read('src/app/products/page.tsx');
    const shell = await read('src/components/market-shell.tsx');
    const cards = await read('src/components/product-price-cards.tsx');
    const compareModeRoute = await read('src/app/api/account/price-compare-mode/route.ts');

    assert.match(verified, /export const adaptiveProductCards/);
    assert.match(verified, /export const productBrandFilterOptions/);
    assert.match(verified, /productCount: adaptiveProductCards\.filter/);
    assert.match(verified, /normalizeComparableUnitPrice/);
    assert.match(verified, /cheapestUnitBadge/);
    assert.match(verified, /imageUrl/);
    assert.match(verified, /imageAlt/);
    assert.match(verified, /sparklinePoints/);
    assert.match(verified, /sparklineWindowDays: 7/);
    assert.match(verified, /priceDropFromThirtyDayHistory/);
    assert.match(verified, /currentPrice - price30dAgo/);
    assert.match(verified, /priceDropBadge/);
    assert.match(verified, /isAvailable/);
    assert.match(products, /ProductPriceCards/);
    assert.match(products, /adaptiveProductCards/);
    assert.match(products, /searchParams/);
    assert.match(products, /resolvedSearchParams\.brand/);
    assert.match(products, /productBrandFilterOptions/);
    assert.match(products, /name="brand"/);
    assert.match(products, /defaultValue=\{selectedBrand\}/);
    assert.match(products, /productsPageUrl\(currentPage \+ 1, selectedBrand, resolvedSearchParams\)/);
    assert.match(shell, /ProductPriceCards/);
    assert.match(shell, /homepageAdaptiveProductCards/);
    assert.match(cards, /next\/image/);
    assert.match(cards, /<Image/);
    assert.match(cards, /PriceHistorySparkline/);
    assert.match(cards, /card\.priceDropBadge/);
    assert.match(cards, /30-day price drop from price_history/);
    assert.match(cards, /bg-emerald-100/);
    assert.match(cards, /<svg/);
    assert.match(cards, /data-chart-motion="static"/);
    assert.match(cards, /motion-reduce:transition-none/);
    assert.match(cards, /motion-safe:transition/);
    assert.match(cards, /motion-safe:hover:-translate-y-0\.5/);
    assert.match(cards, /7-day price history/);
    assert.match(cards, /Compare by:/);
    assert.match(cards, /localStorage/);
    assert.match(cards, /window\.sessionStorage\.getItem\('groceryview:accessToken'\)/);
    assert.match(cards, /\/api\/account\/price-compare-mode/);
    assert.match(cards, /groceryview:product-card-compare-mode-changed/);
    assert.match(cards, /unitSortPrice/);
    assert.match(cards, /totalSortPrice/);
    assert.match(cards, /card\.cheapestUnitBadge/);
    assert.match(cards, /Out of stock/);
    assert.match(cards, /No synthetic product images/);
    assert.match(cards, /No synthetic unit prices/);
    assert.match(compareModeRoute, /export async function PATCH/);
    assert.match(compareModeRoute, /export function GET/);
    assert.match(compareModeRoute, /accountCompareModePreferences/);
    assert.match(compareModeRoute, /Signed-in bearer token required/);
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

  it('surfaces the commodity ingestion classifier contract on the data sources route', async () => {
    const ingestion = await read('../../packages/ingestion/src/index.ts');
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/data-sources/page.tsx');

    assert.match(ingestion, /soldByWeight/);
    assert.match(ingestion, /productKind: 'commodity'/);
    assert.match(ingestion, /commodityId: commodity\.slug/);
    assert.match(ingestion, /originCountry/);
    assert.match(ingestion, /Math\.min\(sourceConfidence, 0\.68\)/);
    assert.match(verified, /export const commodityIngestionClassifierEvidence/);
    assert.match(verified, /product_kind='commodity'/);
    assert.match(verified, /sourceConfidence <= 0\.68/);
    assert.match(route, /commodityIngestionClassifierEvidence/);
    assert.match(route, /Loose-item ingestion classifier/);
    assert.match(route, /product_kind='commodity'/);
    assert.match(route, /origin_country/);
  });

  it('surfaces commodity mapping curator review through human review assignments', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/data-sources/page.tsx');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(verified, /commodityMappingReviewPlan/);
    assert.match(verified, /planHumanReviewQueue/);
    assert.match(verified, /planHumanReviewAssignments/);
    assert.match(verified, /planCommunityReportAbuseControls/);
    assert.match(verified, /human_review_assignments/);
    assert.match(verified, /community_reporter_trust/);
    assert.match(route, /commodityMappingReviewPlan/);
    assert.match(route, /Commodity mapping curator review/);
    assert.match(route, /human_review_assignments/);
    assert.match(route, /community_reporter_trust/);
    assert.match(route, /reviewWritebacks/);
    assert.match(shell, /homepageCommodityMappingReview/);
    assert.match(shell, /Commodity mapping review/);
    assert.match(shell, /data-commodity-mapping-review/);
    assert.doesNotMatch(`${route}\n${shell}`, /Math\.random|Date\.now|NoVerifiedData/);
  });

  it('surfaces public price and nutrition API documentation on the data sources route', async () => {
    const server = await read('../../packages/server/src/index.ts');
    const route = await read('src/app/data-sources/page.tsx');
    const verified = await read('src/lib/verified-data.ts');

    assert.match(server, /\/api\/openapi\.json/);
    assert.match(server, /\/api\/products\/\{id\}\/terminal/);
    assert.match(server, /\/api\/nutrition\/value/);
    assert.match(verified, /export const publicApiDirectory/);
    assert.match(verified, /price-history/);
    assert.match(verified, /nutrition per krona/i);
    assert.match(verified, /volatilityContract/);
    assert.match(verified, /Cache-Control: public, s-maxage=300, stale-while-revalidate=900/);
    assert.match(verified, /ETag varies by product id, normalized inputWindow/);
    assert.match(verified, /inputWindow\.startDate/);
    assert.match(verified, /inputWindow\.endDate/);
    assert.match(verified, /inputWindow\.lookbackDays/);
    assert.match(verified, /inputWindow\.observationCount/);
    assert.match(route, /Public price\/nutrition API/);
    assert.match(route, /\/api\/openapi\.json/);
    assert.match(route, /\/api\/products\/\{id\}\/terminal/);
    assert.match(route, /\/api\/nutrition\/value/);
    assert.match(route, /Volatility endpoint cache contract/);
    assert.match(route, /publicApiDirectory\.volatilityContract\.cacheContract/);
    assert.match(route, /publicApiDirectory\.volatilityContract\.etagBehavior/);
    assert.match(route, /inputWindowFields\.map/);
  });

  it('surfaces the fail-closed API performance readiness contract', async () => {
    const server = await read('../../packages/server/src/index.ts');
    const route = await read('src/app/data-sources/page.tsx');
    const shell = await read('src/components/market-shell.tsx');
    const verified = await read('src/lib/verified-data.ts');

    assert.match(server, /apiResponseCache/);
    assert.match(server, /x-groceryview-cache/);
    assert.match(server, /nextCursor/);
    assert.match(verified, /export const apiPerformanceReadiness/);
    assert.match(verified, /Redis cache/);
    assert.match(verified, /cursor pagination/);
    assert.match(verified, /pgbouncer/);
    assert.match(verified, /price_daily/);
    assert.match(verified, /price_weekly/);
    assert.match(route, /apiPerformanceReadiness/);
    assert.match(route, /API performance readiness/);
    assert.match(route, /fail closed/i);
    assert.match(route, /hotEndpoints\.map/);
    assert.match(route, /rollupTables\.map/);
    assert.match(shell, /apiPerformanceReadiness/);
    assert.match(shell, /data-api-performance-readiness/);
    assert.match(shell, /Redis cache/);
    assert.match(shell, /cursor pagination/);
  });

  it('surfaces the TimescaleDB evaluation with declarative partition fallback evidence', async () => {
    const db = await read('../../packages/db/src/index.ts');
    const route = await read('src/app/data-sources/page.tsx');
    const shell = await read('src/components/market-shell.tsx');
    const verified = await read('src/lib/verified-data.ts');

    assert.match(db, /buildTimescaleDbEvaluationReport/);
    assert.match(db, /TIMESCALEDB_EVALUATION_FALLBACK_TABLES/);
    assert.match(verified, /export const timescaleDbEvaluation/);
    assert.match(verified, /TimescaleDB evaluation/);
    assert.match(verified, /fallback_ready/);
    assert.match(verified, /observations_v2/);
    assert.match(verified, /price_daily/);
    assert.match(verified, /price_weekly/);
    assert.match(route, /timescaleDbEvaluation/);
    assert.match(route, /TimescaleDB evaluation/);
    assert.match(route, /declarative monthly partitions/);
    assert.match(shell, /timescaleDbEvaluation/);
    assert.match(shell, /data-timescale-evaluation/);
    assert.match(shell, /TimescaleDB/);
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

  it('surfaces per-class freshness lag on the coverage route', async () => {
    const route = await read('src/app/coverage/page.tsx');
    const verified = await read('src/lib/verified-data.ts');
    const docs = await read('../../docs/qa/fresh-lag.md');
    const sitemap = await read('src/app/sitemap.ts');

    assert.match(verified, /perClassFreshnessLagReport/);
    assert.match(verified, /freshnessLagSummary/);
    assert.match(verified, /retailerTypeCoverage/);
    assert.match(verified, /majorSwedishGroceryRetailerTypeCoverage/);
    assert.match(verified, /freshWindowDays: freshnessLagWindowDays/);
    assert.match(route, /perClassFreshnessLagReport\.map/);
    assert.match(route, /retailerTypeCoverage\.map/);
    assert.match(route, /Retailer type coverage/);
    assert.match(route, /observations older than/);
    assert.match(route, /SourceCoverage/);
    assert.match(route, /routeMetadata\('\/coverage'\)/);
    assert.match(sitemap, /entry\('\/coverage'/);
    assert.match(docs, /Per-class freshness lag report/);
    assert.match(docs, /observations older than 7 days are stale/);
    assert.match(docs, /\/coverage/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('emits source-backed ItemList JSON-LD on category index pages', async () => {
    const source = await read('src/app/index/[symbol]/page.tsx');

    assert.match(source, /type="application\/ld\+json"/);
    assert.match(source, /'@type': 'ItemList'/);
    assert.match(source, /categoryItemListJsonLd\(definition, rows\)/);
    assert.match(source, /priceCurrency: 'SEK'/);
    assert.doesNotMatch(source, /location|PostalAddress/);
  });

  it('surfaces brand-tier indices on the chain index route using the real core brand-tier output', async () => {
    const source = await read('src/app/chain-index/page.tsx');
    const chainData = await read('src/lib/chain-index-data.ts');
    assert.match(source, /ConfidenceBadge/);
    assert.match(source, /calculateBrandTierIndices/);
    assert.match(source, /buildBrandTierPriceObservations/);
    assert.match(source, /brandTierObservations/);
    assert.match(source, /brandTierSummary/);
    assert.match(source, /brandTierConfidenceLevel/);
    assert.match(source, /privateLabelSavingsPercent/);
    assert.match(source, /premiumGapPercent/);
    assert.match(chainData, /axfoodProducts\.filter/);
    assert.match(chainData, /product\.inChains\.length > 1/);
    assert.doesNotMatch(chainData, /const BRAND_TIER_OBSERVATIONS/);
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

  it('surfaces the staple-basket fresh-food chain index on chain-index', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const source = await read('src/app/chain-index/page.tsx');

    assert.match(verified, /STAPLE_BASKET/);
    assert.match(verified, /freshFoodChainIndex/);
    assert.match(verified, /calculateChainPriceIndex/);
    assert.match(verified, /sourceConfidence >= 0\.6/);
    assert.match(source, /freshFoodChainIndex/);
    assert.match(source, /Fresh-food staple basket index/);
    assert.match(source, /is_staple/);
    assert.match(source, /kr\/kg|kr\/l|kr\/st/);
    assert.match(source, /confidence/i);
    assert.match(source, /No forecast/);
    assert.doesNotMatch(source, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('surfaces an embeddable Grocery Index ticker widget on chain-index', async () => {
    const route = await read('src/app/chain-index/page.tsx');
    const widgetRoute = await read('src/app/widgets/grocery-index-ticker/page.tsx');
    const widgetContract = await read('src/lib/grocery-index-widget.ts');
    const seo = await read('src/lib/seo.ts');

    assert.match(route, /groceryIndexTickerWidget/);
    assert.doesNotMatch(route, /export const groceryIndexTickerWidget/);
    assert.match(widgetContract, /export const groceryIndexTickerWidget/);
    assert.match(widgetContract, /Embeddable Grocery Index ticker/);
    assert.match(widgetContract, /widgets\/grocery-index-ticker/);
    assert.match(widgetContract, /iframe/);
    assert.match(widgetRoute, /calculateChainPriceIndex/);
    assert.match(widgetRoute, /buildChainPriceObservations/);
    assert.match(widgetRoute, /Grocery Index ticker/);
    assert.match(widgetRoute, /100-centred/);
    assert.match(widgetRoute, /sourceConfidence/);
    assert.match(seo, /widgets\/grocery-index-ticker/);
  });

  it('surfaces verified catalogue savings on its own route', async () => {
    const route = await read('src/app/catalogue-savings/page.tsx');
    const contentStyle = await read('src/lib/content-style.ts');

    assert.match(route, /chainSavingsLedger\.map/);
    assert.match(route, /matchedChainProducts/);
    assert.match(route, /chainPriceRows\(product\)/);
    assert.match(route, /SourceCoverage/);
    assert.match(route, /Matched catalogue savings ledger/);
    assert.match(route, /Claim boundary/);
    assert.match(route, /listedSavingsBoundaryCopy/);
    assert.match(contentStyle, /store-specific availability/);
    assert.match(route, /@\/lib\/verified-data/);
    assert.doesNotMatch(route, /@\/lib\/demo-data/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces the multi-vertical domain foundation without fabricating non-grocery prices', async () => {
    const catalogDomains = await read('../../packages/catalog/src/domains.ts');
    const catalogIndex = await read('../../packages/catalog/src/index.ts');
    const verified = await read('src/lib/verified-data.ts');
    const dataSources = await read('src/app/data-sources/page.tsx');
    const fuelRoute = await read('src/app/fuel/page.tsx');
    const pharmacyRoute = await read('src/app/pharmacy/page.tsx');
    const seo = await read('src/lib/seo.ts');
    const domainMigration = await read('../../infra/db/migrations/011_multi_vertical_domains.sql');
    const fuelSourceMigration = await read('../../infra/db/migrations/014_fuel_price_sources.sql');

    assert.match(catalogDomains, /PriceDomain/);
    assert.match(catalogDomains, /grocery/);
    assert.match(catalogDomains, /fuel/);
    assert.match(catalogDomains, /pharmacy/);
    assert.match(catalogDomains, /fuel-95-e10/);
    assert.match(catalogDomains, /otc-pharmacy/);
    assert.match(catalogIndex, /SUPPORTED_PRICE_DOMAINS/);

    assert.match(domainMigration, /alter table chains add column if not exists domain/);
    assert.match(domainMigration, /alter table products add column if not exists domain/);
    assert.match(domainMigration, /alter table observations add column if not exists domain/);
    assert.match(domainMigration, /default 'grocery'/);
    assert.match(domainMigration, /price_domain_check/);
    assert.match(fuelSourceMigration, /fuel_grades/);
    assert.match(fuelSourceMigration, /operator_public_price_page/);
    assert.match(fuelSourceMigration, /crowd_station_report/);
    assert.match(fuelSourceMigration, /fuel_price_source_observations/);

    assert.match(verified, /multiVerticalDomainFoundation/);
    assert.match(verified, /SUPPORTED_PRICE_DOMAINS/);
    assert.match(verified, /verifiedFuelPriceObservations/);
    assert.match(verified, /operator-sourced fuel rows/);
    assert.match(dataSources, /multiVerticalDomainFoundation\.map/);
    assert.match(dataSources, /Multi-vertical domain foundation/);

    assert.match(fuelRoute, /verifiedFuelPriceObservations/);
    assert.match(fuelRoute, /Fuel prices by grade/);
    assert.match(fuelRoute, /row\.sourceType/);
    assert.match(pharmacyRoute, /domainSlug="pharmacy"/);
    assert.match(pharmacyRoute, /No domain=pharmacy connector observations yet/);
    assert.match(pharmacyRoute, /OTC/);
    assert.match(seo, /\/fuel/);
    assert.match(seo, /\/pharmacy/);
    assert.doesNotMatch(fuelRoute, /@\/lib\/demo-data/);
    assert.doesNotMatch(pharmacyRoute, /@\/components\/sample-data/);
  });

  it('surfaces OTC pharmacy price evidence from public observations without medical or prescription claims', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const pharmacyRoute = await read('src/app/pharmacy/page.tsx');
    const marketShell = await read('src/components/market-shell.tsx');

    assert.match(verified, /export const pharmacyOtcEvidenceBoard/);
    assert.match(verified, /pharmacyCategoryNeedles/);
    assert.match(verified, /OpenPrices \+ OpenBeautyFacts/);
    assert.match(verified, /not a pharmacy-chain comparison/i);
    assert.match(pharmacyRoute, /pharmacyOtcEvidenceBoard/);
    assert.match(pharmacyRoute, /OTC price evidence from public observations/);
    assert.match(pharmacyRoute, /pharmacyOtcEvidenceBoard\.rows\.map/);
    assert.match(pharmacyRoute, /No prescription medicine/);
    assert.match(pharmacyRoute, /not a pharmacy-chain comparison/i);
    assert.match(marketShell, /pharmacyOtcEvidenceBoard/);
    assert.match(marketShell, /data-pharmacy-otc-evidence/);
    assert.match(marketShell, /href="\/pharmacy"/);
    assert.doesNotMatch(pharmacyRoute, /@\/lib\/demo-data|@\/components\/sample-data/);
  });


  it('ships next-intl language preference switching with persisted locale and Accept-Language detection', async () => {
    const packageJson = await read('package.json');
    const i18n = await read('src/lib/i18n.ts');
    const middleware = await read('src/middleware.ts');
    const switcher = await read('src/components/language-preference-switcher.tsx');
    const appNav = await read('src/components/app-nav.tsx');
    const marketShell = await read('src/components/market-shell.tsx');
    const svMessages = await read('messages/sv.json');
    const enMessages = await read('messages/en.json');

    assert.match(packageJson, /"next-intl"/);
    assert.match(i18n, /createTranslator/);
    assert.match(i18n, /supportedLocales/);
    assert.match(i18n, /defaultLocale = 'sv'/);
    assert.match(i18n, /resolveLocaleFromAcceptLanguage/);
    assert.match(i18n, /localizedShellCopy/);
    assert.match(middleware, /accept-language/i);
    assert.match(middleware, /NEXT_LOCALE/);
    assert.match(middleware, /x-groceryview-locale/);
    assert.match(switcher, /localStorage/);
    assert.match(switcher, /document\.cookie/);
    assert.match(switcher, /NEXT_LOCALE/);
    assert.match(switcher, /aria-label="Language preference"/);
    assert.match(appNav, /LanguagePreferenceSwitcher/);
    assert.match(marketShell, /localizedShellCopy/);
    assert.match(svMessages, /"overview": "Översikt"/);
    assert.match(enMessages, /"overview": "Overview"/);
    assert.doesNotMatch(svMessages, /machine translated/i);
    assert.match(i18n, /Arabic and Somali remain blocked until native-quality translations are reviewed/);
  });

  it('ships locale-routed public entry points with blocked immigrant-language routes', async () => {
    const routing = await read('src/lib/i18n-routing.ts');
    const middleware = await read('src/middleware.ts');
    const switcher = await read('src/components/language-preference-switcher.tsx');
    const localeHome = await read('src/components/locale-home-page.tsx');
    const svRoute = await read('src/app/sv/page.tsx');
    const enRoute = await read('src/app/en/page.tsx');
    const arRoute = await read('src/app/ar/page.tsx');
    const soRoute = await read('src/app/so/page.tsx');

    assert.match(routing, /routedLocales = \['sv', 'en'\]/);
    assert.match(routing, /blockedLocaleRoutes = \['ar', 'so'\]/);
    assert.match(routing, /localeRoutePrefix/);
    assert.match(middleware, /x-groceryview-locale-route/);
    assert.match(middleware, /localeFromPathname/);
    assert.match(middleware, /blockedLocaleRoutes/);
    assert.match(switcher, /href=\{`\/\$\{language\.locale\}`\}/);
    assert.match(localeHome, /MarketShell/);
    assert.match(localeHome, /alternates/);
    assert.match(localeHome, /languages/);
    assert.match(localeHome, /\/sv/);
    assert.match(localeHome, /\/en/);
    assert.match(localeHome, /Native-quality translation review required/);
    assert.match(localeHome, /No machine-translated prices/);
    assert.match(svRoute, /locale=\"sv\"/);
    assert.match(enRoute, /locale=\"en\"/);
    assert.match(arRoute, /BlockedLocalePage/);
    assert.match(soRoute, /BlockedLocalePage/);
  });

  it('ships locale-aware money date and unit formatters for observation currencies', async () => {
    const i18n = await read('src/lib/i18n.ts');
    const unitPriceFormatting = await read('src/lib/unit-price-formatting.js');
    const verified = await read('src/lib/verified-data.ts');
    const marketShell = await read('src/components/market-shell.tsx');
    const compareRoute = await read('src/app/compare/page.tsx');
    const productDetailRoute = await read('src/app/products/[slug]/page.tsx');
    const screenerRoute = await read('src/app/screener/page.tsx');

    assert.match(i18n, /supportedCurrencies = \['SEK', 'NOK', 'DKK', 'EUR', 'ISK'\]/);
    assert.match(i18n, /export type SupportedCurrency/);
    assert.match(i18n, /normalizeCurrency/);
    assert.match(i18n, /currencyFromObservation/);
    assert.match(i18n, /formatLocalizedMoney/);
    assert.match(i18n, /formatLocalizedDate/);
    assert.match(i18n, /formatLocalizedUnitPrice/);
    assert.match(i18n, /formatLocalizedPer100gUnitPrice/);
    assert.match(i18n, /unknownUnitPriceLabel/);
    assert.match(unitPriceFormatting, /Jämförpris saknas/);
    assert.match(unitPriceFormatting, /formatUnitPriceLabel/);
    assert.match(unitPriceFormatting, /formatSourceUnitPriceText/);
    assert.match(unitPriceFormatting, /formatPer100gUnitPriceLabel/);
    assert.match(i18n, /Intl\.NumberFormat\(localeOption\.htmlLang/);
    assert.match(verified, /unknownUnitPriceLabel/);
    assert.match(verified, /formatSourceUnitPriceText/);
    assert.match(verified, /formatLocalizedMoney/);
    assert.match(verified, /formatLocalizedDate/);
    assert.match(verified, /formatLocalizedUnitPrice/);
    assert.doesNotMatch(verified, /Unit price not reported|No current price row|Jämförpris not reported/);
    assert.match(verified, /localeFormattingShowcase/);
    assert.match(verified, /currencyFromObservation\(\{ currency: 'SEK' \}\)/);
    assert.match(marketShell, /localeFormattingShowcase/);
    assert.match(marketShell, /Multi-currency display follows observation currency/);
    assert.match(marketShell, /SEK · NOK · DKK · EUR · ISK/);
    assert.match(marketShell, /No currency conversion or fake price/);
    assert.match(compareRoute, /formatComparableUnitPrice/);
    assert.match(productDetailRoute, /formatComparableUnitPrice/);
    assert.match(screenerRoute, /formatLocalizedUnitPrice/);
  });

  it('adds structured rejection reasons to the admin search alias review queue', async () => {
    const page = await read('src/app/admin/search-aliases/page.tsx');
    const review = await read('src/lib/search-alias-review.ts');

    assert.match(page, /Search alias review/);
    assert.match(page, /name="rejectionReason"/);
    assert.match(page, /buildSearchAliasRejection\('pending-no-result-alias', 'insufficient_confidence'\)/);
    assert.match(review, /bad_query/);
    assert.match(review, /wrong_product/);
    assert.match(review, /duplicate_alias/);
    assert.match(review, /insufficient_confidence/);
    assert.match(review, /status: 'rejected'/);
    assert.match(review, /rejectionReason: reason/);
  });

  it('configures Playwright browsers, reporters, failure artifacts, and base fixtures', async () => {
    const config = await read('playwright.config.ts');
    const fixtures = await read('e2e/fixtures/base.ts');

    assert.match(config, /name: 'chromium'/);
    assert.match(config, /name: 'firefox'/);
    assert.match(config, /name: 'webkit'/);
    assert.match(config, /\['junit', \{ outputFile: '\.\/e2e\/test-results\/junit\.xml' \}\]/);
    assert.match(config, /\['html', \{ outputFolder: '\.\/e2e\/playwright-report', open: 'never' \}\]/);
    assert.match(config, /screenshot: 'only-on-failure'/);
    assert.match(config, /trace: 'retain-on-failure'/);
    assert.match(fixtures, /test = base\.extend/);
    assert.match(fixtures, /consoleErrorCapture/);
    assert.match(fixtures, /gotoApp/);
    assert.match(fixtures, /setViewportSize/);
  });

  it('ships the group-buy coordinator E2E flow with create, invite, unlock, and error coverage', async () => {
    const page = await read('src/app/[country]/group-buys/page.tsx');
    const coordinator = await read('src/app/[country]/group-buys/group-buy-coordinator.tsx');
    const spec = await read('e2e/group-buy-coordinator.spec.ts');

    assert.match(page, /GroupBuyCoordinator/);
    assert.match(coordinator, /Create group buy/);
    assert.match(coordinator, /Anna household/);
    assert.match(coordinator, /Khan household/);
    assert.match(coordinator, /bulk tier unlocked/);
    assert.match(coordinator, /Create a group buy before inviting households/);
    assert.match(spec, /creates a group buy, invites two households, and unlocks the bulk-tier price/);
    assert.match(spec, /invite before creating/i);
    assert.match(spec, /group-buy-coordinator-final\.png/);
  });

  it('ships a country consumer complaint helper with authority templates from observed prices', async () => {
    const helper = await read('src/app/[country]/complaint-helper/page.tsx');

    assert.match(helper, /Konsumentverket/);
    assert.match(helper, /Forbrukerrådet/);
    assert.match(helper, /Neytendastofa/);
    assert.match(helper, /topChainSpreads/);
    assert.match(helper, /Här är beläggen för att butiken tog/);
    assert.match(helper, /Receipt required/);
    assert.match(helper, /no synthetic charge amounts/i);
    assert.match(helper, /not legal advice/i);
    assert.match(helper, /complaintTemplate/);
  });
});
