import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';

const seedPages = [
  '/',
  '/products',
  '/stores',
  '/categories',
  '/compare',
  '/settings',
  '/data-sources'
];

test('button audit: clickable elements render, focus, and do not throw', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const xhr500s: string[] = [];
  const auditRows: Array<{ page: string; label: string; kind: string; ok: boolean }> = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500) xhr500s.push(`${response.status()} ${response.url()}`);
  });

  for (const route of seedPages) {
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();
    const interactives = page.locator('button, [role="button"], a[href]');
    const count = Math.min(await interactives.count(), 40);

    for (let index = 0; index < count; index += 1) {
      const target = interactives.nth(index);
      if (!(await target.isVisible())) continue;
      const label = ((await target.textContent()) ?? (await target.getAttribute('aria-label')) ?? `interactive-${index}`).trim();
      const tagName = await target.evaluate((element) => element.tagName.toLowerCase());
      await target.focus();
      const hasFocus = await target.evaluate((element) => element === document.activeElement || element.contains(document.activeElement));
      expect(hasFocus, `${route} ${label} should receive focus`).toBe(true);
      await target.click({ trial: tagName === 'a' });
      auditRows.push({ page: route, label, kind: tagName, ok: true });
    }
  }

  const auditPath = testInfo.outputPath('button-audit.json');
  await mkdir(dirname(auditPath), { recursive: true });
  await writeFile(auditPath, JSON.stringify({ generatedAt: new Date().toISOString(), rows: auditRows }, null, 2));

  expect(consoleErrors).toEqual([]);
  expect(xhr500s).toEqual([]);
});
