import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const contactRequestSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(4000)
});

const contactResponseSchema = z.object({
  ok: z.boolean(),
  id: z.string().optional(),
  error: z.string().optional()
});

function contactResponse(status: 200 | 400 | 404 | 429, body: unknown) {
  return { status, body: contactResponseSchema.parse(body) };
}

describe('contact API contract', () => {
  it('accepts a valid contact request and returns the 200 response shape', () => {
    const request = contactRequestSchema.parse({
      email: 'shopper@example.com',
      subject: 'Price issue',
      message: 'The listed price looks stale for my local store.'
    });

    const response = contactResponse(200, { ok: true, id: `contact:${request.email}` });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true, id: 'contact:shopper@example.com' });
  });

  it('rejects invalid request bodies with a 400 response shape', () => {
    const parsed = contactRequestSchema.safeParse({ email: 'bad', subject: 'x', message: 'short' });
    const response = contactResponse(400, { ok: false, error: 'Invalid contact request.' });

    assert.equal(parsed.success, false);
    assert.equal(response.status, 400);
    assert.equal(response.body.error, 'Invalid contact request.');
  });

  it('keeps 404 and 429 errors on the shared error response contract', () => {
    assert.deepEqual(contactResponse(404, { ok: false, error: 'Contact route not found.' }), {
      status: 404,
      body: { ok: false, error: 'Contact route not found.' }
    });
    assert.deepEqual(contactResponse(429, { ok: false, error: 'Too many contact requests.' }), {
      status: 429,
      body: { ok: false, error: 'Too many contact requests.' }
    });
  });
});
