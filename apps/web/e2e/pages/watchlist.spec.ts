import { expect, test } from '@playwright/test';
import {
  captureConsoleErrors,
  expectAtLeastOneFocusableElementReachable,
  expectLighthouseAccessibilitySmoke,
  expectNoBrokenImages
} from './page-smoke';

test.describe('watchlist page smoke', () => {
  test.setTimeout(90_000);

  test('renders, is keyboard reachable, has clean console/images, and passes a11y smoke', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /watchlist price alerts/i })).toBeVisible();

    await expectAtLeastOneFocusableElementReachable(page);
    await expectNoBrokenImages(page);
    await expectLighthouseAccessibilitySmoke(page);

    expect(consoleErrors).toEqual([]);
  });
});
