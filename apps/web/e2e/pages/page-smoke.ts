import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium, expect, type Page } from '@playwright/test';

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

export function captureConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  return consoleErrors;
}

export async function expectAllFocusableElementsReachable(page: Page) {
  const focusableIds = await page.locator(focusableSelector).evaluateAll((elements) =>
    elements.flatMap((element, index) => {
      const htmlElement = element as HTMLElement & { __e2eFocusId?: string };
      const style = window.getComputedStyle(htmlElement);
      const rect = htmlElement.getBoundingClientRect();
      const hasVisibleAncestors = (() => {
        for (let current: HTMLElement | null = htmlElement; current; current = current.parentElement) {
          const currentStyle = window.getComputedStyle(current);
          if (
            currentStyle.visibility === 'hidden' ||
            currentStyle.display === 'none' ||
            currentStyle.opacity === '0' ||
            currentStyle.pointerEvents === 'none' ||
            current.hasAttribute('inert') ||
            current.getAttribute('aria-hidden') === 'true'
          ) {
            return false;
          }
        }
        return true;
      })();
      const isReachabilityCandidate =
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        rect.width > 0 &&
        rect.height > 0 &&
        htmlElement.tabIndex >= 0 &&
        htmlElement.getAttribute('aria-label') !== 'Open Next.js Dev Tools' &&
        hasVisibleAncestors;
      if (!isReachabilityCandidate) return [];

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
}

export async function expectAtLeastOneFocusableElementReachable(page: Page) {
  const interactive = page.locator(focusableSelector);
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
}

export async function expectNoBrokenImages(page: Page) {
  const brokenImages = await page.locator('img').evaluateAll((images) =>
    images
      .filter((image) => image instanceof HTMLImageElement && image.currentSrc && image.naturalWidth === 0)
      .map((image) => (image as HTMLImageElement).currentSrc)
  );
  expect(brokenImages).toEqual([]);
}

export async function runLighthouseAccessibilitySmoke(url: string) {
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

export async function expectLighthouseAccessibilitySmoke(page: Page, minimumScore = 90) {
  const lighthouseAccessibilityScore = await runLighthouseAccessibilitySmoke(page.url());
  expect(lighthouseAccessibilityScore).toBeGreaterThanOrEqual(minimumScore);
}
