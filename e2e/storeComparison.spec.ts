import { expect, test } from '@playwright/test';

test('renders a pre-selected two-store comparison with correct prices', async ({ page }) => {
  await page.goto('/compare?stores=willys-odenplan,lidl-sveavagen');

  await expect(page.getByRole('heading', { name: 'Store comparison' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Willys Odenplan' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Lidl Sveavägen' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Coop Odenplan' })).not.toBeChecked();

  const coffeeRow = page.getByRole('row', { name: /Zoégas Coffee 450g/ });
  await expect(coffeeRow.getByRole('cell', { name: '49.90 SEK' })).toBeVisible();
  await expect(coffeeRow.getByRole('cell', { name: '59.90 SEK' })).toBeVisible();

  const milkRow = page.getByRole('row', { name: /Arla Milk 1L/ });
  await expect(milkRow.getByRole('cell', { name: '29.80 SEK' })).toBeVisible();
  await expect(milkRow.getByRole('cell', { name: '27.80 SEK' })).toBeVisible();

  const eggsRow = page.getByRole('row', { name: /Eggs 12-pack/ });
  await expect(eggsRow.getByRole('cell', { name: '36.90 SEK' })).toBeVisible();
  await expect(eggsRow.getByRole('cell', { name: '34.90 SEK' })).toBeVisible();

  const totalRow = page.getByRole('row', { name: /Total/ });
  await expect(totalRow).toContainText('116.60 SEK');
  await expect(totalRow).toContainText('122.60 SEK');
});
