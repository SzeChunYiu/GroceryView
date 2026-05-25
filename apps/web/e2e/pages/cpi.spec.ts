import { expect, test } from '@playwright/test';
import {
  captureConsoleErrors,
  expectAllFocusableElementsReachable,
  expectLighthouseAccessibilitySmoke,
  expectNoBrokenImages
} from './page-smoke';

test.describe('CPI page smoke', () => {
  test.setTimeout(90_000);

  test('renders, has reachable controls, clean console/images, and passes Lighthouse a11y smoke', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    await page.goto('/savings-dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /savings dashboard/i })).toBeVisible();
    await expect(page.getByText(/basket inflation/i)).toBeVisible();

    await expectAllFocusableElementsReachable(page);
    await expectNoBrokenImages(page);
    await expectLighthouseAccessibilitySmoke(page);

    expect(consoleErrors).toEqual([]);
  });
});
