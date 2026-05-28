import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const adSlot = await readFile(new URL('../src/components/design-system/ad-slot.tsx', import.meta.url), 'utf8');
const adPolicy = await readFile(new URL('../src/lib/ad-policy.ts', import.meta.url), 'utf8');
const adSlots = await readFile(new URL('../src/lib/ad-slots.ts', import.meta.url), 'utf8');
const thirdPartyLoading = await readFile(new URL('../src/lib/third-party-loading.ts', import.meta.url), 'utf8');

test('AdSlot labels placements and reserves height', () => {
  assert.match(adSlot, /Advertisement/);
  assert.match(adSlot, /minHeight/);
  assert.match(adSlot, /aria-label/);
});

test('ad policy blocks sensitive and admin routes', () => {
  assert.match(adPolicy, /isAdFreeRoute/);
  for (const route of ['/admin', '/account', '/privacy', '/auth', '/pharmacy/prescription', '/pharmacy/rx']) {
    assert.match(adPolicy, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(adPolicy, /searchAdAllowedAfterIndex/);
  assert.match(adPolicy, /adPlacementSurfaceAllowed/);
  assert.match(adSlots, /search_after_results_12/);
});

test('search placement requires index >= 12', () => {
  assert.match(adPolicy, /searchAdAllowedAfterIndex/);
  assert.match(adPolicy, /resultIndex >= 12/);
});

test('public pages integrate policy-gated ad slots', async () => {
  const home = await readFile(new URL('../src/components/mvp/mvp-home-page.tsx', import.meta.url), 'utf8');
  const searchGrid = await readFile(new URL('../src/components/search/search-results-grid.tsx', import.meta.url), 'utf8');
  const dealsFeed = await readFile(new URL('../src/components/deals/deal-feed-with-previews.tsx', import.meta.url), 'utf8');
  assert.match(home, /PublicAdSlot/);
  assert.match(searchGrid, /search_after_results_12/);
  assert.match(dealsFeed, /deals_bottom/);
});

test('live AdSense fill is deferred until credentials and consent are ready', () => {
  assert.match(thirdPartyLoading, /id: 'live_adsense_fill'/);
  assert.match(thirdPartyLoading, /consentCategory: 'ads'/);
  assert.match(thirdPartyLoading, /loadTrigger: 'consent\+visibility'/);
  assert.match(thirdPartyLoading, /maxInitialJsBytes: 0/);
  assert.match(thirdPartyLoading, /No ad script is loaded today/);
});
