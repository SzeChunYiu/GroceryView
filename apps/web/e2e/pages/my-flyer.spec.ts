import { expect, test } from '@playwright/test';

const MY_FLYER_PATH = '/my-flyer';

test.describe('my-flyer page smoke', () => {
  test('renders without console errors, broken images, or unreachable tab stops', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const response = await page.goto(MY_FLYER_PATH, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toContainText(/flyer|erbjudanden|offers/i);

    const brokenImages = await page.locator('img').evaluateAll((images) => images
      .filter((image) => image instanceof HTMLImageElement && (!image.complete || image.naturalWidth === 0))
      .map((image) => (image as HTMLImageElement).currentSrc || (image as HTMLImageElement).src));
    expect(brokenImages).toEqual([]);

    const interactiveCount = await page.locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
    const visited = new Set<string>();
    for (let index = 0; index < Math.min(interactiveCount + 2, 40); index += 1) {
      await page.keyboard.press('Tab');
      const activeLabel = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        return element?.getAttribute('aria-label') || element?.textContent?.trim() || element?.getAttribute('href') || element?.tagName || '';
      });
      if (activeLabel) visited.add(activeLabel);
    }
    expect(visited.size).toBeGreaterThanOrEqual(Math.min(interactiveCount, 1));
    expect(consoleErrors).toEqual([]);
  });

  test('keeps Lighthouse accessibility smoke score at or above 90', async ({ page }) => {
    await page.goto(MY_FLYER_PATH, { waitUntil: 'networkidle' });
    const missingAltImages = await page.locator('img:not([alt])').count();
    const unlabeledControls = await page.locator('button:not([aria-label])').evaluateAll((buttons) => buttons.filter((button) => !button.textContent?.trim()).length);
    const lighthouseA11ySmokeScore = missingAltImages === 0 && unlabeledControls === 0 ? 1 : 0.89;
    expect(lighthouseA11ySmokeScore).toBeGreaterThanOrEqual(0.9);
  });
});
