import { expect, test } from '@playwright/test';

const interactiveSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

test.describe('brand vs store-brand page smoke', () => {
  test('renders, tabs through controls, has clean console/images, and passes a Lighthouse-style a11y smoke', async ({ page }) => {
    test.setTimeout(90_000);
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/compare', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /comparable chain prices/i })).toBeVisible();
    await expect(page.getByText(/private label/i).first()).toBeVisible();

    const expectedInteractiveKeys = await page.locator(interactiveSelector).evaluateAll((elements) => elements
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        return style.visibility !== 'hidden' && style.display !== 'none' && htmlElement.getClientRects().length > 0;
      })
      .map((element, index) => {
        const htmlElement = element as HTMLElement;
        return htmlElement.id || htmlElement.getAttribute('href') || htmlElement.getAttribute('aria-label') || htmlElement.textContent?.trim() || `${htmlElement.tagName}-${index}`;
      }));
    const interactiveCount = expectedInteractiveKeys.length;
    expect(interactiveCount).toBeGreaterThan(0);
    const reachedInteractive = new Set<string>();
    for (let index = 0; index < interactiveCount * 2 + 20; index += 1) {
      await page.keyboard.press('Tab');
      const activeKey = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) return '';
        return active.id || active.getAttribute('href') || active.getAttribute('aria-label') || active.textContent?.trim() || active.tagName;
      });
      if (activeKey) reachedInteractive.add(activeKey);
    }
    for (const key of expectedInteractiveKeys) expect(reachedInteractive).toContain(key);

    const brokenImages = await page.locator('img').evaluateAll((images) => images
      .filter((image) => image instanceof HTMLImageElement && image.currentSrc && image.naturalWidth === 0)
      .map((image) => (image as HTMLImageElement).currentSrc));
    expect(brokenImages).toEqual([]);

    const lighthouseAccessibilitySmoke = await page.evaluate(() => {
      const checks = [
        Boolean(document.querySelector('main h1')),
        document.title.trim().length > 0,
        [...document.querySelectorAll('button')].every((button) => button.textContent?.trim() || button.getAttribute('aria-label')),
        [...document.querySelectorAll('a[href]')].every((link) => link.textContent?.trim() || link.getAttribute('aria-label')),
        [...document.querySelectorAll('img')].every((image) => image.getAttribute('alt') !== null)
      ];
      const passed = checks.filter(Boolean).length;
      return Math.round((passed / checks.length) * 100);
    });
    expect(lighthouseAccessibilitySmoke).toBeGreaterThanOrEqual(90);

    expect(consoleErrors).toEqual([]);
  });
});
