import { expect, test } from '@playwright/test';

type ButtonAuditRow = {
  page: string;
  label: string;
  selector: string;
  ok: boolean;
};

const pagesToAudit = ['/', '/products', '/stores', '/compare', '/settings'];

test('button audit covers clickable controls without console or XHR 500 errors', async ({ page }, testInfo) => {
  const audit: ButtonAuditRow[] = [];
  const failures: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.request().resourceType() === 'xhr' && response.status() >= 500) {
      failures.push(`xhr ${response.status()}: ${response.url()}`);
    }
  });

  for (const path of pagesToAudit) {
    await page.goto(path);
    const clickables = page.locator('button, [role="button"], a[href]');
    const count = Math.min(await clickables.count(), 40);

    for (let index = 0; index < count; index += 1) {
      const clickable = clickables.nth(index);
      const label = (await clickable.innerText().catch(() => 'unlabelled')).trim() || 'unlabelled';
      await clickable.focus();
      await expect(clickable).toBeFocused();
      await clickable.click({ trial: true });
      audit.push({ page: path, label, selector: `clickable:${index}`, ok: true });
    }
  }

  await testInfo.attach('button-audit.json', {
    body: JSON.stringify(audit, null, 2),
    contentType: 'application/json'
  });
  expect(failures).toEqual([]);
});
