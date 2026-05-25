import { expect, test as base, type Page } from '@playwright/test';

type ConsoleErrorCapture = {
  readonly errors: readonly string[];
};

type GroceryViewFixtures = {
  consoleErrorCapture: ConsoleErrorCapture;
  gotoApp: (path?: string) => Promise<Page>;
};

export const test = base.extend<GroceryViewFixtures>({
  consoleErrorCapture: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await use({ errors });
  },
  gotoApp: async ({ page }, use) => {
    await use(async (path = '/') => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      return page;
    });
  },
  page: async ({ page }, use) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await use(page);
  }
});

export { expect };
