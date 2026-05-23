import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scriptUrl = new URL('../../infra/scripts/smoke-hosted-scanner-upload.mjs', import.meta.url);
const script = readFileSync(scriptUrl, 'utf8');

describe('hosted scanner upload smoke script', () => {
  it('performs an account-bound upload-ticket and signed PUT smoke without exposing bearer or signed URL values', async () => {
    assert.match(script, /GROCERYVIEW_SERVER_URL/);
    assert.match(script, /GROCERYVIEW_SCANNER_USER_ID/);
    assert.match(script, /GROCERYVIEW_SCANNER_BEARER_TOKEN/);
    assert.match(script, /HOSTED_SCANNER_UPLOAD_SMOKE_OUTPUT_PATH/);
    assert.match(script, /\/api\/scans\/upload-url\?userId=/);
    assert.match(script, /method:\s*'POST'/);
    assert.match(script, /method:\s*'PUT'/);
    assert.match(script, /ticket\.headers/);
    assert.match(script, /ticket\.uploadUrl/);
    assert.match(script, /ticket\.payloadUri/);
    assert.match(script, /scan_upload_ticket_ready/);
    assert.match(script, /scan_upload_put_succeeded/);
    assert.doesNotMatch(script, /bearerToken[^\n]+JSON\.stringify|uploadUrl[^\n]+JSON\.stringify/);

    const { runHostedScannerUploadSmoke } = await import(scriptUrl);
    const calls = [];
    const result = await runHostedScannerUploadSmoke({
      env: {
        GROCERYVIEW_SERVER_URL: 'https://api.groceryview.example',
        GROCERYVIEW_SCANNER_USER_ID: 'user-1',
        GROCERYVIEW_SCANNER_BEARER_TOKEN: 'secret-token'
      },
      now: new Date('2026-05-23T12:00:00.000Z'),
      fetch: async (url, init) => {
        calls.push({ url: String(url), init });
        if (String(url).includes('/api/scans/upload-url')) {
          assert.equal(init.headers.get('authorization'), 'Bearer secret-token');
          return new Response(JSON.stringify({
            userId: 'user-1',
            result: {
              status: 'ready',
              ticket: {
                scanId: 'hosted-scanner-upload-smoke-2026-05-23T12-00-00-000Z',
                uploadUrl: 'https://storage.example/signed?signature=secret',
                payloadUri: 's3://bucket/scans/readiness',
                expiresAt: '2026-05-23T12:10:00.000Z',
                maxBytes: 5000000,
                headers: { 'content-type': 'image/jpeg' }
              }
            }
          }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        assert.equal(String(url), 'https://storage.example/signed?signature=secret');
        assert.equal(init.method, 'PUT');
        assert.equal(init.headers.get('content-type'), 'image/jpeg');
        assert.equal(init.body, 'x');
        return new Response(null, { status: 200 });
      }
    });

    assert.equal(calls.length, 2);
    assert.deepEqual(result, {
      status: 'ready',
      scanId: 'hosted-scanner-upload-smoke-2026-05-23T12-00-00-000Z',
      evidence: ['scan_upload_ticket_ready', 'scan_upload_put_succeeded', 'scan_upload_private_payload_uri'],
      checkedAt: '2026-05-23T12:00:00.000Z'
    });
    assert.equal(JSON.stringify(result).includes('secret-token'), false);
    assert.equal(JSON.stringify(result).includes('signature=secret'), false);
  });
});
