import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const healthRequestSchema = z.object({ verbose: z.boolean().optional() }).strict();
const healthResponseSchema = z.object({ ok: z.boolean(), status: z.string(), error: z.string().optional() });

function healthResponse(status: 200 | 400 | 404 | 429, body: unknown) {
  return { status, body: healthResponseSchema.parse(body) };
}

describe('health API contract', () => {
  it('validates a 200 health response shape', () => {
    assert.deepEqual(healthRequestSchema.parse({ verbose: true }), { verbose: true });
    assert.deepEqual(healthResponse(200, { ok: true, status: 'healthy' }), { status: 200, body: { ok: true, status: 'healthy' } });
  });

  it('validates 400, 404, and 429 error shapes', () => {
    assert.equal(healthRequestSchema.safeParse({ verbose: 'yes' }).success, false);
    assert.equal(healthResponse(400, { ok: false, status: 'bad_request', error: 'Invalid health request.' }).status, 400);
    assert.equal(healthResponse(404, { ok: false, status: 'not_found', error: 'Health route not found.' }).body.status, 'not_found');
    assert.equal(healthResponse(429, { ok: false, status: 'rate_limited', error: 'Too many health checks.' }).body.status, 'rate_limited');
  });
});
