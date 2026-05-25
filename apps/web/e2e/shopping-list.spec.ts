import { expect, test } from '@playwright/test';

const fiveItemList = ['oats', 'pasta', 'honey', 'salt', 'sugar'].join('\n');

test.describe('shopping list e2e', () => {
  test('builds a 5-item list, shows cheapest sources, shares via link, and screenshots final state', async ({ page }) => {
    await page.goto('/list');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByLabel('Plain-text list, one item per line').fill(fiveItemList);
    await expect(page.getByText('5 parsed line(s) · 5 catalog match(es) · 0 unmatched line(s).')).toBeVisible();
    await page.getByRole('button', { name: 'Import matched items' }).click();
    await expect(page.getByText('Imported 5 line(s), 5 matched to the product catalog.')).toBeVisible();

    const liveList = page.locator('main').first();
    await expect(liveList.getByText('Cheapest source: Willys')).toHaveCount(5);
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('groceryview:shopping-list:checked:v1');
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { importedItems?: unknown[] };
      return Array.isArray(parsed.importedItems) && parsed.importedItems.length >= 5;
    });
    await page.getByRole('button', { name: 'Create share link' }).click();
    await expect(page.getByText('Read-only share link ready.')).toBeVisible();
    const shareUrl = await page.getByLabel('Share link').inputValue();
    expect(shareUrl).toContain('/list?share=');

    await page.goto(shareUrl);
    await expect(page.getByText('Read-only shared list link verified.')).toBeVisible();
    await expect(page.locator('main').first().getByText('Cheapest source: Willys')).toHaveCount(5);
    await page.screenshot({ path: 'e2e/snapshots/shopping-list-final.png', fullPage: true });
  });

  test('shows an error for an invalid shared list link', async ({ page }) => {
    await page.goto('/list?share=invalid-token');
    await expect(page.getByText('Invalid read-only list link signature.')).toBeVisible();
  });
});

test('keeps the shopping list app shell and local snapshot available offline', async ({ context, page }) => {
  await page.goto('/list');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByLabel('Plain-text list, one item per line').fill(fiveItemList);
  await page.getByRole('button', { name: 'Import matched items' }).click();
  await expect(page.getByText('Imported 5 line(s), 5 matched to the product catalog.')).toBeVisible();

  await page.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready);
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('groceryview:shopping-list:offline-cache:v1');
    if (!raw) return false;
    const snapshot = JSON.parse(raw) as { totalCount?: number; items?: unknown[]; lastKnownPrices?: unknown[] };
    return snapshot.totalCount === 5 && Array.isArray(snapshot.items) && snapshot.items.length === 5 && Array.isArray(snapshot.lastKnownPrices);
  });

  await page.goto('/list', { waitUntil: 'networkidle' });
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Shopping list' })).toBeVisible();
    await expect(page.getByText('Offline copy saved with 5 last known prices.')).toBeVisible();

    const offlineSnapshot = await page.evaluate(() => {
      const raw = localStorage.getItem('groceryview:shopping-list:offline-cache:v1');
      return raw ? JSON.parse(raw) as { totalCount?: number; items?: unknown[] } : null;
    });
    expect(offlineSnapshot?.totalCount).toBe(5);
    expect(offlineSnapshot?.items).toHaveLength(5);
  } finally {
    await context.setOffline(false);
  }
});
