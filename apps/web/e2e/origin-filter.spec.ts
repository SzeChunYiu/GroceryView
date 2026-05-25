import { expect, test, type Page } from '@playwright/test';

async function mockNavigatorLanguages(page: Page, languages: string[]) {
  await page.addInitScript((mockedLanguages) => {
    Object.defineProperty(navigator, 'languages', {
      configurable: true,
      get: () => mockedLanguages
    });
  }, languages);
}

function expectOrigins(expected: string[]) {
  return (url: URL) => {
    const origins = url.searchParams.getAll('origin');
    return expected.every((origin) => origins.includes(origin));
  };
}

test('applies the local navigator country as the default origin chip', async ({ page }) => {
  await mockNavigatorLanguages(page, ['sv-SE', 'en-US']);

  await page.goto('/products');

  await expect(page).toHaveURL(expectOrigins(['SE']));
  await expect(page.getByRole('button', { name: /Sweden origin/i })).toHaveAttribute('aria-pressed', 'true');
});

test('persists multi-select origin chips in the URL and clears them', async ({ page }) => {
  await page.goto('/products?origin=SE');

  await page.getByRole('button', { name: /Germany origin/i }).click();
  await expect(page).toHaveURL(expectOrigins(['SE', 'DE']));
  await expect(page.getByRole('button', { name: /Sweden origin/i })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /Germany origin/i })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /Clear 2/i }).click();
  await expect(page).toHaveURL((url) => !url.searchParams.has('origin'));
});

test('preserves selected origins when submitting the product search form', async ({ page }) => {
  await page.goto('/products?origin=SE&origin=DE');

  await page.getByLabel('Search', { exact: true }).fill('oats');
  await page.locator('form[action="/products"]').getByRole('button', { name: 'Apply filters' }).click();

  await expect(page).toHaveURL((url) => (
    url.pathname === '/products'
    && url.searchParams.get('q') === 'oats'
    && expectOrigins(['SE', 'DE'])(url)
  ));
});
