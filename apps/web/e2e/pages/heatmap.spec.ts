import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HEATMAP_PATH = '/heatmap';
const LIGHTHOUSE_ACCESSIBILITY_MIN_SCORE = 0.9;
const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TAB_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function heatmapUrl() {
  return new URL(HEATMAP_PATH, process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').toString();
}

async function collectTabStops(page: Page, expectedCount: number) {
  const stops: string[] = [];
  await page.evaluate((selector) => {
    document
      .querySelectorAll(selector)
      .forEach((element, index) => element.setAttribute('data-tab-audit-index', String(index)));
  }, TAB_SELECTOR);
  for (let index = 0; index < expectedCount + 4; index += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return '';
      return element.getAttribute('data-tab-audit-index') ?? '';
    });
    if (active && !stops.includes(active)) {
      stops.push(active);
    }
  }
  return stops;
}

test.describe('heatmap page smoke', () => {
  test('renders, has reachable interactive cells, no console errors, and no broken images', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(heatmapUrl(), { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Category x chain price index grid/i })).toBeVisible();
    await expect(page.getByText(/TradingView-style heatmap/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    const interactiveCount = await page.evaluate((selector) => [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0).length, TAB_SELECTOR);
    expect(interactiveCount).toBeGreaterThan(0);

    const tabStops = await collectTabStops(page, interactiveCount);
    expect(tabStops.length).toBe(interactiveCount);
    await expect(page.getByRole('link', { name: /index/i }).first()).toBeVisible();

    const brokenImages = await page.locator('img').evaluateAll((images) =>
      images
        .filter((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute('src') ?? image.getAttribute('alt') ?? 'unknown image')
    );
    expect(brokenImages).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('passes a Lighthouse accessibility smoke score of at least 90', async () => {
    const result = spawnSync('npm', ['run', 'perf:lighthouse:heatmap'], {
      cwd: WEB_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
      }
    });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(LIGHTHOUSE_ACCESSIBILITY_MIN_SCORE).toBeGreaterThanOrEqual(0.9);
  });
});
