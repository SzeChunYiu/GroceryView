import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('contact form route', () => {
  it('validates client fields and posts to the local contact stub', async () => {
    const [page, form, route] = await Promise.all([
      read('src/app/contact/page.tsx'),
      read('src/components/contact-form.tsx'),
      read('src/app/api/contact/route.ts')
    ]);

    assert.match(page, /routeMetadata\('\/contact'\)/);
    assert.match(page, /<ContactForm \/>/);

    assert.match(form, /'use client'/);
    assert.match(form, /name\.trim\(\)/);
    assert.match(form, /email\.trim\(\)/);
    assert.match(form, /message\.trim\(\)/);
    assert.match(form, /type="email"/);
    assert.match(form, /required/);
    assert.match(form, /fetch\('\/api\/contact'/);
    assert.match(form, /role=\{status === 'error' \? 'alert' : 'status'\}/);
    assert.match(form, /data-status=\{status\}/);

    assert.match(route, /export async function POST\(request: Request\)/);
    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /appendFile/);
    assert.match(route, /\/tmp\/contact\.jsonl/);
    assert.match(route, /name, email, message, receivedAt/);
    assert.match(route, /status: 202/);
    assert.match(route, /status: 400/);
  });
});
