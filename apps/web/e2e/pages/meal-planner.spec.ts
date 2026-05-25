import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium, expect, test } from '@playwright/test';

const execFileAsync = promisify(execFile);
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

type LighthouseResult = {
  categories?: {
    accessibility?: {
      score?: number | null;
    };
  };
};

async function runLighthouseAccessibilitySmoke(url: string) {
  const { stdout } = await execFileAsync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'lighthouse',
      url,
      '--only-categories=accessibility',
      '--output=json',
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage'
    ],
    {
      env: {
        ...process.env,
        CHROME_PATH: process.env.CHROME_PATH ?? chromium.executablePath()
      },
      maxBuffer: 1024 * 1024 * 8
    }
  );
  const report = JSON.parse(stdout) as LighthouseResult;
  return (report.categories?.accessibility?.score ?? 0) * 100;
}

test.describe('meal planner page smoke', () => {
  test.setTimeout(90_000);

  test('renders, has reachable controls, clean console/images, and passes Lighthouse a11y smoke', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/meal-planner');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /meal|meals assembled|deal-based meals/i })).toBeVisible();
    await expect(page.getByText(/suggested meals|weekly basket handoff|meal kit extraction/i).first()).toBeVisible();

    const focusableIds = await page.locator(focusableSelector).evaluateAll((elements) =>
      elements.flatMap((element, index) => {
        const htmlElement = element as HTMLElement & { __e2eFocusId?: string };
        const style = window.getComputedStyle(htmlElement);
        const rect = htmlElement.getBoundingClientRect();
        const visible = style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0 && htmlElement.tabIndex >= 0;
        if (!visible || htmlElement.getAttribute('aria-label') === 'Open Next.js Dev Tools') return [];
        const id = `focusable-${index}`;
        htmlElement.__e2eFocusId = id;
        return [id];
      })
    );
    expect(focusableIds.length).toBeGreaterThan(0);

    const reachedFocusableIds = new Set<string>();
    for (let index = 0; index < focusableIds.length * 3 + 10; index += 1) {
      await page.keyboard.press('Tab');
      const activeId = await page.evaluate(() => {
        const active = document.activeElement as (HTMLElement & { __e2eFocusId?: string }) | null;
        return active?.__e2eFocusId ?? '';
      });
      if (activeId) reachedFocusableIds.add(activeId);
      if (reachedFocusableIds.size === focusableIds.length) break;
    }
    expect([...reachedFocusableIds].sort()).toEqual([...focusableIds].sort());

    const brokenImages = await page.locator('img').evaluateAll((images) =>
      images
        .filter((image) => image instanceof HTMLImageElement && image.currentSrc && image.naturalWidth === 0)
        .map((image) => (image as HTMLImageElement).currentSrc)
    );
    expect(brokenImages).toEqual([]);

    const lighthouseAccessibilityScore = await runLighthouseAccessibilitySmoke(page.url());
    expect(lighthouseAccessibilityScore).toBeGreaterThanOrEqual(90);
    expect(consoleErrors).toEqual([]);
  });
});
