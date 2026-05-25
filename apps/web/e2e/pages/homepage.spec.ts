import { expect, test } from '@playwright/test';
import {
  captureConsoleErrors,
  expectAllFocusableElementsReachable,
  expectLighthouseAccessibilitySmoke,
  expectNoBrokenImages
} from './page-smoke';

test.describe('homepage smoke', () => {
  test.setTimeout(120_000);

  test('renders, has reachable interactive elements, clean console/images, and passes Lighthouse a11y smoke', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /readable prices, explicit sources, zero placeholder rows/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /compare chain prices/i })).toBeVisible();

    await expectAllFocusableElementsReachable(page);
    await expectNoBrokenImages(page);
    await expectLighthouseAccessibilitySmoke(page, 90);

    expect(consoleErrors).toEqual([]);
  });
});
