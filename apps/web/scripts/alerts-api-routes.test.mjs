import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('price alert API routes', () => {
  it('ships create, list, and delete handlers backed by the shared price alert store', async () => {
    const listCreateRoute = await read('src/app/api/alerts/route.ts');
    const deleteRoute = await read('src/app/api/alerts/[id]/route.ts');
    const store = await read('src/app/api/alerts/store.ts');

    assert.match(listCreateRoute, /export function GET/);
    assert.match(listCreateRoute, /export async function POST/);
    assert.match(listCreateRoute, /listPriceAlerts/);
    assert.match(listCreateRoute, /createPriceAlert/);
    assert.match(listCreateRoute, /searchParams\.get\('userEmail'\)/);
    assert.match(deleteRoute, /export async function DELETE/);
    assert.match(deleteRoute, /deletePriceAlert/);
    assert.match(deleteRoute, /searchParams\.get\('userEmail'\)/);
    assert.match(store, /type PriceAlert =/);
    assert.match(store, /userEmail: string/);
    assert.match(store, /productId: string/);
    assert.match(store, /targetPrice: number/);
    assert.match(store, /crypto\.randomUUID\(\)/);
    assert.match(store, /targetPrice must be a non-negative number/);
    assert.match(store, /alert\.userEmail !== normalizeEmail\(userEmail\)/);
  });
});
