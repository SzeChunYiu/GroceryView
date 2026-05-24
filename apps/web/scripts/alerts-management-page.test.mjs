import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('price alert management page', () => {
  it('ships a visible /alerts page backed by the alert API and delete controls', async () => {
    const page = await read('src/app/alerts/page.tsx');
    const item = await read('src/components/AlertListItem.tsx');
    const webStore = await read('src/app/api/alerts/store.ts');
    const nav = await read('src/components/app-nav.tsx');
    const seo = await read('src/lib/seo.ts');
    const sitemap = await read('src/app/sitemap.ts');
    const apiRoutes = await read('../../apps/api/src/routes/alerts.ts');
    const apiController = await read('../../apps/api/src/alerts/alerts.controller.ts');

    assert.match(page, /export default function AlertsPage/);
    assert.match(page, /routeMetadata\('\/alerts'\)/);
    assert.match(page, /AlertManagementPanel/);
    assert.match(page, /currentPriceText/);
    assert.match(page, /No synthetic prices/);
    assert.match(item, /export function AlertListItem/);
    assert.match(item, /fetch\(`\/api\/alerts\?userEmail=/);
    assert.match(item, /method: 'DELETE'/);
    assert.match(item, /Target \{formatTargetPrice\(alert\.targetPrice\)\}/);
    assert.match(item, /product\.currentPrice <= alert\.targetPrice/);
    assert.match(item, /Delete alert/);
    assert.match(webStore, /listPriceAlerts/);
    assert.match(webStore, /deletePriceAlert/);
    assert.match(nav, /href: '\/alerts'/);
    assert.match(seo, /'\/alerts'/);
    assert.match(sitemap, /entry\('\/alerts'/);
    assert.match(apiRoutes, /webManagementPage: '\/alerts'/);
    assert.match(apiRoutes, /webPriceAlertsApi: '\/api\/alerts'/);
    assert.match(apiController, /alertsRoutes\.demoUserAlerts/);
  });
});
