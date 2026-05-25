import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 1200 },
  { name: 'mobile', width: 390, height: 844 }
] as const;

const topPages = [
  { name: 'home', path: '/' },
  { name: 'products', path: '/products' },
  { name: 'categories', path: '/categories' },
  { name: 'deals', path: '/deals' },
  { name: 'compare', path: '/compare' },
  { name: 'search', path: '/search' },
  { name: 'scanner', path: '/scanner' },
  { name: 'watchlist', path: '/watchlist' },
  { name: 'list', path: '/list' },
  { name: 'map', path: '/map' },
  { name: 'savings-dashboard', path: '/savings-dashboard' },
  { name: 'seasonal-calendar', path: '/seasonal-calendar' },
  { name: 'meal-planner', path: '/meal-planner' },
  { name: 'basket', path: '/basket' },
  { name: 'weekly-basket', path: '/weekly-basket' },
  { name: 'data-sources', path: '/data-sources' },
  { name: 'chain-index', path: '/chain-index' },
  { name: 'stores', path: '/stores' },
  { name: 'openprices-depth', path: '/openprices-depth' },
  { name: 'catalogue-savings', path: '/catalogue-savings' },
  { name: 'pricing', path: '/pricing' },
  { name: 'alerts', path: '/alerts' },
  { name: 'privacy', path: '/privacy' },
  { name: 'cookies', path: '/cookies' },
  { name: 'settings', path: '/settings' }
] as const;

test.describe('top public page visual baselines', () => {
  for (const viewport of viewports) {
    test.describe(viewport.name, () => {
      test.use({ viewport });

      for (const route of topPages) {
        test(`${route.name} ${viewport.name}`, async ({ page }) => {
          await page.addStyleTag({
            content: `
              *, *::before, *::after {
                animation-delay: 0s !important;
                animation-duration: 0s !important;
                caret-color: transparent !important;
                transition-delay: 0s !important;
                transition-duration: 0s !important;
              }
            `
          });
          await page.goto(route.path, { waitUntil: 'networkidle' });
          await expect(page.locator('body')).toBeVisible();
          await expect(page).toHaveScreenshot(`${route.name}-${viewport.name}.png`, {
            animations: 'disabled',
            caret: 'hide',
            fullPage: false,
            maxDiffPixelRatio: 0.02
          });
        });
      }
    });
  }
});
