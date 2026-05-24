import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

const storeIdSchema = z.string().trim().min(1).regex(/^[a-z0-9-]+$/);
const storeDetailRequestSchema = z.object({ id: storeIdSchema });

const storeSummarySchema = z.object({
  id: storeIdSchema,
  name: z.string().trim().min(1),
  chain: storeIdSchema,
  district: z.string().trim().min(1),
  address: z.string().trim().min(1),
  openingHours: z.array(z.string().trim().min(1)).min(1),
  confidence: z.enum(['high', 'medium', 'low'])
});

const storeAssortmentItemSchema = z.object({
  productId: storeIdSchema,
  productName: z.string().trim().min(1),
  category: storeIdSchema,
  price: z.number().nonnegative(),
  unitPrice: z.string().trim().min(1),
  priceLabel: z.enum(['verified_shelf', 'estimated', 'missing'])
});

const storeDetailSchema = storeSummarySchema.extend({
  store: storeSummarySchema,
  storeId: storeIdSchema,
  storeName: z.string().trim().min(1),
  assortment: z.object({
    sortedBy: z.literal('category_then_name'),
    itemCount: z.number().int().nonnegative(),
    categoryCount: z.number().int().nonnegative(),
    items: z.array(storeAssortmentItemSchema),
    categories: z.array(z.object({
      category: storeIdSchema,
      itemCount: z.number().int().nonnegative()
    }))
  }),
  guardrails: z.array(z.string().trim().min(1)).min(1)
});

const errorResponseSchema = z.object({ error: z.string().trim().min(1) });

describe('stores API contract', () => {
  it('validates the store detail request path parameter schema', () => {
    assert.deepEqual(storeDetailRequestSchema.parse({ id: 'willys-odenplan' }), { id: 'willys-odenplan' });
    assert.equal(storeDetailRequestSchema.safeParse({ id: '' }).success, false);
    assert.equal(storeDetailRequestSchema.safeParse({ id: 'Willys Odenplan' }).success, false);
    assert.equal(storeDetailRequestSchema.safeParse({ id: '../willys-odenplan' }).success, false);
  });

  it('returns a typed 200 store list response', async () => {
    const handle = createHttpHandler();

    const response = await handle(new Request('http://localhost/api/stores'));

    assert.equal(response.status, 200);
    const stores = z.array(storeSummarySchema).min(1).parse(await json(response));
    assert.deepEqual(stores.map((store) => store.id), ['willys-odenplan', 'lidl-sveavagen', 'coop-odenplan']);
    assert.deepEqual(stores[0], {
      id: 'willys-odenplan',
      name: 'Willys Odenplan',
      chain: 'willys',
      district: 'Odenplan',
      address: 'Odenplan, Stockholm',
      openingHours: ['Mon-Fri 08:00-22:00', 'Sat-Sun 09:00-21:00'],
      confidence: 'high'
    });
  });

  it('returns a typed 200 store detail response', async () => {
    const handle = createHttpHandler();
    const request = storeDetailRequestSchema.parse({ id: 'willys-odenplan' });

    const response = await handle(new Request(`http://localhost/api/stores/${request.id}`));

    assert.equal(response.status, 200);
    const detail = storeDetailSchema.parse(await json(response));
    assert.equal(detail.id, 'willys-odenplan');
    assert.equal(detail.storeId, 'willys-odenplan');
    assert.equal(detail.storeName, 'Willys Odenplan');
    assert.deepEqual(detail.store, {
      id: 'willys-odenplan',
      name: 'Willys Odenplan',
      chain: 'willys',
      district: 'Odenplan',
      address: 'Odenplan, Stockholm',
      openingHours: ['Mon-Fri 08:00-22:00', 'Sat-Sun 09:00-21:00'],
      confidence: 'high'
    });
    assert.equal(detail.assortment.sortedBy, 'category_then_name');
    assert.deepEqual(detail.assortment.items.map((item) => [item.category, item.productId, item.priceLabel]), [
      ['coffee', 'coffee', 'verified_shelf'],
      ['dairy', 'milk', 'verified_shelf'],
      ['dairy', 'butter', 'verified_shelf'],
      ['dairy', 'private-label-milk', 'verified_shelf']
    ]);
    assert.match(detail.guardrails[0] ?? '', /verified shelf price rows/i);
  });

  it('returns a typed 400 error for malformed store paths', async () => {
    const handle = createHttpHandler();

    const response = await handle(new Request('http://localhost/api/stores/%E0%A4%A'));

    assert.equal(response.status, 400);
    assert.match(errorResponseSchema.parse(await json(response)).error, /URI malformed|malformed/i);
  });

  it('returns a typed 404 error for syntactically valid missing stores', async () => {
    const handle = createHttpHandler();
    const request = storeDetailRequestSchema.parse({ id: 'missing-store' });

    const response = await handle(new Request(`http://localhost/api/stores/${request.id}`));

    assert.equal(response.status, 404);
    assert.deepEqual(errorResponseSchema.parse(await json(response)), { error: 'Store not found.' });
  });
});
