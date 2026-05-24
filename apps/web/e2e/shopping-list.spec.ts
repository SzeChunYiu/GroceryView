import { expect, test } from '@playwright/test';

const SNAPSHOT_PATH = 'apps/web/e2e/snapshots/shopping-list-final.png';

test.describe('shopping list e2e', () => {
  test('builds a 5-item shopping list, shows cheapest source per item, and shares via link', async ({ page }) => {
    await page.goto('/basket');
    await expect(page.getByRole('heading', { name: /cross-chain cheapest basket calculator/i })).toBeVisible();

    const productCheckboxes = page.getByRole('checkbox');
    await expect(productCheckboxes).toHaveCount(12);

    for (let index = 0; index < 5; index += 1) {
      await productCheckboxes.nth(index).check();
    }
    for (let index = 5; index < 12; index += 1) {
      await productCheckboxes.nth(index).uncheck();
    }

    await expect(page.getByText('5 selected')).toBeVisible();
    await expect(page.getByTestId('cheapest-source-row')).toHaveCount(5);

    const cheapestRows = await page.getByTestId('cheapest-source-row').allTextContents();
    for (const rowText of cheapestRows) {
      expect(rowText).toMatch(/Willys|Hemköp/i);
      expect(rowText).toMatch(/kr|SEK/i);
    }

    const shareLink = page.getByTestId('share-basket-link');
    await expect(shareLink).toHaveAttribute('href', /\/basket\?items=.+/);
    await shareLink.click();
    await expect(page).toHaveURL(/\/basket\?items=.+/);
    await expect(page.getByText('5 selected')).toBeVisible();
    await expect(page.getByTestId('cheapest-source-row')).toHaveCount(5);

    await page.screenshot({ path: SNAPSHOT_PATH, fullPage: true });
  });

  test('shows an error path for a shared shopping-list link with no valid items', async ({ page }) => {
    await page.goto('/basket?items=not-a-real-product');

    await expect(page.getByTestId('basket-selection-error')).toContainText(/no valid product ids/i);
    await expect(page.getByText('0 selected')).toBeVisible();
    await expect(page.getByText(/select at least one product/i)).toBeVisible();
    await expect(page.getByTestId('cheapest-source-row')).toHaveCount(0);
  });
});
