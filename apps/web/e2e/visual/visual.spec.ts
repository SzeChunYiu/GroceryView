import { expect, test } from '@playwright/test';
import { snapshotName, top25Pages, visualViewports } from './top-25-pages';

test.describe('top-25 visual regression baselines', () => {
  for (const pathname of top25Pages) {
    for (const viewport of visualViewports) {
      test(`${pathname} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(pathname, { waitUntil: 'networkidle' });
        await expect(page).toHaveScreenshot(['snapshots', snapshotName(pathname, viewport.name)], {
          fullPage: true,
          maxDiffPixelRatio: 0.01
        });
      });
    }
  }
});
