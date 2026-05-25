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

const idSchema = z.string().trim().min(1).regex(/^[a-z0-9-]+$/);

const productRequestSchema = z.object({
  productId: idSchema
}).strict();

const productStorePriceSchema = z.object({
  storeId: idSchema,
  storeName: z.string().trim().min(1),
  price: z.number().nonnegative()
}).strict();

const productHistoryPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().positive(),
  verified: z.boolean()
}).strict();

const productDealSignalsSchema = z.object({
  currentCityPercentile: z.number().min(0).max(100),
  knownPromoHistoryPercentile: z.number().min(0).max(100),
  equivalentUnitPricePercentile: z.number().min(0).max(100),
  discountDepthPercent: z.number().min(0),
  sourceConfidence: z.number().min(0).max(1)
}).strict();

const productResponseSchema = z.object({
  id: idSchema,
  ticker: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: idSchema,
  brandTier: z.enum(['national', 'premium', 'standard_private_label', 'budget_private_label', 'organic_private_label', 'discount_chain_label']),
  availableChains: z.array(idSchema).min(1),
  currentPrices: z.array(productStorePriceSchema).min(1),
  dealScore: z.number().min(0).max(100),
  verdict: z.string().trim().min(1),
  unitPrice: z.string().trim().min(1),
  history: z.array(productHistoryPointSchema).min(1),
  dealSignals: productDealSignalsSchema
}).strict();

const errorResponseSchema = z.object({
  error: z.string().trim().min(1)
}).strict();

describe('products API contract', () => {
  it('validates the 200 request schema and response shape', async () => {
    const request = assertMatchesSchema(productRequestSchema, { productId: 'coffee' }, 'product request');
    const handle = createHttpHandler();

    const response = await handle(new Request(`http://localhost/api/products/${request.productId}`));

    assert.equal(response.status, 200);
    const body = assertMatchesSchema(productResponseSchema, await json(response), 'product response');
    assert.equal(body.id, 'coffee');
    assert.equal(body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.deepEqual(body.currentPrices.map((price) => price.storeId), ['willys-odenplan', 'lidl-sveavagen', 'coop-odenplan']);
  });

  it('returns a 400 error envelope when the path parameter violates the Zod request contract', async () => {
    const invalidRequest = productRequestSchema.safeParse({ productId: 'bad/id' });
    assert.equal(invalidRequest.success, false);

    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/products/%E0%A4%A'));

    assert.equal(response.status, 400);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '400 response');
    assert.match(body.error, /URI malformed/i);
  });

  it('returns a 404 error envelope for unknown product resources', async () => {
    const request = assertMatchesSchema(productRequestSchema, { productId: 'missing-product' }, 'missing product request');
    const handle = createHttpHandler();

    const response = await handle(new Request(`http://localhost/api/products/${request.productId}`));

    assert.equal(response.status, 404);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '404 response');
    assert.match(body.error, /Product not found/i);
  });

  it('keeps 429 out of the products contract until rate limiting applies', () => {
    const doc = buildOpenApiDocument();
    const operation = doc.paths['/api/products/{id}']?.get;

    assert.ok(operation, '/api/products/{id} should be present in OpenAPI');
    assert.equal(operation.responses?.['429'], undefined);
  });
});
