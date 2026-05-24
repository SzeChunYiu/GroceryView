import { expect, test } from '@playwright/test';

async function gotoFirstStoreDetail(page: import('@playwright/test').Page) {
  await page.goto('/stores');
  const firstStoreLink = page.locator('a[href^="/stores/"]').first();
  await expect(firstStoreLink).toBeVisible();
  const href = await firstStoreLink.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href!);
}

test.describe('store detail page', () => {
  test('renders without console errors, broken images, keyboard traps, or low a11y smoke score', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await gotoFirstStoreDetail(page);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();

    const brokenImages = await page.locator('img').evaluateAll((images) =>
      images
        .map((image) => image as HTMLImageElement)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src || image.alt || 'unknown image')
    );
    expect(brokenImages, `broken images: ${brokenImages.join(', ')}`).toEqual([]);

    const visitedFocusable = new Set<string>();
    for (let index = 0; index < 20; index += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        return element.getAttribute('href') || element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName;
      });
      if (focused) visitedFocusable.add(focused);
    }
    expect(visitedFocusable.size).toBeGreaterThan(1);

    const a11ySmokeScore = await page.evaluate(() => {
      let score = 100;
      const imagesMissingAlt = [...document.images].filter((image) => !image.hasAttribute('alt')).length;
      const buttonsMissingName = [...document.querySelectorAll('button')].filter((button) => !button.textContent?.trim() && !button.getAttribute('aria-label')).length;
      const linksMissingName = [...document.querySelectorAll('a')].filter((link) => !link.textContent?.trim() && !link.getAttribute('aria-label')).length;
      const hasMain = Boolean(document.querySelector('main'));
      const hasHeading = Boolean(document.querySelector('h1'));

      score -= imagesMissingAlt * 5;
      score -= buttonsMissingName * 10;
      score -= linksMissingName * 10;
      if (!hasMain) score -= 10;
      if (!hasHeading) score -= 10;
      return Math.max(0, score);
    });
    expect(a11ySmokeScore).toBeGreaterThanOrEqual(90);
    expect(consoleErrors).toEqual([]);
  });
});
