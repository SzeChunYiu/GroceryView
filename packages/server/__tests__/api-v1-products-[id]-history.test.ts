import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { buildOpenApiDocument, createHttpHandler } from '../src/index.js';

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

const productHistoryRequestSchema = z.object({
  productId: z.string().trim().min(1).regex(/^[a-z0-9-]+$/)
}).strict();

const productHistoryPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().positive(),
  verified: z.boolean()
}).strict();

const productHistoryResponseSchema = z.array(productHistoryPointSchema);

const errorResponseSchema = z.object({
  error: z.string().trim().min(1)
}).strict();

describe('v1 products history API contract', () => {
  it('validates the 200 request schema and response shape for product history', async () => {
    const request = assertMatchesSchema(productHistoryRequestSchema, { productId: 'coffee' }, 'product history request');
    const handle = createHttpHandler();

    const response = await handle(new Request(`http://localhost/api/products/${request.productId}/history`));

    assert.equal(response.status, 200);
    const body = assertMatchesSchema(productHistoryResponseSchema, await json(response), 'product history response');
    assert.deepEqual(body.map((point) => point.price), [69.9, 59.9, 49.9]);
    assert.equal(body.every((point) => point.verified), true);
  });

  it('returns a 400 error envelope when the path parameter violates the Zod request contract', async () => {
    const invalidRequest = productHistoryRequestSchema.safeParse({ productId: 'bad/id' });
    assert.equal(invalidRequest.success, false);

    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/products/%E0%A4%A/history'));

    assert.equal(response.status, 400);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '400 response');
    assert.match(body.error, /URI malformed/i);
  });

  it('returns a 404 error envelope for unknown product history resources', async () => {
    const request = assertMatchesSchema(productHistoryRequestSchema, { productId: 'missing-product' }, 'missing product history request');
    const handle = createHttpHandler();

    const response = await handle(new Request(`http://localhost/api/products/${request.productId}/history`));

    assert.equal(response.status, 404);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '404 response');
    assert.match(body.error, /Product not found/i);
  });

  it('keeps 429 out of the product history contract until rate limiting applies', () => {
    const doc = buildOpenApiDocument();
    const operation = doc.paths['/api/products/{id}/history']?.get;

    assert.ok(operation, '/api/products/{id}/history should be present in OpenAPI');
    assert.equal(operation.responses?.['429'], undefined);
  });
});
