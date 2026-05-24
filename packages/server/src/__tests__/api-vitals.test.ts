import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { buildOpenApiDocument, createHttpHandler } from '../index.js';

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

const isoDateTimeSchema = z.string().datetime({ offset: true });
const idSchema = z.string().trim().min(1);
const moneyAmountSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.literal('SEK')
}).strict();

const errorResponseSchema = z.object({
  error: idSchema
}).strict();

const nutritionValueRequestSchema = z.object({
  metric: z.enum(['protein', 'calories', 'fiber']).optional()
}).strict();

const nutritionValueResponseSchema = z.object({
  metric: z.enum(['protein', 'calories', 'fiber']),
  currency: z.literal('SEK'),
  rows: z.array(z.object({
    productId: idSchema,
    name: idSchema,
    price: z.number().nonnegative(),
    nutritionPerPackage: z.object({
      proteinGrams: z.number().nonnegative(),
      calories: z.number().nonnegative(),
      fiberGrams: z.number().nonnegative(),
      sugarGrams: z.number().nonnegative(),
      saltGrams: z.number().nonnegative()
    }).strict(),
    metric: z.enum(['protein', 'calories', 'fiber']),
    valuePer10Sek: z.number().nonnegative(),
    sugarPerPackage: z.number().nonnegative(),
    saltWarning: z.boolean()
  }).strict()).min(1),
  leader: z.object({
    productId: idSchema,
    name: idSchema,
    valuePer10Sek: z.number().nonnegative(),
    saltWarning: z.boolean()
  }).strict().nullable(),
  guardrails: z.array(idSchema).min(1)
}).strict();

const fuelGradeSchema = z.enum(['95', '98', 'diesel', 'HVO100', 'E85']);
const fuelSourceSchema = z.object({
  id: idSchema,
  kind: z.enum(['operator', 'crowd']),
  name: idSchema,
  operatorName: idSchema.optional(),
  reporterId: idSchema.optional(),
  sourceUrl: z.string().url(),
  legalReviewStatus: z.enum(['approved', 'pending', 'blocked'])
}).strict();

const fuelPriceObservationSchema = z.object({
  id: idSchema,
  domain: z.literal('fuel'),
  grade: fuelGradeSchema,
  label: idSchema,
  pricePerLitre: moneyAmountSchema,
  litreBasis: z.literal(1),
  observedAt: isoDateTimeSchema,
  validFrom: isoDateTimeSchema,
  confidence: z.number().min(0).max(1),
  source: fuelSourceSchema,
  provenance: z.object({
    sourceRunId: idSchema,
    sourceUrl: z.string().url(),
    capturedAt: isoDateTimeSchema,
    parserVersion: idSchema
  }).strict()
}).strict();

const fuelPricesResponseSchema = z.object({
  domain: z.literal('fuel'),
  litreBasis: z.literal(1),
  grades: z.array(fuelGradeSchema).min(1),
  observations: z.array(fuelPriceObservationSchema).min(1),
  sources: z.array(fuelSourceSchema).min(1),
  guardrails: z.array(idSchema).min(1)
}).strict();

const productPricesRequestSchema = z.object({
  productId: idSchema
}).strict();

const productStorePriceSchema = z.object({
  storeId: idSchema,
  storeName: idSchema,
  price: z.number().nonnegative()
}).strict();

const productStorePricesResponseSchema = z.array(productStorePriceSchema).min(1);

describe('API vital contract tests', () => {
  it('validates 200 request schemas and response shapes for public vital endpoints', async () => {
    const handle = createHttpHandler();

    const nutritionRequest = assertMatchesSchema(nutritionValueRequestSchema, { metric: 'protein' }, 'nutrition request');
    const nutrition = await handle(new Request(`http://localhost/api/nutrition/value?metric=${nutritionRequest.metric}`));
    assert.equal(nutrition.status, 200);
    const nutritionBody = assertMatchesSchema(nutritionValueResponseSchema, await json(nutrition), 'nutrition response');
    assert.equal(nutritionBody.metric, 'protein');
    assert.ok(nutritionBody.leader);
    assert.equal(nutritionBody.leader.productId, nutritionBody.rows[0]?.productId);

    const fuel = await handle(new Request('http://localhost/api/fuel'));
    assert.equal(fuel.status, 200);
    const fuelBody = assertMatchesSchema(fuelPricesResponseSchema, await json(fuel), 'fuel response');
    assert.deepEqual(fuelBody.grades, fuelBody.observations.map((row) => row.grade));
    assert.ok(fuelBody.observations.every((row) => row.source.sourceUrl === row.provenance.sourceUrl));

    const productPricesRequest = assertMatchesSchema(productPricesRequestSchema, { productId: 'coffee' }, 'product prices request');
    const productPrices = await handle(new Request(`http://localhost/api/products/${productPricesRequest.productId}/prices`));
    assert.equal(productPrices.status, 200);
    const productPricesBody = assertMatchesSchema(productStorePricesResponseSchema, await json(productPrices), 'product prices response');
    assert.deepEqual(productPricesBody.map((row) => row.storeId), ['willys-odenplan', 'lidl-sveavagen', 'coop-odenplan']);
  });

  it('returns a 400 error envelope when a vital request violates its Zod contract', async () => {
    const handle = createHttpHandler();
    const invalidRequest = nutritionValueRequestSchema.safeParse({ metric: 'fat' });
    assert.equal(invalidRequest.success, false);

    const response = await handle(new Request('http://localhost/api/nutrition/value?metric=fat'));
    assert.equal(response.status, 400);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '400 response');
    assert.match(body.error, /metric must be protein, calories, or fiber/i);
  });

  it('returns a 404 error envelope when a valid vital request targets a missing resource', async () => {
    const handle = createHttpHandler();
    assertMatchesSchema(productPricesRequestSchema, { productId: 'not-in-catalog' }, 'missing product request');

    const response = await handle(new Request('http://localhost/api/products/not-in-catalog/prices'));
    assert.equal(response.status, 404);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '404 response');
    assert.match(body.error, /Product not found/i);
  });

  it('keeps 429 out of the vital contract until rate limiting is implemented', () => {
    const doc = buildOpenApiDocument();
    const vitalPaths = ['/api/nutrition/value', '/api/fuel', '/api/products/{id}/prices'] as const;

    for (const path of vitalPaths) {
      const operations = doc.paths[path];
      assert.ok(operations, `${path} should be present in OpenAPI`);
      for (const operation of Object.values(operations)) {
        assert.equal(operation?.responses?.['429'], undefined, `${path} should not document 429 before a rate limiter exists`);
      }
    }
  });
});
