import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('search-to-savings funnel analytics surface', () => {
  it('ships aggregate tracking, dashboard, and privacy-safe segmentation without sample metrics', async () => {
    const [route, store, dashboard, clientAnalytics, searchBar, nav, funnelCore, funnelTest] = await Promise.all([
      read('src/app/api/analytics/search-to-savings-funnel/route.ts'),
      read('src/lib/search-to-savings-funnel.ts'),
      read('src/app/analytics/funnel/page.tsx'),
      read('src/lib/analytics.ts'),
      read('src/components/SearchBar.tsx'),
      read('src/components/app-nav.tsx'),
      read('../../packages/analytics/src/funnel.ts'),
      read('../../packages/analytics/src/__tests__/funnel.test.ts')
    ]);

    assert.match(route, /export async function POST/);
    assert.match(route, /export async function GET/);
    assert.match(route, /Expected 1-50 aggregate funnel/);
    assert.match(store, /recordSearchToSavingsFunnelEvents/);
    assert.match(store, /market/);
    assert.match(store, /device/);
    assert.match(store, /accountState/);
    assert.doesNotMatch(store, /productId|userId|searchTerm|price/);

    assert.match(funnelCore, /landing_search/);
    assert.match(funnelCore, /product_view/);
    assert.match(funnelCore, /compare_view/);
    assert.match(funnelCore, /watchlist_alert/);
    assert.match(funnelCore, /basket_view/);
    assert.match(funnelCore, /savings_action/);
    assert.match(funnelCore, /largestDropOff/);
    assert.match(funnelTest, /builds aggregate search-to-savings funnel drop-offs by segment/);

    assert.match(dashboard, /Search-to-savings funnel dashboard/);
    assert.match(dashboard, /Step conversions and drop-offs/);
    assert.match(dashboard, /Market × device × account state/);
    assert.match(dashboard, /No aggregate funnel events recorded in this runtime yet; no sample metrics are rendered/);

    assert.match(clientAnalytics, /trackSearchToSavingsFunnelStep/);
    assert.match(clientAnalytics, /sendBeacon/);
    assert.match(searchBar, /trackSearchToSavingsFunnelStep\('landing_search'\)/);
    assert.match(nav, /\/analytics\/funnel/);
  });
});
