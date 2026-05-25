import { expect, test } from '@playwright/test';
import {
  captureConsoleErrors,
  expectAllFocusableElementsReachable,
  expectLighthouseAccessibilitySmoke,
  expectNoBrokenImages
} from './page-smoke';

test.describe('heatmap page smoke', () => {
  test.setTimeout(120_000);

  test('renders, has reachable interactive elements, clean console/images, and passes Lighthouse a11y smoke', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    await page.goto('/heatmap');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /category x chain price index grid/i })).toBeVisible();
    await expect(page.getByText(/tradingview-style heatmap/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /index/i }).first()).toBeVisible();

    await expectAllFocusableElementsReachable(page);
    await expectNoBrokenImages(page);
    await expectLighthouseAccessibilitySmoke(page, 90);

    expect(consoleErrors).toEqual([]);
  });
});
