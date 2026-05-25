import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { createHttpHandler } from '../src/index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

function assertMatchesSchema<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    assert.fail(`${label} failed schema validation: ${result.error.message}`);
  }
  return result.data;
}

const idSchema = z.string().trim().min(1);

const productDetailRequestSchema = z.object({
  productId: idSchema
}).strict();

const productDetailResponseSchema = z.object({
  id: idSchema,
  ticker: idSchema,
  name: idSchema,
  category: idSchema,
  currentPrices: z.array(z.object({
    storeId: idSchema,
    storeName: idSchema,
    price: z.number().nonnegative()
  }).strict()).min(1),
  dealScore: z.number().min(0).max(100),
  verdict: idSchema,
  unitPrice: idSchema,
  history: z.array(z.object({
    date: idSchema,
    price: z.number().nonnegative(),
    verified: z.boolean()
  }).strict()).min(1)
}).passthrough();

const contactRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(160).optional(),
  message: z.string().trim().min(10).max(4000),
  consent: z.literal(true),
  source: z.enum(['web', 'mobile']).optional()
}).strict();

const simpleErrorResponseSchema = z.object({
  error: idSchema
}).strict();

const contactErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: idSchema,
    message: idSchema,
    details: z.unknown().optional()
  }).strict()
}).strict();

describe('API error contract tests', () => {
  it('validates a 200 request contract and product response shape', async () => {
    const request = assertMatchesSchema(productDetailRequestSchema, { productId: 'coffee' }, 'product detail request');
    const handle = createHttpHandler();

    const response = await handle(new Request(`http://localhost/api/products/${request.productId}`));

    assert.equal(response.status, 200);
    const body = assertMatchesSchema(productDetailResponseSchema, await json(response), '200 product response');
    assert.equal(body.id, request.productId);
  });

  it('validates a 400 request contract and structured validation error shape', async () => {
    const invalidRequest = contactRequestSchema.safeParse({
      name: 'Ada Shopper',
      email: 'not-an-email',
      message: 'short',
      consent: true,
      source: 'web'
    });
    assert.equal(invalidRequest.success, false);
    const handle = createHttpHandler(undefined, { now: new Date('2026-05-20T08:00:00.000Z') });

    const response = await handle(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.86' },
      body: JSON.stringify({
        name: 'Ada Shopper',
        email: 'not-an-email',
        message: 'short',
        consent: true,
        source: 'web'
      })
    }));

    assert.equal(response.status, 400);
    const body = assertMatchesSchema(contactErrorResponseSchema, await json(response), '400 contact response');
    assert.equal(body.error.code, 'validation_failed');
    assert.deepEqual((body.error.details as Array<{ path: string }>).map((detail) => detail.path), ['email', 'message']);
  });

  it('validates a 404 error response shape for a valid missing product request', async () => {
    const request = assertMatchesSchema(productDetailRequestSchema, { productId: 'not-in-catalog' }, 'missing product request');
    const handle = createHttpHandler();

    const response = await handle(new Request(`http://localhost/api/products/${request.productId}`));

    assert.equal(response.status, 404);
    const body = assertMatchesSchema(simpleErrorResponseSchema, await json(response), '404 product response');
    assert.match(body.error, /Product not found/i);
  });

  it('validates the 429 response shape when the contact rate limit applies', async () => {
    const request = assertMatchesSchema(contactRequestSchema, {
      name: 'Ada Shopper',
      email: 'ada@example.com',
      subject: 'Question about price alerts',
      message: 'Please tell me how grocery price alerts work.',
      consent: true,
      source: 'web'
    }, 'contact request');
    const handle = createHttpHandler(undefined, { now: new Date('2026-05-20T08:00:00.000Z') });

    for (let index = 0; index < 5; index += 1) {
      const allowed = await handle(new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.87' },
        body: JSON.stringify({ ...request, message: `Valid contact message ${index}.` })
      }));
      assert.equal(allowed.status, 202);
    }

    const response = await handle(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.87' },
      body: JSON.stringify(request)
    }));

    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '3600');
    const body = assertMatchesSchema(contactErrorResponseSchema, await json(response), '429 contact response');
    assert.equal(body.error.code, 'contact_rate_limited');
    assert.deepEqual(body.error.details, { retryAfterSeconds: 3600 });
  });
});
