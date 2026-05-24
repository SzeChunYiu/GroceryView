import { expect, test } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const groupBuyCoordinatorUrl = new URL('/group-buy-coordinator', baseURL).toString();
const households = ['andersson@example.test', 'nguyen@example.test'];

test.describe('group-buy coordinator', () => {
  test('creates a group buy, invites two households, and unlocks the bulk tier', async ({ page }) => {
    await page.goto(groupBuyCoordinatorUrl);

    await page.getByRole('button', { name: 'Create group buy' }).click();
    for (const household of households) {
      await page.getByLabel('Household email').fill(household);
      await page.getByRole('button', { name: 'Invite household' }).click();
    }

    await expect(page.getByText('andersson@example.test')).toBeVisible();
    await expect(page.getByText('nguyen@example.test')).toBeVisible();
    await expect(page.getByLabel('Bulk tier status')).toContainText('Bulk-tier price unlocked');
    await expect(page.getByLabel('Bulk tier status')).toContainText('3 households');
    await page.screenshot({ path: 'apps/web/e2e/snapshots/group-buy-coordinator-unlocked.png', fullPage: true });
  });

  test('shows an error when inviting the same household twice', async ({ page }) => {
    await page.goto(groupBuyCoordinatorUrl);

    await page.getByRole('button', { name: 'Create group buy' }).click();
    await page.getByLabel('Household email').fill('andersson@example.test');
    await page.getByRole('button', { name: 'Invite household' }).click();
    await page.getByLabel('Household email').fill('ANDERSSON@example.test');
    await page.getByRole('button', { name: 'Invite household' }).click();

    await expect(page.getByRole('alert')).toHaveText('Household already invited');
  });
});
