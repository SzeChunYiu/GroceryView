import { expect, test } from '@playwright/test';

const searchPath = process.env.SECURITY_SEARCH_PATH ?? '/search';
const csrfPostPaths = (process.env.SECURITY_CSRF_POST_PATHS ?? '/api/list/import,/api/feedback,/api/session')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);
const rateLimitPath = process.env.SECURITY_RATE_LIMIT_PATH ?? '/api/search';
const rateLimitAttempts = Number.parseInt(process.env.SECURITY_RATE_LIMIT_ATTEMPTS ?? '40', 10);

const sqlPayloads = ["' OR 1=1--", '1; DROP TABLE products; --'];
const xssPayload = '<img src=x onerror="window.__groceryviewXss=1">';

function pathWithQuery(path: string, query: string) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}q=${encodeURIComponent(query)}`;
}

test.describe('security smoke tests', () => {
  for (const payload of sqlPayloads) {
    test(`sanitizes SQL-shaped input: ${payload}`, async ({ page }) => {
      const response = await page.goto(pathWithQuery(searchPath, payload));
      expect(response?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator('body')).not.toContainText(/syntax error|SQLSTATE|stack trace|unterminated quoted string/i);
    });
  }

  test('does not execute or reflect XSS payloads from query params', async ({ page }) => {
    await page.addInitScript(() => {
      Reflect.set(globalThis, '__groceryviewXss', 0);
    });

    const response = await page.goto(pathWithQuery(searchPath, xssPayload));
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect.poll(() => page.evaluate(() => Reflect.get(globalThis, '__groceryviewXss'))).toBe(0);
    await expect(page.locator('script', { hasText: '__groceryviewXss' })).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(xssPayload);
  });

  test('rejects CSRF-less POSTs on mutating routes', async ({ request }) => {
    let checkedExistingPostRoute = false;

    for (const path of csrfPostPaths) {
      const response = await request.post(path, {
        data: { name: '<script>alert(1)</script>', query: "' OR 1=1--" },
        headers: { origin: 'https://attacker.invalid' }
      });
      if ([404, 405].includes(response.status())) continue;

      checkedExistingPostRoute = true;
      expect([400, 401, 403, 419]).toContain(response.status());
    }

    expect(checkedExistingPostRoute, `No configured POST route existed. SECURITY_CSRF_POST_PATHS=${csrfPostPaths.join(',')}`).toBeTruthy();
  });

  test('rate-limit target returns 429 after repeated malformed POSTs', async ({ request }) => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < rateLimitAttempts; attempt += 1) {
      const response = await request.post(rateLimitPath, {
        data: { query: `${sqlPayloads[0]} ${attempt}` }
      });
      statuses.push(response.status());
      if (response.status() === 429) break;
      if ([404, 405].includes(response.status())) test.skip(true, `${rateLimitPath} is not a POST route in this environment.`);
    }

    expect(statuses).toContain(429);
  });
});
