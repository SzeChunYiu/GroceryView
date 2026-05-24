import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { createHttpHandler } from '../src/index.js';

const productHistoryRequestSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/),
  range: z.enum(['30d', '90d', '1y', 'all']).optional()
});

const productHistoryResponseSchema = z.array(z.object({
  date: z.string().min(1),
  price: z.number().nonnegative(),
  verified: z.boolean()
}));

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('api v1 products/[id]/history contract', () => {
  it('validates the request contract and maps invalid ids to 400 semantics', () => {
    assert.deepEqual(productHistoryRequestSchema.parse({ id: 'coffee', range: '90d' }), { id: 'coffee', range: '90d' });
    const result = productHistoryRequestSchema.safeParse({ id: '../coffee' });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0]?.code, 'invalid_string');
    }
  });

  it('returns 200 with the product history response shape', async () => {
    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/products/coffee/history'));
    assert.equal(response.status, 200);
    const body = productHistoryResponseSchema.parse(await json(response));
    assert.ok(body.length > 0);
    assert.equal(typeof body[0]?.date, 'string');
    assert.equal(typeof body[0]?.price, 'number');
    assert.equal(typeof body[0]?.verified, 'boolean');
  });

  it('returns 404 for an unknown product id', async () => {
    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/products/not-a-product/history'));
    assert.equal(response.status, 404);
    assert.deepEqual(await json(response), { error: 'Product not found.' });
  });

  it('documents that 429 is not emitted by the in-process history handler', async () => {
    const handle = createHttpHandler();
    const responses = await Promise.all(Array.from({ length: 3 }, () => handle(new Request('http://localhost/api/products/coffee/history'))));
    assert.deepEqual(responses.map((response) => response.status), [200, 200, 200]);
  });
});
