import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const apiVersionRequestSchema = z.object({
  method: z.literal('GET'),
  path: z.literal('/api/version'),
  headers: z.record(z.string()).default({})
});

const apiVersionResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal(200), body: z.object({ service: z.literal('groceryview-server'), version: z.string().min(1), commit: z.string().min(1).nullable() }) }),
  z.object({ status: z.literal(400), body: z.object({ error: z.string().min(1) }) }),
  z.object({ status: z.literal(404), body: z.object({ error: z.string().min(1) }) }),
  z.object({ status: z.literal(429), body: z.object({ error: z.string().min(1), retryAfterSeconds: z.number().int().positive().optional() }) })
]);

describe('api version contract', () => {
  it('validates the request schema', () => {
    assert.deepEqual(apiVersionRequestSchema.parse({ method: 'GET', path: '/api/version' }), {
      method: 'GET',
      path: '/api/version',
      headers: {}
    });
    assert.equal(apiVersionRequestSchema.safeParse({ method: 'POST', path: '/api/version' }).success, false);
  });

  it('accepts the 200 response shape', () => {
    const parsed = apiVersionResponseSchema.parse({
      status: 200,
      body: { service: 'groceryview-server', version: '0.1.0', commit: 'abc123' }
    });
    assert.equal(parsed.status, 200);
  });

  it('accepts 400, 404, and 429 error shapes', () => {
    for (const response of [
      { status: 400, body: { error: 'Invalid version request.' } },
      { status: 404, body: { error: 'Version route not found.' } },
      { status: 429, body: { error: 'Rate limit exceeded.', retryAfterSeconds: 60 } }
    ]) {
      assert.equal(apiVersionResponseSchema.safeParse(response).success, true);
    }
  });
});
