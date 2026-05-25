import { expect, test } from '@playwright/test';

type BrowserBox = { x: number; y: number; width: number; height: number };

function intersects(a: BrowserBox, b: BrowserBox) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('loads /stores/ica with a MapLibre canvas and ICA list rows without overlap', async ({ page }) => {
  await page.goto('/stores/ica');

  const map = page.getByTestId('ica-store-map');
  await expect(map).toBeVisible();
  await expect(page.getByRole('heading', { name: /ICA store locator map/i })).toBeVisible();

  const canvas = map.locator('canvas.maplibregl-canvas').first();
  await expect(canvas).toBeVisible();

  const firstRow = page.getByTestId('ica-store-list-row').first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow).toContainText(/ICA|Maxi/i);

  const canvasBox = await canvas.boundingBox();
  const rowBox = await firstRow.boundingBox();
  expect(canvasBox, 'MapLibre canvas should have a rendered browser box').not.toBeNull();
  expect(rowBox, 'At least one ICA list row should have a rendered browser box').not.toBeNull();
  expect(intersects(canvasBox!, rowBox!), 'MapLibre canvas and ICA list row should not visually overlap').toBe(false);
});
