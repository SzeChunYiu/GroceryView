import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { buildOpenApiDocument, createHttpHandler, type PriceDropsProviderQuery } from '../src/index.js';

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

const isoTimestampSchema = z.string().datetime();

const priceDropsRequestSchema = z.object({
  since: isoTimestampSchema.optional(),
  until: isoTimestampSchema.optional(),
  limit: z.coerce.number().int().min(1).max(10).optional()
}).strict();

const priceDropItemSchema = z.object({
  rank: z.number().int().positive(),
  productId: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  brand: z.string().trim().min(1).optional(),
  chainSlug: z.string().trim().min(1),
  chainName: z.string().trim().min(1),
  storeSlug: z.string().trim().min(1).optional(),
  storeName: z.string().trim().min(1).optional(),
  priceType: z.enum(['online', 'shelf', 'promotion', 'member', 'estimated']),
  price: z.number().nonnegative(),
  regularPrice: z.number().positive(),
  savingsAmount: z.number().positive(),
  dropPercent: z.number().positive(),
  currency: z.string().trim().min(1),
  observedAt: isoTimestampSchema,
  confidence: z.number().min(0).max(1),
  emailSubject: z.string().trim().min(1),
  emailPreview: z.string().trim().min(1)
}).strict();

const priceDropsResponseSchema = z.object({
  window: z.object({
    since: isoTimestampSchema,
    until: isoTimestampSchema
  }).strict(),
  count: z.number().int().nonnegative(),
  items: z.array(priceDropItemSchema),
  guardrails: z.array(z.string().trim().min(1)).min(1)
}).strict();

const errorResponseSchema = z.object({
  error: z.string().trim().min(1)
}).strict();

describe('price-drops API contract', () => {
  it('validates the request Zod schema and 200 response shape', async () => {
    const request = assertMatchesSchema(priceDropsRequestSchema, {
      since: '2026-05-18T00:00:00.000Z',
      until: '2026-05-25T00:00:00.000Z',
      limit: '2'
    }, 'price-drops request');
    const receivedQueries: PriceDropsProviderQuery[] = [];
    const handle = createHttpHandler(undefined, {
      priceDropsProvider: async (query) => {
        receivedQueries.push(query);
        return [
          {
            rank: 1,
            productId: 'product-1',
            productSlug: 'bryggkaffe-450g',
            productName: 'Bryggkaffe mellanrost 450 g',
            brand: 'Rosteriet',
            chainSlug: 'willys',
            chainName: 'Willys',
            storeSlug: 'willys-hemma-stockholm-torsplan',
            storeName: 'Willys Hemma Stockholm Torsplan',
            priceType: 'promotion',
            price: 44.9,
            regularPrice: 59.9,
            savingsAmount: 15,
            dropPercent: 25.04,
            currency: 'SEK',
            observedAt: '2026-05-22T09:00:00.000Z',
            confidence: 0.88,
            emailSubject: '25% drop: Bryggkaffe mellanrost 450 g at Willys',
            emailPreview: 'Now SEK 44.90, down from SEK 59.90. Save SEK 15.00 at Willys Hemma Stockholm Torsplan.'
          }
        ];
      }
    });

    const response = await handle(new Request(`http://localhost/api/price-drops?since=${request.since}&until=${request.until}&limit=${request.limit}`));

    assert.equal(response.status, 200);
    assert.deepEqual(receivedQueries, [{ since: request.since, until: request.until, limit: 2 }]);
    const body = assertMatchesSchema(priceDropsResponseSchema, await json(response), 'price-drops response');
    assert.equal(body.count, 1);
    assert.equal(body.items[0]?.productSlug, 'bryggkaffe-450g');
    assert.match(body.guardrails[0] ?? '', /persisted latest_prices/i);
  });

  it('returns a 400 error envelope when query parameters violate the Zod request contract', async () => {
    const invalidRequest = priceDropsRequestSchema.safeParse({ since: 'yesterday', limit: 99 });
    assert.equal(invalidRequest.success, false);

    const handle = createHttpHandler(undefined, { priceDropsProvider: async () => [] });
    const response = await handle(new Request('http://localhost/api/price-drops?since=yesterday&limit=99'));

    assert.equal(response.status, 400);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '400 response');
    assert.match(body.error, /Invalid price-drops query/i);
  });

  it('returns a 404 error envelope for unsupported price-drops resources', async () => {
    const handle = createHttpHandler(undefined, { priceDropsProvider: async () => [] });
    const response = await handle(new Request('http://localhost/api/price-drops/missing-product'));

    assert.equal(response.status, 404);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '404 response');
    assert.match(body.error, /Not found/i);
  });

  it('keeps 429 out of the price-drops contract until rate limiting applies', () => {
    const doc = buildOpenApiDocument();
    const operation = doc.paths['/api/price-drops']?.get;

    assert.ok(operation, '/api/price-drops should be present in OpenAPI');
    assert.equal(operation.responses?.['429'], undefined);
  });
});
