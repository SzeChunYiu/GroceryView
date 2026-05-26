import { expect, test, type TestInfo } from '@playwright/test';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

type BrowserSpecificSkip = {
  browser: BrowserName;
  expires: string;
  reason: string;
  testTitlePattern: RegExp;
};

const browserSpecificSkips: BrowserSpecificSkip[] = [];

function browserNameForProject(projectName: string): BrowserName | null {
  if (projectName.includes('chromium')) return 'chromium';
  if (projectName.includes('firefox')) return 'firefox';
  if (projectName.includes('webkit')) return 'webkit';
  return null;
}

function applyBrowserSpecificSkip(testInfo: TestInfo) {
  const browser = browserNameForProject(testInfo.project.name);
  if (!browser) return;

  const activeSkip = browserSpecificSkips.find((skip) => (
    skip.browser === browser && skip.testTitlePattern.test(testInfo.title)
  ));
  if (!activeSkip) return;

  test.skip(true, `${activeSkip.reason} (expires ${activeSkip.expires})`);
}

test.describe('cross-browser smoke matrix', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    applyBrowserSpecificSkip(testInfo);
    await page.addInitScript(() => {
      sessionStorage.setItem('groceryview:accessToken', 'cross-browser-smoke-token');
      sessionStorage.setItem('groceryview:userId', 'cross-browser-smoke-user');
    });
  });

  test('browser-specific skip registry requires owner-friendly expiry metadata', async () => {
    const supportedBrowsers: BrowserName[] = ['chromium', 'firefox', 'webkit'];
    const today = new Date();
    const seenEntries = new Set<string>();

    for (const skip of browserSpecificSkips) {
      expect(supportedBrowsers).toContain(skip.browser);
      expect(skip.reason.trim()).not.toBe('');
      expect(skip.expires).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${skip.expires}T00:00:00.000Z`).getTime()).toBeGreaterThan(today.getTime());

      const key = `${skip.browser}:${skip.testTitlePattern.source}:${skip.expires}`;
      expect(seenEntries.has(key)).toBe(false);
      seenEntries.add(key);
    }

    expect(Array.isArray(browserSpecificSkips)).toBe(true);
  });

  test('renders price chart and navigates through product search form', async ({ page }) => {
    await page.goto('/products/havredryck-choklad-7340083494406');

    await expect(page.getByText('Price chart terminal')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Price chart timeframe selector' })).toBeVisible();

    await page.getByRole('button', { name: 'Show last 365 days price chart window' }).click();
    const chart = page.getByRole('img', { name: /price history chart for last 365 days/i });
    await expect(chart).toBeVisible();
    await expect(chart.locator('canvas').first()).toBeVisible();
    await expect(page.getByText(/Interactive chart renderer failed to load/i)).toHaveCount(0);

    await page.goto('/products');
    await page.locator('#product-search-q').fill('oat');
    await page.locator('#product-min-carbon-score').fill('20');
    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page).toHaveURL(/\/products\?.*q=oat/);
    await expect(page.locator('#product-search-q')).toHaveValue('oat');
  });

  test('supports map canvas interaction and visible ICA store rows', async ({ page }) => {
    await page.goto('/stores/ica');

    const map = page.getByTestId('ica-store-map');
    await expect(map).toBeVisible();

    const canvas = map.locator('canvas.maplibregl-canvas').first();
    await expect(canvas).toBeVisible();
    await canvas.click({ position: { x: 80, y: 80 } });
    await page.mouse.wheel(0, -240);

    const firstRow = page.getByTestId('ica-store-list-row').first();
    await expect(firstRow).toBeVisible();
    await expect(firstRow).toContainText(/ICA|Maxi/i);
  });

  test('keeps barcode scanning usable when camera permission is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException('Camera permission denied in smoke test', 'NotAllowedError');
          }
        }
      });
    });
    await page.route('**/api/scans/process?**', async (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ result: { kind: 'barcode', productId: null, status: 'failed_no_provider' } })
    }));

    await page.goto('/scanner');
    await page.getByRole('button', { name: 'Start barcode camera' }).click();
    await expect(page.getByText('Camera permission was denied or unavailable. Use manual EAN entry instead.')).toBeVisible();

    await page.getByLabel('Barcode payload').fill('9999999999999');
    await page.getByRole('button', { name: 'Process barcode scan' }).click();

    await expect(page.getByRole('region', { name: 'Barcode lookup fallback' })).toBeVisible();
    await expect(page.getByText(/No catalogue match was returned for 9999999999999/i)).toBeVisible();
  });

  test('blocks empty required partner form fields before mail client submission', async ({ page }) => {
    await page.goto('/partners/submit');

    const form = page.locator('form').first();
    await expect(page.getByRole('heading', { name: 'Submit a store price feed' })).toBeVisible();
    await expect(form.locator(':invalid')).toHaveCount(7);

    await form.evaluate((node) => (node as HTMLFormElement).requestSubmit());
    await expect(form.locator(':invalid')).toHaveCount(7);
    await expect(page).toHaveURL(/\/partners\/submit$/);
  });
});
