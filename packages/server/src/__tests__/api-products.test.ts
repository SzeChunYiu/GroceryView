import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('products API contract', () => {
  it('returns a cursor-paginated products response shape', async () => {
    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/products?limit=2'));

    assert.equal(response.status, 200);
    const body = await json(response) as {
      items: Array<{ id?: string; slug?: string; name?: string }>;
      pagination: { limit: number; nextCursor: string | null; totalReturned: number; totalProductCount: number };
      guardrails: string[];
    };

    assert.equal(body.pagination.limit, 2);
    assert.equal(body.pagination.totalReturned, body.items.length);
    assert.ok(body.pagination.totalProductCount >= body.items.length);
    assert.ok(Array.isArray(body.guardrails));
    assert.ok(body.items.length > 0);
    assert.equal(typeof body.items[0]?.name, 'string');
  });

  it('returns a product detail response shape for a listed product', async () => {
    const handle = createHttpHandler();
    const list = await handle(new Request('http://localhost/api/products?limit=1'));
    const listed = await json(list) as { items: Array<{ id?: string; slug?: string; name?: string }> };
    const id = listed.items[0]?.id ?? listed.items[0]?.slug;
    assert.ok(id);

    const response = await handle(new Request(`http://localhost/api/products/${encodeURIComponent(id)}`));
    assert.equal(response.status, 200);
    const product = await json(response) as { id?: string; slug?: string; name?: string };
    assert.equal(product.id ?? product.slug, id);
    assert.equal(typeof product.name, 'string');
  });

  it('rejects invalid products query schema with 400', async () => {
    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/products?limit=abc'));

    assert.equal(response.status, 400);
    const body = await json(response) as { error?: string };
    assert.match(body.error ?? '', /limit must be a positive integer/i);
  });

  it('returns 404 for missing product details', async () => {
    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/products/not-a-real-product'));

    assert.equal(response.status, 404);
    const body = await json(response) as { error?: string };
    assert.match(body.error ?? '', /Product not found/i);
  });
});
