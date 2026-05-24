import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('contact API durable storage', () => {
  it('persists contact submissions through a configured repo-backed JSONL adapter', async () => {
    const route = await read('src/app/api/contact/route.ts');

    assert.match(route, /export async function POST\(request: Request\)/);
    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /CONTACT_SUBMISSIONS_PATH/);
    assert.match(route, /defaultContactSubmissionsPath = 'data\/contact-submissions\.jsonl'/);
    assert.match(route, /createJsonlContactStorageAdapter/);
    assert.match(route, /randomUUID\(\)/);
    assert.match(route, /mkdir\(dirname\(filePath\), \{ recursive: true \}\)/);
    assert.match(route, /appendFile\(filePath, `\$\{JSON\.stringify\(submission\)\}\\n`/);
    assert.doesNotMatch(route, /\/tmp\/contact\.jsonl/);

    assert.match(route, /name, email, and message are required/);
    assert.match(route, /email must be valid/);
    assert.match(route, /invalid contact request/);
    assert.match(route, /contact submission could not be persisted/);
    assert.match(route, /NextResponse\.json\(\{ ok: true \}, \{ status: 202 \}\)/);
    assert.match(route, /NextResponse\.json\(\{ error: 'name, email, and message are required' \}, \{ status: 400 \}\)/);
  });
});
