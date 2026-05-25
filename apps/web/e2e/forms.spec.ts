import { expect, test, type Locator, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const routesWithForms = [
  '/account',
  '/compare-items',
  '/list',
  '/partners/submit',
  '/products',
  '/screener',
  '/settings',
  '/watchlist'
] as const;

type FormAuditRow = {
  action: string;
  emptyResult: 'blocked-by-browser-validation' | 'submitted-or-no-required-fields';
  formIndex: number;
  method: string;
  route: string;
  validResult: 'submitted' | 'skipped-external-mailto' | 'no-submit-control';
};

async function fillValidValues(form: Locator) {
  const controls = await form.locator('input, textarea, select').all();
  for (const control of controls) {
    const tagName = await control.evaluate((node) => node.tagName.toLowerCase());
    const type = tagName === 'input' ? (await control.getAttribute('type'))?.toLowerCase() ?? 'text' : tagName;
    const name = (await control.getAttribute('name')) ?? '';
    if (['button', 'checkbox', 'file', 'hidden', 'image', 'radio', 'reset', 'submit'].includes(type)) continue;
    if (tagName === 'select') {
      const optionValue = await control.locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value).find(Boolean) ?? '');
      if (optionValue) await control.selectOption(optionValue).catch(() => undefined);
      continue;
    }
    const value = type === 'email'
      ? 'form-audit@example.com'
      : type === 'number'
        ? '1'
        : type === 'url'
          ? 'https://example.com'
          : name.toLowerCase().includes('ean') || name.toLowerCase().includes('barcode')
            ? '7310865084703'
            : 'form audit';
    await control.fill(value).catch(() => undefined);
  }
}

async function submit(form: Locator, page: Page) {
  const submitter = form.locator('button[type="submit"], input[type="submit"], button:not([type])').first();
  if (await submitter.count()) {
    await submitter.click().catch(() => undefined);
  } else {
    await form.evaluate((node) => (node as HTMLFormElement).requestSubmit()).catch(() => undefined);
  }
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
}

test('crawls forms, audits empty validation and valid submission paths', async ({ page }) => {
  const audit: FormAuditRow[] = [];
  await page.route('**/api/**', async (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, audit: true }) }));

  for (const routePath of routesWithForms) {
    await page.goto(routePath);
    const formCount = await page.locator('form').count();

    for (let formIndex = 0; formIndex < formCount; formIndex += 1) {
      await page.goto(routePath);
      const form = page.locator('form').nth(formIndex);
      const action = await form.getAttribute('action') ?? page.url();
      const method = (await form.getAttribute('method') ?? 'get').toLowerCase();

      if (action.startsWith('mailto:')) {
        audit.push({ action, emptyResult: 'submitted-or-no-required-fields', formIndex, method, route: routePath, validResult: 'skipped-external-mailto' });
        continue;
      }

      await submit(form, page);
      const invalidAfterEmpty = await page.locator('form').nth(Math.min(formIndex, Math.max(0, await page.locator('form').count() - 1))).locator(':invalid').count().catch(() => 0);
      const emptyResult: FormAuditRow['emptyResult'] = invalidAfterEmpty > 0 ? 'blocked-by-browser-validation' : 'submitted-or-no-required-fields';

      await page.goto(routePath);
      const validForm = page.locator('form').nth(formIndex);
      await fillValidValues(validForm);
      const hasSubmit = await validForm.locator('button[type="submit"], input[type="submit"], button:not([type])').count();
      if (hasSubmit === 0) {
        audit.push({ action, emptyResult, formIndex, method, route: routePath, validResult: 'no-submit-control' });
        continue;
      }
      await submit(validForm, page);
      audit.push({ action, emptyResult, formIndex, method, route: routePath, validResult: 'submitted' });
    }
  }

  const outputPath = path.join(test.info().config.rootDir, 'e2e', 'form-audit.json');
  await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), forms: audit }, null, 2)}\n`);
  expect(audit.length).toBeGreaterThan(0);
  expect(audit.every((row) => row.validResult !== 'no-submit-control')).toBe(true);
});
