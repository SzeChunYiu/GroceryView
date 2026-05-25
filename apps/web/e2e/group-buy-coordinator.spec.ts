import { expect, test } from '@playwright/test';

test.describe('group-buy coordinator', () => {
  test('creates a group buy, invites two households, and unlocks the bulk-tier price', async ({ page }) => {
    await page.goto('/sweden/group-buys');

    await expect(page.getByRole('heading', { name: /bulk discounts households can unlock together/i })).toBeVisible();
    await page.getByRole('button', { name: /^create group buy$/i }).click();
    await expect(page.getByRole('status')).toContainText(/organizer household reserving 10 cartons/i);

    await page.getByRole('button', { name: /invite anna household/i }).click();
    await page.getByRole('button', { name: /invite khan household/i }).click();

    const coordinator = page.getByRole('region', { name: /create a group buy coordinator/i });
    await expect(coordinator.getByText(/Organizer household · 10 cartons/)).toBeVisible();
    await expect(coordinator.getByText(/Anna household · 6 cartons/)).toBeVisible();
    await expect(coordinator.getByText(/Khan household · 8 cartons/)).toBeVisible();
    await expect(coordinator.getByText(/24\/24 units committed · bulk tier unlocked/i)).toBeVisible();
    await expect(coordinator.getByText(/Unlocked bulk-tier price: 15\.90 SEK\/carton/i)).toBeVisible();

    await page.screenshot({ path: 'e2e/snapshots/group-buy-coordinator-final.png', fullPage: true });
  });

  test('shows an error when inviting a household before creating the group buy', async ({ page }) => {
    await page.goto('/sweden/group-buys');

    await page.getByRole('button', { name: /invite before creating/i }).click();

    await expect(page.getByRole('status')).toContainText(/create a group buy before inviting households/i);
  });

  test('returns not found for an unsupported country coordinator', async ({ page }) => {
    const response = await page.goto('/atlantis/group-buys');

    expect(response?.status()).toBe(404);
    await expect(page.getByText(/404|not found|this page could not be found/i)).toBeVisible();
  });
});
