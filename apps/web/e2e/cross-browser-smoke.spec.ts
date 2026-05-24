import { expect, test } from '@playwright/test';
import { browserSkipFor, browserSpecificSkips, type CrossBrowserSmokeFeature } from './browser-skips';

function skipIfDocumented(browserName: string, feature: CrossBrowserSmokeFeature) {
  const reason = browserSkipFor(browserName, feature);
  test.skip(Boolean(reason), reason ?? 'No browser-specific skip documented.');
}

test.describe('cross-browser smoke matrix', () => {
  test('has no expired or untracked browser-specific skips', () => {
    const skipKeys = new Set<string>();
    for (const skip of browserSpecificSkips) {
      expect(skip.reason.trim().length).toBeGreaterThan(0);
      expect(skip.trackingIssue.trim().length).toBeGreaterThan(0);
      expect(Date.parse(`${skip.expiresOn}T23:59:59.999Z`)).toBeGreaterThan(Date.now());
      const key = `${skip.browserName}:${skip.feature}`;
      expect(skipKeys.has(key)).toBe(false);
      skipKeys.add(key);
    }
  });

  test('renders price chart controls', async ({ page, browserName }) => {
    skipIfDocumented(browserName, 'chart');

    await page.goto('/index/grocery');
    await expect(page.getByText('Price chart terminal').first()).toBeVisible();
    const selector = page.getByLabel('Price chart timeframe selector').first();
    await expect(selector).toBeVisible();
    const timeframeButtons = selector.getByRole('button');
    const timeframeButtonCount = await timeframeButtons.count();
    expect(timeframeButtonCount).toBeGreaterThan(1);
    const oneWeekButton = timeframeButtons.first();
    await oneWeekButton.click();
    await expect(oneWeekButton).toHaveAttribute('aria-pressed', 'true');
    const allWindowButton = timeframeButtons.nth(timeframeButtonCount - 1);
    await allWindowButton.click();
    await expect(allWindowButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps map list interactions usable', async ({ page, browserName }) => {
    skipIfDocumented(browserName, 'map');

    await page.route('https://tiles.openfreemap.org/**', (route) => route.abort());
    await page.goto('/map');
    await expect(page.getByRole('heading', { name: /Interactive store map with linked list selection/i })).toBeVisible();
    const firstStore = page.locator('button[data-store-slug]').first();
    await expect(firstStore).toBeVisible();
    await firstStore.click();
    await expect(firstStore).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows barcode fallback when camera permission is unavailable', async ({ page, browserName }) => {
    skipIfDocumented(browserName, 'camera-fallback');

    await page.addInitScript(() => {
      sessionStorage.setItem('groceryview:accessToken', 'cross-browser-smoke-token');
      sessionStorage.setItem('groceryview:userId', 'cross-browser-smoke-user');
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException('Denied by cross-browser smoke test', 'NotAllowedError');
          }
        }
      });
    });

    await page.goto('/scanner');
    await page.getByRole('button', { name: 'Start receipt camera' }).click();
    await expect(page.locator('[data-status="error"]')).toHaveText('Camera permission was denied or unavailable. No receipt image was uploaded.');
    await expect(page.getByTestId('scanner-barcode-fallback')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Process barcode scan' })).toBeEnabled();
  });

  test('submits product filters without losing form state', async ({ page, browserName }) => {
    skipIfDocumented(browserName, 'forms');

    await page.goto('/products');
    await page.locator('#product-search-q').fill('oat');
    await page.locator('#product-search-confidence').fill('0.5');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page).toHaveURL(/\/products\?.*q=oat/);
    await expect(page.locator('#product-search-q')).toHaveValue('oat');
    await expect(page.locator('#product-search-confidence')).toHaveValue('0.5');
  });

  test('navigates through the shared app chrome', async ({ page, browserName }) => {
    skipIfDocumented(browserName, 'navigation');

    await page.goto('/products');
    await page.getByRole('link', { name: /GroceryView/i }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
