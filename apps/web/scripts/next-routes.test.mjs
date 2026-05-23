import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

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

async function fileExists(relative) {
  try {
    await access(new URL(`../${relative}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
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
    const verified = await read('src/lib/verified-data.ts');

    assert.match(productCards, /card\.isAvailable === false/);
    assert.match(productCards, /Out of stock/);
    assert.match(productsPage, /product\.isAvailable === false/);
    assert.match(productsPage, /Out of stock/);
    assert.match(verified, /isAvailable/);
    assert.match(verified, /outOfStockLatestPriceCount/);
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



  it('ships signed-in scanner upload and barcode processing controls without anonymous uploads', async () => {
    const scanner = await read('src/app/scanner/page.tsx');
    const actions = await read('src/components/scanner-upload-actions.tsx');
    const scanning = await read('../../packages/scanning/src/index.ts');

    assert.match(scanner, /ScannerUploadActions/);
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
    assert.match(scanning, /No scan upload storage provider configured/);
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
    assert.match(account, /planAccountDeletion/);
    assert.match(account, /accountDeletionPlan/);
    assert.match(account, /Deletion plan requires owner confirmation/);
    assert.match(account, /Destructive action gated/);
    assert.match(account, /Type DELETE ACCOUNT/);
    assert.match(account, /reauthenticates/);
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
    assert.match(actions, /Sign in first/);
    assert.match(actions, /No anonymous price-report moderation/);
    assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
    assert.doesNotMatch(actions, /demo-data|sample-data|mock session/i);
    assert.match(server, /\/api\/human-review\/assignments/);
    assert.match(server, /Session user is not a registered human reviewer/);
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

    assert.match(demo, /export const multiWeekStockUpList = /);
    assert.match(demo, /observedHistoryWindow/);
    assert.match(demo, /noForecastReason/);
    assert.match(demo, /reviewTrigger/);
    assert.match(source, /multiWeekStockUpList/);
    assert.match(source, /Multi-week stock-up list/);
    assert.match(source, /planningWeeks/);
    assert.match(source, /No price forecast/);
    assert.match(source, /observedHistoryWindow/);
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
    const compare = await read('src/app/compare/page.tsx');
    const product = await read('src/app/products/[slug]/page.tsx');

    assert.match(verified, /compareCommodityUnitPrices/);
    assert.match(verified, /commodityComparisons/);
    assert.match(verified, /commodityComparisonForProduct/);
    assert.match(verified, /commodity\/alias match/);
    assert.match(compare, /commodityComparisons/);
    assert.match(compare, /Cross-chain commodity comparison/);
    assert.match(compare, /kr\/\{comparison\.comparableUnit\}/);
    assert.match(product, /commodityComparisonForProduct/);
    assert.match(product, /Cheapest chain for this commodity/);
    assert.match(product, /sourceConfidence/);
    assert.doesNotMatch(compare, /NoVerifiedData/);
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

  it('surfaces deal-hunter specialty and premium tier tracking from the real brand-tier index', async () => {
    const route = await read('src/app/deals/page.tsx');

    assert.match(route, /calculateBrandTierIndices/);
    assert.match(route, /buildBrandTierPriceObservations/);
    assert.match(route, /premiumTierTracking/);
    assert.match(route, /Specialty & premium tier tracking/);
    assert.match(route, /premiumGapPercent/);
    assert.match(route, /premium tier/i);
    assert.match(route, /specialty basket/i);
    assert.match(route, /not a forecast/i);
    assert.match(route, /observed brand-tier basket/i);
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
    assert.match(source, /dealBasedMeals/);
    assert.match(source, /suggestDealBasedMeals/);
    assert.match(source, /ConfidenceBadge/);
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

  it('surfaces expiry deal radar on the deals route using the real core radar output', async () => {
    const source = await read('src/app/deals/page.tsx');
    assert.match(source, /expiryDealRadar/);
    assert.match(source, /buildExpiryDealRadar/);
    assert.match(source, /radarScore/);
    assert.match(source, /staleReportIds/);
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

  it('surfaces a deal screener landing card on the deals route with dedicated /screener navigation', async () => {
    const route = await read('src/app/deals/page.tsx');
    assert.match(route, /Deal screener/);
    assert.match(route, /Dedicated verified screener/i);
    assert.match(route, /Open verified deal screener/);
    assert.match(route, /screenerDefaultHref\(\)/);
    assert.doesNotMatch(route, /dealScreener/);
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
    assert.match(route, /href={modeHref\(option\.mode, category\)}/);
    assert.match(route, /href={categoryHref\(SCREENER_DEFAULT_CATEGORY, mode\)}/);
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

  it('surfaces offer expiry reminders from real Matpriskollen validity windows', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/deals/page.tsx');

    assert.match(verified, /matpriskollenOffers/);
    assert.match(verified, /offerExpiryReminderBoard/);
    assert.match(verified, /validFrom/);
    assert.match(verified, /validTo/);
    assert.match(route, /Offer expiry reminders/);
    assert.match(route, /validTo/);
    assert.match(route, /No deal starts tomorrow claim/);
    assert.match(route, /sourceUrl/);
    assert.doesNotMatch(route, /@\/components\/sample-data/);
  });

  it('surfaces ICA e-magin digital-catalog offers from generated weekly offer rows', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const deals = await read('src/app/deals/page.tsx');

    assert.match(verified, /icaReklambladOffers/);
    assert.match(verified, /digitalCatalogueOfferBoard/);
    assert.match(verified, /flyerPdfUrl/);
    assert.match(verified, /sourceUrl/);
    assert.match(shell, /Flyer \/ digital-catalog ingestion/);
    assert.match(shell, /Open e-magin flyer/);
    assert.match(shell, /offer price text, jämförpris, ordinary price/i);
    assert.match(deals, /ICA e-magin catalogue offers/);
    assert.match(deals, /real weekly offer rows/);
    assert.match(deals, /flyerPdfUrl retained/);
    assert.doesNotMatch(shell, /@\/lib\/demo-data|@\/components\/sample-data/);
  });

  it('wires the latest ICA store-scoped promotion import to visible source surfaces', async () => {
    const generated = await read('src/lib/ingested/ica.ts');
    const summary = await read('src/lib/ingested/ica-source-summary.ts');
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');
    const dataSources = await read('src/app/data-sources/page.tsx');

    assert.match(generated, /ICA Kvantum Tomelilla/);
    assert.match(generated, /"storeAccountId":"1004070"/);
    assert.match(generated, /ICA Supermarket Tierp/);
    assert.match(generated, /"storeAccountId":"1003693"/);
    assert.match(generated, /ICA Supermarket Toria/);
    assert.match(generated, /"storeAccountId":"1003822"/);
    assert.match(generated, /retrieved 2026-05-23T20:42:39\.000Z/);
    assert.match(summary, /AUTO-GENERATED summary from public ICA store-scoped promotions JSON/);
    assert.match(summary, /generatedFrom: 'apps\/web\/src\/lib\/ingested\/ica\.ts'/);
    assert.match(summary, /totalRowCount: 93109/);
    assert.match(summary, /storeEndpointCount: 324/);
    assert.match(summary, /ICA Kvantum Tomelilla/);
    assert.match(summary, /storeAccountId: '1004070'/);
    assert.match(summary, /ICA Supermarket Tierp/);
    assert.match(summary, /storeAccountId: '1003693'/);
    assert.match(summary, /ICA Supermarket Toria/);
    assert.match(summary, /storeAccountId: '1003822'/);
    assert.match(summary, /retrievedAt: '2026-05-23T20:42:39\.000Z'/);
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



  it('surfaces a retailer flyer validity calendar without unsupported tomorrow claims', async () => {
    const verified = await read('src/lib/verified-data.ts');
    const route = await read('src/app/deals/page.tsx');

    assert.match(verified, /flyerValidityCalendar/);
    assert.match(verified, /validityDays/);
    assert.match(verified, /startsTomorrow/);
    assert.match(verified, /matpriskollenOffers/);
    assert.match(route, /Flyer validity calendar/);
    assert.match(route, /Starts tomorrow/);
    assert.match(route, /unsupportedTomorrowClaim/);
    assert.match(route, /validFrom/);
    assert.match(route, /validTo/);
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
    const workflow = await read('../../.github/workflows/ci.yml');
    const previewWorkflow = await read('../../.github/workflows/lighthouse.yml');
    const verified = await read('src/lib/verified-data.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(pkg, /"perf:lighthouse:ci"/);
    assert.match(pkg, /"perf:lighthouse:preview"/);
    assert.match(pkg, /@lhci\/cli/);
    assert.match(lhci, /http:\/\/127\.0\.0\.1:3000\//);
    assert.match(lhci, /numberOfRuns:\s*3/);
    assert.match(lhci, /categories:performance/);
    assert.match(lhci, /largest-contentful-paint/);
    assert.match(lhci, /cumulative-layout-shift/);
    assert.match(lhci, /'cumulative-layout-shift': \['error', \{ maxNumericValue: 0\.15 \}\]/);
    assert.match(lhci, /total-byte-weight/);
    assert.match(lhci, /filesystem/);
    assert.match(workflow, /Lighthouse performance budget/);
    assert.match(workflow, /npm run perf:lighthouse:ci -w @groceryview\/web/);
    assert.match(previewLhci, /LHCI_PREVIEW_URL/);
    assert.match(previewLhci, /categories:performance': \['error', \{ minScore: 0\.85 \}\]/);
    assert.match(previewLhci, /largest-contentful-paint': \['error', \{ maxNumericValue: 2500 \}\]/);
    assert.match(previewWorkflow, /pull_request:/);
    assert.match(previewWorkflow, /environment: 'Preview'/);
    assert.match(previewWorkflow, /core\.exportVariable\('LHCI_PREVIEW_URL'/);
    assert.match(previewWorkflow, /npm run perf:lighthouse:preview -w @groceryview\/web/);
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
    assert.match(nav, /Verified grocery intelligence/);
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
    assert.match(bottomNav, /Watchlist/);
    assert.match(bottomNav, /Me/);
    assert.match(dataUi, /import \{ BottomNav \} from '\.\/bottom-nav'/);
    assert.match(dataUi, /pb-20/);
    assert.match(dataUi, /lg:pb-6/);
    assert.match(dataUi, /<BottomNav \/>/);
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
    assert.match(route, /comparison\.products\.map/);
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
    const server = await read('../../packages/server/src/index.ts');

    assert.match(verified, /export const browserExtensionOverlayContract = /);
    assert.match(verified, /\/extension\/retailer-overlay\.js/);
    assert.match(verified, /\/api\/products\/\{productId\}\/cheapest-now/);
    assert.match(route, /browserExtensionOverlayContract/);
    assert.match(route, /Retailer browser overlay/);
    assert.match(route, /data-groceryview-product-id/);
    assert.match(overlay, /data-groceryview-product-id/);
    assert.match(overlay, /\/api\/products\/\$\{encodeURIComponent\(productId\)\}\/cheapest-now/);
    assert.match(overlay, /cheapest\.chain/);
    assert.match(overlay, /confidence/);
    assert.match(overlay, /No anonymous/);
    assert.doesNotMatch(overlay, /sessionStorage|localStorage\.setItem|demo-data|sample-data/i);
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
    assert.match(robots, /allow: '\/'/);
    assert.match(robots, /disallow: \[/);
    assert.match(robots, /\/account/);
    assert.match(robots, /\/login/);
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
      'src/app/cookies/page.tsx',
      'src/app/data-sources/page.tsx',
      'src/app/deals/page.tsx',
      'src/app/fuel/page.tsx',
      'src/app/household/page.tsx',
      'src/app/login/page.tsx',
      'src/app/map/page.tsx',
      'src/app/meal-planner/page.tsx',
      'src/app/nutrition-value/page.tsx',
      'src/app/openprices-depth/page.tsx',
      'src/app/pantry-planner/page.tsx',
      'src/app/pharmacy/page.tsx',
      'src/app/price-reports/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/prisjamforelse/[slug]/page.tsx',
      'src/app/products/page.tsx',
      'src/app/products/[slug]/page.tsx',
      'src/app/savings-dashboard/page.tsx',
      'src/app/scanner/page.tsx',
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

    assert.match(verified, /export const adaptiveProductCards/);
    assert.match(verified, /export const productBrandFilterOptions/);
    assert.match(verified, /productCount: adaptiveProductCards\.filter/);
    assert.match(verified, /normalizeComparableUnitPrice/);
    assert.match(verified, /cheapestUnitBadge/);
    assert.match(verified, /imageUrl/);
    assert.match(verified, /imageAlt/);
    assert.match(verified, /sparklinePoints/);
    assert.match(verified, /sparklineWindowDays: 7/);
    assert.match(verified, /isAvailable/);
    assert.match(products, /ProductPriceCards/);
    assert.match(products, /adaptiveProductCards/);
    assert.match(products, /searchParams/);
    assert.match(products, /resolvedSearchParams\.brand/);
    assert.match(products, /productBrandFilterOptions/);
    assert.match(products, /name="brand"/);
    assert.match(products, /defaultValue=\{selectedBrand\}/);
    assert.match(products, /productsPageUrl\(currentPage \+ 1, selectedBrand\)/);
    assert.match(shell, /ProductPriceCards/);
    assert.match(shell, /homepageAdaptiveProductCards/);
    assert.match(cards, /next\/image/);
    assert.match(cards, /<Image/);
    assert.match(cards, /PriceHistorySparkline/);
    assert.match(cards, /<svg/);
    assert.match(cards, /7-day price history/);
    assert.match(cards, /Compare by:/);
    assert.match(cards, /localStorage/);
    assert.match(cards, /unitSortPrice/);
    assert.match(cards, /totalSortPrice/);
    assert.match(cards, /cheapest-per-unit/);
    assert.match(cards, /Out of stock/);
    assert.match(cards, /No synthetic product images/);
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
    assert.match(route, /Public price\/nutrition API/);
    assert.match(route, /\/api\/openapi\.json/);
    assert.match(route, /\/api\/products\/\{id\}\/terminal/);
    assert.match(route, /\/api\/nutrition\/value/);
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
    const verified = await read('src/lib/verified-data.ts');
    const marketShell = await read('src/components/market-shell.tsx');

    assert.match(i18n, /supportedCurrencies = \['SEK', 'NOK', 'DKK', 'EUR', 'ISK'\]/);
    assert.match(i18n, /export type SupportedCurrency/);
    assert.match(i18n, /normalizeCurrency/);
    assert.match(i18n, /currencyFromObservation/);
    assert.match(i18n, /formatLocalizedMoney/);
    assert.match(i18n, /formatLocalizedDate/);
    assert.match(i18n, /formatLocalizedUnitPrice/);
    assert.match(i18n, /Intl\.NumberFormat\(localeOption\.htmlLang/);
    assert.match(verified, /formatLocalizedMoney/);
    assert.match(verified, /formatLocalizedDate/);
    assert.match(verified, /formatLocalizedUnitPrice/);
    assert.match(verified, /localeFormattingShowcase/);
    assert.match(verified, /currencyFromObservation\(\{ currency: 'SEK' \}\)/);
    assert.match(marketShell, /localeFormattingShowcase/);
    assert.match(marketShell, /Multi-currency display follows observation currency/);
    assert.match(marketShell, /SEK · NOK · DKK · EUR · ISK/);
    assert.match(marketShell, /No currency conversion or fake price/);
  });
});
