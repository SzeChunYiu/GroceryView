import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('contact form route', () => {
  it('renders the contact page with the client form and toast feedback wiring', async () => {
    const page = await read('src/app/contact/page.tsx');
    const form = await read('src/components/contact-form.tsx');
    const seo = await read('src/lib/seo.ts');

    assert.match(page, /routeMetadata\('\/contact'\)/);
    assert.match(page, /<ContactForm \/>/);
    assert.match(form, /fetch\('\/api\/contact'/);
    assert.match(form, /ToastRegion label="Contact notifications"/);
    assert.match(form, /aria-invalid=\{Boolean\(errors\.email\)\}/);
    assert.match(form, /role="alert"/);
    assert.match(seo, /'\/contact': \{/);
  });

  it('validates and logs accepted contact submissions through the API stub', async () => {
    const route = await read('src/app/api/contact/route.ts');

    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /export async function POST\(request: Request\)/);
    assert.match(route, /request\.json\(\)/);
    assert.match(route, /name\.length < 2/);
    assert.ok(route.includes('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)'));
    assert.match(route, /message\.length < 10/);
    assert.match(route, /appendFile\('\/tmp\/contact\.jsonl'/);
    assert.match(route, /receivedAt: new Date\(\)\.toISOString\(\)/);
    assert.match(route, /NextResponse\.json\(\{ ok: true \}, \{ status: 201 \}\)/);
  });
});
