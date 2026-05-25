import { expect, test } from '@playwright/test';
import {
  captureConsoleErrors,
  expectAllFocusableElementsReachable,
  expectLighthouseAccessibilitySmoke,
  expectNoBrokenImages
} from './page-smoke';

test.describe('savings dashboard page smoke', () => {
  test.setTimeout(90_000);

  test('renders, keeps all interactive elements keyboard reachable, has clean console/images, and passes a11y smoke', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    await page.goto('/savings-dashboard');
    await expect(page.getByRole('heading', { name: /savings dashboard/i })).toBeVisible();
    await expect(page.getByText(/basket inflation/i)).toBeVisible();

    await expectAllFocusableElementsReachable(page);
    await expectNoBrokenImages(page);
    await expectLighthouseAccessibilitySmoke(page);

    expect(consoleErrors).toEqual([]);
  });
});
