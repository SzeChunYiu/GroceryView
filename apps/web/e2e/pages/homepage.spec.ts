import { expect, test } from '@playwright/test';

test.describe('homepage smoke', () => {
  test('renders, is keyboard reachable, has clean console/images, and passes a11y smoke', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const interactive = page.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const interactiveCount = await interactive.count();
    expect(interactiveCount).toBeGreaterThan(0);

    const reachedInteractive = new Set<string>();
    for (let index = 0; index < Math.min(interactiveCount + 3, 40); index += 1) {
      await page.keyboard.press('Tab');
      const activeLabel = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        return active?.getAttribute('href') ?? active?.getAttribute('aria-label') ?? active?.textContent?.trim() ?? active?.tagName ?? '';
      });
      if (activeLabel) reachedInteractive.add(activeLabel);
    }
    expect(reachedInteractive.size).toBeGreaterThan(0);

    const brokenImages = await page.locator('img').evaluateAll((images) =>
      images
        .filter((image) => image instanceof HTMLImageElement && image.currentSrc && image.naturalWidth === 0)
        .map((image) => (image as HTMLImageElement).currentSrc)
    );
    expect(brokenImages).toEqual([]);

    const accessibilitySmoke = await page.evaluate(() => {
      const namedButtons = [...document.querySelectorAll('button')].every((button) => button.textContent?.trim() || button.getAttribute('aria-label'));
      const namedLinks = [...document.querySelectorAll('a[href]')].every((link) => link.textContent?.trim() || link.getAttribute('aria-label'));
      const documentHasH1 = Boolean(document.querySelector('h1'));
      return { score: documentHasH1 && namedButtons && namedLinks ? 100 : 0 };
    });
    expect(accessibilitySmoke.score).toBeGreaterThanOrEqual(90);

    expect(consoleErrors).toEqual([]);
  });
});
