import { expect, test } from '@playwright/test';

test.describe('savings dashboard page smoke', () => {
  test('renders, tabs through all controls, has clean console/images, and passes a11y smoke', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/savings-dashboard');
    await expect(page.getByRole('heading', { name: /savings dashboard/i })).toBeVisible();

    const interactiveSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const interactive = page.locator(interactiveSelector);
    const interactiveCount = await interactive.count();
    expect(interactiveCount).toBeGreaterThan(0);

    const expectedTabStops = await interactive.evaluateAll((elements) => elements.map((element, index) => {
      const htmlElement = element as HTMLElement;
      htmlElement.dataset.e2eTabStop = `savings-dashboard-tab-stop-${index}`;
      return htmlElement.dataset.e2eTabStop;
    }));
    const reachedTabStops = new Set<string>();

    for (let index = 0; index < interactiveCount + 5; index += 1) {
      await page.keyboard.press('Tab');
      const activeTabStop = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.e2eTabStop ?? '');
      if (activeTabStop) reachedTabStops.add(activeTabStop);
      if (reachedTabStops.size === expectedTabStops.length) break;
    }

    expect([...reachedTabStops].sort()).toEqual([...expectedTabStops].sort());

    const brokenImages = await page.locator('img').evaluateAll((images) =>
      images
        .filter((image) => image instanceof HTMLImageElement && image.currentSrc && image.naturalWidth === 0)
        .map((image) => (image as HTMLImageElement).currentSrc)
    );
    expect(brokenImages).toEqual([]);

    const lighthouseAccessibilitySmoke = await page.evaluate(() => {
      const namedButtons = [...document.querySelectorAll('button')].every((button) => button.textContent?.trim() || button.getAttribute('aria-label'));
      const namedLinks = [...document.querySelectorAll('a[href]')].every((link) => link.textContent?.trim() || link.getAttribute('aria-label'));
      const documentHasH1 = Boolean(document.querySelector('h1'));
      const imageAltCoverage = [...document.querySelectorAll('img')].every((image) => image.hasAttribute('alt'));
      const headingOrder = [...document.querySelectorAll('h1, h2, h3')].every((heading) => /^H[1-3]$/.test(heading.tagName));
      const checks = [documentHasH1, namedButtons, namedLinks, imageAltCoverage, headingOrder];
      return {
        documentHasH1,
        namedButtons,
        namedLinks,
        imageAltCoverage,
        headingOrder,
        score: Math.round((checks.filter(Boolean).length / checks.length) * 100)
      };
    });
    expect(lighthouseAccessibilitySmoke.score).toBeGreaterThanOrEqual(90);

    expect(consoleErrors).toEqual([]);
  });
});
