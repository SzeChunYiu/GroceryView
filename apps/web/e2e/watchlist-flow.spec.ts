import { expect, test } from '@playwright/test';

const userEmail = 'watchlist-flow@example.test';
const session = {
  accessToken: 'watchlist-e2e-token',
  userId: 'watchlist-e2e-user',
  email: userEmail,
  expiresAt: '2099-01-01T00:00:00.000Z'
};

async function signIn(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session)
    });
  });
  await page.route('**/api/account/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ userId: session.userId, email: session.email })
    });
  });

  await page.goto('/login');
  await page.getByLabel('Verified auth provider assertion').fill('valid-watchlist-e2e-assertion');
  await page.getByRole('button', { name: 'Exchange session' }).click();
  await expect(page.getByText(`Session established for ${session.userId}`)).toBeVisible();
}

test.describe('watchlist search and price target flow', () => {
  test('searches, saves a watchlist candidate, sets a price target, and persists after logout/login', async ({ page }) => {
    await signIn(page);

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /verified product catalogue/i })).toBeVisible();
    await page.getByLabel('Search').fill('mjölk');
    await page.getByRole('button', { name: /search/i }).click();
    await expect(page).toHaveURL(/\/products\?.*q=mj%C3%B6lk/);

    const saveCard = page.locator('a', { hasText: 'sourceProductSlug:' }).first();
    await expect(saveCard).toBeVisible();
    const savedProductName = (await saveCard.locator('h3').first().innerText()).trim();
    await expect(saveCard.getByLabel(/Save .* to watchlist/)).toBeVisible();
    await saveCard.click();
    await expect(page).toHaveURL(/\/products\//);

    await page.goto('/unit-price-alerts');
    await page.getByLabel('Alert email').fill(userEmail);
    await page.getByLabel('Target SEK').fill('12.34');
    const selectedProduct = await page.getByLabel('Verified product').inputValue();
    await page.getByRole('button', { name: 'Create alert' }).click();
    await expect(page.locator('[data-status="saved"]')).toContainText(`Created 12,34 kr alert for ${selectedProduct}.`);
    await expect(page.getByText(selectedProduct).first()).toBeVisible();

    await page.goto('/watchlist');
    await expect(page.getByRole('heading', { name: /tracked products with notification-ready alerts/i })).toBeVisible();
    await expect(page.getByText(/Active alerts/)).toBeVisible();
    await expect(page.getByText(/target/i).first()).toBeVisible();

    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/login');
    await expect(page.getByText('Waiting for a verified auth provider assertion.')).toBeVisible();
    await signIn(page);

    await page.goto('/unit-price-alerts');
    await page.getByLabel('Alert email').fill(userEmail);
    await page.getByRole('button', { name: 'Load' }).click();
    await expect(page.locator('[data-status="ready"]')).toContainText('Loaded 1 alert API rows for this email.');
    await expect(page.getByText(selectedProduct).first()).toBeVisible();

    await page.goto('/watchlist');
    await expect(page.getByText(savedProductName.split(/\s+/)[0], { exact: false }).first()).toBeVisible();
    await page.screenshot({ path: 'e2e/snapshots/watchlist-flow-final.png', fullPage: true });
  });

  test('blocks setting a target when no signed-in email is available', async ({ page }) => {
    await page.goto('/unit-price-alerts');
    await page.getByLabel('Target SEK').fill('9.99');
    await page.getByRole('button', { name: 'Create alert' }).click();
    await expect(page.locator('[data-status="blocked"]')).toHaveText('Sign in or enter alert email first. No anonymous unit price alert writes are sent to the alert API.');
    await expect(page.locator('[data-status="saved"]')).toHaveCount(0);
  });
});
