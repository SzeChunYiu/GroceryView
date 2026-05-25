import { expect, test } from '@playwright/test';

test.describe('group-buy coordinator', () => {
  test('shows a created group buy, invited households, and the bulk-tier price state', async ({ page }) => {
    await page.goto('/sweden/group-buys');

    await expect(page.getByRole('heading', { name: /bulk discounts households can unlock together/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /oat milk case unlock/i })).toBeVisible();

    const oatMilkCard = page.locator('section, div').filter({ hasText: 'Oat milk case unlock' }).first();
    await expect(oatMilkCard.getByText(/Anna household · 6 cartons/)).toBeVisible();
    await expect(oatMilkCard.getByText(/Khan household · 8 cartons/)).toBeVisible();
    await expect(oatMilkCard.getByText(/Rivera household · 3 cartons/)).toBeVisible();
    await expect(oatMilkCard.getByText(/24 units unlock the bulk shelf price/)).toBeVisible();
    await expect(oatMilkCard.getByText(/15\.90 SEK\/carton/)).toBeVisible();
    await expect(oatMilkCard.getByText(/17\/24 units committed · 7 to unlock/)).toBeVisible();
    await expect(oatMilkCard.getByRole('button', { name: /join coordination list/i })).toBeVisible();

    await page.screenshot({ path: 'e2e/snapshots/group-buy-coordinator-final.png', fullPage: true });
  });

  test('returns not found for an unsupported country coordinator', async ({ page }) => {
    const response = await page.goto('/atlantis/group-buys');

    expect(response?.status()).toBe(404);
    await expect(page.getByText(/404|not found|this page could not be found/i)).toBeVisible();
  });
});
