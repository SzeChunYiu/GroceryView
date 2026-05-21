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
  'src/app/chain-index/page.tsx',
  'src/app/map/page.tsx',
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
    const featureRoutes = ['weekly-basket','watchlist','scanner','household','account','basket-ideas','coupon-stacks','deals','meal-planner','nutrition-value','pantry-planner','price-reports','savings-dashboard','shopping-trips','privacy'];
    const verified = await read('src/lib/verified-data.ts');
    assert.match(verified, /privateFeatureCopy/);
    assert.match(verified, /verifiedSurface/);
    assert.match(verified, /Gate before launch|gatedBy/);
    for (const route of featureRoutes) {
      const source = await read(`src/app/${route}/page.tsx`);
      assert.match(source, /NoVerifiedData/);
      assert.match(source, /route=\{route\}/);
      assert.match(source, /static snapshot/);
    }
    const profile = await read('src/app/account/profile/page.tsx');
    assert.match(profile, /route="account-profile"/);
    assert.match(verified, /'account-profile'/);
    const login = await read('src/app/login/page.tsx');
    assert.doesNotMatch(login, /placeholder=/);
    assert.match(login, /No test account/);
    assert.match(login, /Session source/);
    assert.match(login, /production auth provider returns a verified session/);
    assert.match(login, /source timestamps from authenticated storage/);
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
    assert.match(shell, /Category freshness strip/);
    assert.match(shell, /category\.latestObservation/);
    assert.match(shell, /Feature readiness queue/);
    assert.match(shell, /featureReadinessQueue\.map/);
    assert.match(shell, /privateFeatureCopy/);
    assert.match(page, /GroceryView verified grocery snapshot/);
    assert.match(page, /product browsing/);
    assert.match(page, /category freshness/);
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
    assert.match(shell, /Top product:/);
    assert.match(shell, /\/categories\/\$\{category\.slug\}/);
  });
});
