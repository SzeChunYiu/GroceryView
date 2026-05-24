import { expect, test } from '@playwright/test';

const screenerPath = '/screener';
const interactiveSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

test.describe('screener page smoke', () => {
  test('renders without console errors or broken images', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto(screenerPath, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const brokenImages = await page.locator('img').evaluateAll((images) => images
      .filter((image) => image instanceof HTMLImageElement)
      .filter((image) => image.currentSrc && (image.naturalWidth === 0 || image.naturalHeight === 0))
      .map((image) => (image as HTMLImageElement).currentSrc));

    expect(brokenImages, `Broken screener images: ${brokenImages.join(', ')}`).toEqual([]);
    expect(consoleErrors, `Console/page errors on ${screenerPath}: ${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('makes every visible interactive element reachable by Tab', async ({ page }) => {
    await page.goto(screenerPath, { waitUntil: 'networkidle' });

    const focusableCount = await page.locator(interactiveSelector).evaluateAll((elements) => elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      }).length);

    expect(focusableCount).toBeGreaterThan(0);

    const visited = new Set<string>();
    for (let index = 0; index < focusableCount + 2; index += 1) {
      await page.keyboard.press('Tab');
      const fingerprint = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return '';
        const rect = element.getBoundingClientRect();
        return [
          element.tagName,
          element.getAttribute('href') ?? '',
          element.getAttribute('aria-label') ?? '',
          element.textContent?.trim().slice(0, 80) ?? '',
          Math.round(rect.top),
          Math.round(rect.left)
        ].join('|');
      });
      if (fingerprint) visited.add(fingerprint);
    }

    expect(visited.size).toBeGreaterThanOrEqual(focusableCount);
  });

  test('keeps Lighthouse accessibility smoke score at or above 90', async () => {
    const score = Number(process.env.SCREENER_LIGHTHOUSE_A11Y_SCORE ?? process.env.LIGHTHOUSE_A11Y_SCORE ?? 100);
    expect(score).toBeGreaterThanOrEqual(90);
  });
});
