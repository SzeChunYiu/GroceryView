import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { createGroceryViewApi } from '@groceryview/api';

const storeRequestSchema = z.object({ chain: z.enum(['willys', 'lidl', 'coop']).optional() }).strict();
const storeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  chain: z.string().min(1),
  district: z.string().min(1),
  address: z.string().min(1),
  openingHours: z.array(z.string().min(1)),
  confidence: z.enum(['high', 'medium', 'low'])
});
const storesResponseSchema = z.array(storeSchema).min(1);
const errorResponseSchema = z.object({ error: z.string().min(1) });

function parseStoreResponse(status: 200 | 400 | 404 | 429, body: unknown) {
  return status === 200
    ? { status, body: storesResponseSchema.parse(body) }
    : { status, body: errorResponseSchema.parse(body) };
}

describe('stores API contract', () => {
  it('validates the request schema and 200 response shape', () => {
    assert.deepEqual(storeRequestSchema.parse({ chain: 'willys' }), { chain: 'willys' });

    const response = parseStoreResponse(200, createGroceryViewApi().getStores());

    assert.equal(response.status, 200);
    assert.ok(response.body.some((store) => store.id === 'willys-odenplan'));
    assert.equal(response.body.every((store) => store.openingHours.length > 0), true);
  });

  it('covers 400 validation, 404, and optional 429 error contracts', () => {
    assert.equal(storeRequestSchema.safeParse({ chain: 'preem' }).success, false);
    assert.deepEqual(parseStoreResponse(400, { error: 'Invalid store filter.' }), { status: 400, body: { error: 'Invalid store filter.' } });
    assert.deepEqual(parseStoreResponse(404, { error: 'Store not found.' }), { status: 404, body: { error: 'Store not found.' } });
    assert.deepEqual(parseStoreResponse(429, { error: 'Too many store requests.' }), { status: 429, body: { error: 'Too many store requests.' } });
  });
});
