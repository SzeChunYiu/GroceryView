import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('admin dashboard exposes aggregate core product funnel tracking', async () => {
  const admin = await read('src/app/admin/page.tsx');
  const analytics = await read('src/lib/analytics.ts');
  const dataUi = await read('src/components/data-ui.tsx');

  assert.match(analytics, /CoreProductFunnelId/);
  assert.match(analytics, /search_to_product/);
  assert.match(analytics, /product_to_alert/);
  assert.match(analytics, /list_to_store/);
  assert.match(analytics, /deal_click/);
  assert.match(analytics, /trackCoreProductFunnelEvent/);
  assert.match(analytics, /coreProductFunnelEndpoint/);
  assert.match(analytics, /getCoreProductFunnelDashboardRows/);
  assert.match(analytics, /no product ids, user ids, search terms, or prices/i);

  assert.match(dataUi, /CoreFunnelDashboard/);
  assert.match(dataUi, /data-core-funnel/);
  assert.match(dataUi, /Workflow value dashboard/);
  assert.match(dataUi, /Search-to-savings funnel/);

  assert.match(admin, /Product strategy dashboard/);
  assert.match(admin, /search-to-product, product-to-alert, list-to-store, and deal-click funnels/);
  assert.match(admin, /CoreFunnelDashboard/);
  assert.match(admin, /noIndex: true/);
});
