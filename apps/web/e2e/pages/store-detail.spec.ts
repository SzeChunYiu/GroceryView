import { expect, test } from '@playwright/test';
import {
  captureConsoleErrors,
  expectAllFocusableElementsReachable,
  expectLighthouseAccessibilitySmoke,
  expectNoBrokenImages
} from './page-smoke';

const storeSlug = '0024-narlivs-sweden-543923929';

test.describe('store detail page smoke', () => {
  test.setTimeout(120_000);

  test('renders, has reachable interactions, clean console/images, and passes Lighthouse a11y smoke', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    await page.goto(`/stores/${storeSlug}`);
    await expect(page.getByRole('heading', { name: /0024 närlivs/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /location fields/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open google maps directions/i })).toBeVisible();

    await expectAllFocusableElementsReachable(page);
    await expectNoBrokenImages(page);
    await expectLighthouseAccessibilitySmoke(page, 90);

    expect(consoleErrors).toEqual([]);
  });
});
