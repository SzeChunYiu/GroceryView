import { expect, test } from '@playwright/test';

const injectionId = "00000000-0000-0000-0000-000000000000' OR 1=1 --";

test.describe('security malformed input smoke', () => {
  test('search query XSS stays inert in the empty state', async ({ page }) => {
    await page.goto('/products?q=%3Cscript%3Ewindow.__xss=1%3C%2Fscript%3E', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('<script>window.__xss=1</script>').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => Reflect.get(window, '__xss'))).toBeUndefined();
  });

  test('history API rejects SQL-shaped path and query input without server error', async ({ request }) => {
    const response = await request.get(`/api/v1/products/${encodeURIComponent(injectionId)}/history?limit=1%3Bdrop%20table%20prices`);

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('mutating list-share POST handles missing CSRF context without leaking server errors', async ({ request }) => {
    const response = await request.post('/api/list/share', {
      data: { listId: '<img src=x onerror=alert(1)>', items: [{ name: '<script>alert(1)</script>' }] }
    });

    expect(response.status()).toBeLessThan(500);
    await expect(response.text()).resolves.not.toContain('<script>alert(1)</script>');
  });

  test('price history API eventually rate limits one client key', async ({ request }) => {
    let rateLimited = false;
    for (let index = 0; index < 70; index += 1) {
      const response = await request.get('/api/v1/products/00000000-0000-0000-0000-000000000000/history?limit=1', {
        headers: { 'x-forwarded-for': 'security-rate-limit-smoke' }
      });
      if (response.status() === 429) {
        rateLimited = true;
        break;
      }
      expect(response.status()).toBeLessThan(500);
    }

    expect(rateLimited).toBe(true);
  });
});
