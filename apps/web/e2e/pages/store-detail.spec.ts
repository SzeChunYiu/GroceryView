import { expect, test } from '@playwright/test';

test('store detail page is keyboard, console, image, and a11y smoke safe', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/stores');
  const storeHref = await page.locator('a[href^="/stores/"]').evaluateAll((links) => {
    return links.map((link) => link.getAttribute('href')).find((href) => href && href !== '/stores') ?? null;
  });

  await page.goto(storeHref ?? '/stores');
  await expect(page.locator('main')).toBeVisible();

  const interactiveCount = await page
    .locator('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')
    .count();
  const tabStops = Math.min(interactiveCount, 25);
  for (let index = 0; index < tabStops; index += 1) {
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  }

  const brokenImages = await page.locator('img').evaluateAll((images) => {
    return images
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute('src') ?? image.getAttribute('alt') ?? 'unknown image');
  });
  expect(brokenImages).toEqual([]);
  expect(consoleErrors).toEqual([]);

  const lighthouseA11ySmokeScore = await page.evaluate(() => {
    const images = Array.from(document.images);
    const namedImages = images.filter((image) => image.alt.trim().length > 0 || image.getAttribute('role') === 'presentation');
    const controls = Array.from(document.querySelectorAll('button, input, select, textarea'));
    const namedControls = controls.filter((control) => control.getAttribute('aria-label') || control.textContent?.trim());
    const imageScore = images.length === 0 ? 100 : (namedImages.length / images.length) * 100;
    const controlScore = controls.length === 0 ? 100 : (namedControls.length / controls.length) * 100;
    return Math.round((imageScore + controlScore) / 2);
  });

  expect(lighthouseA11ySmokeScore).toBeGreaterThanOrEqual(90);
});
