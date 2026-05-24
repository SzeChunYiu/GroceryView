import { expect, type Locator, type Page, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const auditPath = new URL('./form-audit.json', import.meta.url);
const successPattern = /success|saved|sent|submitted|created|updated|joined|prepared|download|check your|complete/i;
const validationPattern = /required|invalid|missing|enter|select|choose|sign in first|no anonymous|must/i;

type FormAuditRow = {
  page: string;
  formIndex: number;
  action: string;
  method: string;
  emptyValidation: string;
  validSubmission: string;
};

async function discoverPages(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const queued = ['/'];
  const seen = new Set<string>();

  while (queued.length > 0 && seen.size < 40) {
    const path = queued.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    await page.goto(path);
    const links = await page.locator('a[href^="/"]').evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).pathname));
    for (const link of links) {
      const url = new URL(link, origin);
      if (!seen.has(url.pathname) && !queued.includes(url.pathname)) queued.push(url.pathname);
    }
  }

  return [...seen];
}

async function fillValidValues(form: Locator) {
  const inputs = form.locator('input:not([type="hidden"]), textarea, select');
  const count = await inputs.count();
  for (let index = 0; index < count; index += 1) {
    const field = inputs.nth(index);
    if (!(await field.isVisible())) continue;
    const tagName = await field.evaluate((node) => node.tagName.toLowerCase());
    const type = (await field.getAttribute('type')) ?? 'text';
    if (tagName === 'select') {
      const value = await field.locator('option:not([disabled])').nth(1).getAttribute('value').catch(() => null);
      if (value) await field.selectOption(value);
    } else if (type === 'checkbox' || type === 'radio') {
      await field.check({ force: true }).catch(() => undefined);
    } else if (type === 'email') {
      await field.fill('forms-audit@example.com');
    } else if (type === 'number') {
      await field.fill('1');
    } else if (type === 'tel') {
      await field.fill('+46700000000');
    } else if (type === 'url') {
      await field.fill('https://example.com');
    } else if (type === 'password') {
      await field.fill('CorrectHorseBatteryStaple123!');
    } else {
      await field.fill('Form audit value');
    }
  }
}

test('every form validates empty submissions and has a valid submit path', async ({ page, baseURL }) => {
  test.skip(!baseURL, 'baseURL is required for form crawl');
  const pages = await discoverPages(page, baseURL!);
  const audit: FormAuditRow[] = [];

  for (const path of pages) {
    await page.goto(path);
    const formCount = await page.locator('form').count();
    for (let formIndex = 0; formIndex < formCount; formIndex += 1) {
      const form = page.locator('form').nth(formIndex);
      const action = (await form.getAttribute('action')) ?? path;
      const method = ((await form.getAttribute('method')) ?? 'get').toLowerCase();

      await form.locator('button[type="submit"], input[type="submit"]').first().click({ force: true }).catch(() => form.evaluate((node: HTMLFormElement) => node.requestSubmit()));
      const validationText = await page.locator('[role="alert"], [aria-invalid="true"], .error, .text-red-600, .text-rose-700').allTextContents();
      const nativeInvalid = await form.evaluate((node: HTMLFormElement) => !node.checkValidity());
      expect(nativeInvalid || validationPattern.test(validationText.join(' '))).toBeTruthy();

      await page.goto(path);
      const validForm = page.locator('form').nth(formIndex);
      await fillValidValues(validForm);
      const beforeUrl = page.url();
      await validForm.locator('button[type="submit"], input[type="submit"]').first().click({ force: true }).catch(() => validForm.evaluate((node: HTMLFormElement) => node.requestSubmit()));
      await page.waitForTimeout(750);
      const successText = (await page.locator('[role="status"], [role="alert"], main, body').allTextContents()).join(' ');
      const moved = page.url() !== beforeUrl;
      expect(moved || successPattern.test(successText)).toBeTruthy();

      audit.push({ page: path, formIndex, action, method, emptyValidation: 'passed', validSubmission: 'passed' });
    }
  }

  await writeFile(auditPath, JSON.stringify({ generatedAt: new Date().toISOString(), pages, forms: audit }, null, 2));
});
