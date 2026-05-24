import { expect, test, type TestInfo } from '@playwright/test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CPI_PAGE_PATH = process.env.CPI_PAGE_PATH ?? '/savings-dashboard';
const FALLBACK_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

function baseUrl(testInfo: TestInfo) {
  const configuredBaseUrl = testInfo.project.use.baseURL;
  return typeof configuredBaseUrl === 'string' && configuredBaseUrl.length > 0
    ? configuredBaseUrl
    : FALLBACK_BASE_URL;
}

function pageUrl(testInfo: TestInfo) {
  return new URL(CPI_PAGE_PATH, baseUrl(testInfo)).toString();
}

function moduleSearchPaths() {
  const require = createRequire(import.meta.url);
  const paths = [
    process.cwd(),
    path.resolve(process.cwd(), 'apps/web'),
    path.resolve(process.cwd(), '../..')
  ];

  try {
    paths.push(path.dirname(require.resolve('@lhci/cli/package.json', { paths })));
  } catch {
    // The Playwright smoke can still run without LHCI; the Lighthouse test reports
    // a targeted dependency error if neither lighthouse nor the LHCI bundle exists.
  }

  return paths;
}

async function importInstalled<TModule>(specifier: string): Promise<TModule> {
  const require = createRequire(import.meta.url);
  const resolved = require.resolve(specifier, { paths: moduleSearchPaths() });
  return import(pathToFileURL(resolved).href) as Promise<TModule>;
}

test('personal CPI page renders, tabs through controls, and has no console or image regressions', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(pageUrl(testInfo), { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /savings dashboard/i })).toBeVisible();
  await expect(page.getByText(/personal grocery inflation/i).first()).toBeVisible();
  await expect(page.getByText(/basket inflation/i)).toBeVisible();

  await page.waitForLoadState('networkidle').catch(() => undefined);

  const brokenImages = await page.locator('img').evaluateAll((images) =>
    images
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || '<unlabelled image>')
  );
  expect(brokenImages, 'CPI page should not render broken images').toEqual([]);

  const focusableIds = await page
    .locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]')
    .evaluateAll((elements) => {
      return elements.flatMap((element, index) => {
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        const rect = htmlElement.getBoundingClientRect();
        const isReachable =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0 &&
          !htmlElement.hasAttribute('aria-hidden');

        if (!isReachable) {
          return [];
        }

        htmlElement.dataset.playwrightTabId = String(index);
        return [String(index)];
      });
    });

  if (focusableIds.length > 0) {
    await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));

    const focusedIds = new Set<string>();
    for (let index = 0; index < focusableIds.length + 3; index += 1) {
      await page.keyboard.press('Tab');
      const activeId = await page.evaluate(() =>
        document.activeElement instanceof HTMLElement ? document.activeElement.dataset.playwrightTabId ?? null : null
      );
      if (activeId) {
        focusedIds.add(activeId);
      }
    }

    expect([...focusedIds].sort(), 'all visible interactive CPI elements should be reachable via Tab').toEqual(
      [...focusableIds].sort()
    );
  }

  expect(pageErrors, 'CPI page should not throw runtime errors').toEqual([]);
  expect(consoleErrors, 'CPI page should not log console errors').toEqual([]);
});

test('personal CPI page keeps Lighthouse accessibility score above 90', async ({}, testInfo) => {
  type LighthouseModule = {
    default: (
      url: string,
      flags: { port: number; onlyCategories: string[]; output: 'json'; logLevel: 'error' }
    ) => Promise<{ lhr: { categories: { accessibility?: { score: number | null } } } } | undefined>;
  };
  type ChromeLauncherModule = {
    launch: (options: { chromeFlags: string[] }) => Promise<{ port: number; kill: () => Promise<void> }>;
  };

  const lighthouse = await importInstalled<LighthouseModule>('lighthouse');
  const chromeLauncher = await importInstalled<ChromeLauncherModule>('chrome-launcher');
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const result = await lighthouse.default(pageUrl(testInfo), {
      port: chrome.port,
      onlyCategories: ['accessibility'],
      output: 'json',
      logLevel: 'error'
    });
    const score = result?.lhr.categories.accessibility?.score;

    expect(score, 'Lighthouse accessibility category should be present').toEqual(expect.any(Number));
    expect(Math.round((score ?? 0) * 100), 'Lighthouse accessibility score').toBeGreaterThanOrEqual(90);
  } finally {
    await chrome.kill();
  }
});
