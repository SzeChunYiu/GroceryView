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

    assert.match(listCreateRoute, /export async function GET/);
    assert.match(listCreateRoute, /export async function POST/);
    assert.match(listCreateRoute, /export const runtime = 'nodejs'/);
    assert.match(listCreateRoute, /await listPriceAlerts/);
    assert.match(listCreateRoute, /await createPriceAlert/);
    assert.match(listCreateRoute, /searchParams\.get\('userEmail'\)/);
    assert.match(deleteRoute, /export async function DELETE/);
    assert.match(deleteRoute, /export const runtime = 'nodejs'/);
    assert.match(deleteRoute, /await deletePriceAlert/);
    assert.match(deleteRoute, /searchParams\.get\('userEmail'\)/);
    assert.match(store, /type PriceAlert =/);
    assert.match(store, /userEmail: string/);
    assert.match(store, /productId: string/);
    assert.match(store, /targetPrice: number/);
    assert.match(store, /process\.env\.DATABASE_URL/);
    assert.match(store, /new pg\.Pool/);
    assert.match(store, /from price_alerts/);
    assert.match(store, /insert into price_alerts/);
    assert.match(store, /delete from price_alerts/);
    assert.match(store, /crypto\.randomUUID\(\)/);
    assert.match(store, /targetPrice must be a non-negative number/);
    assert.match(store, /alert\.userEmail !== normalizedEmail/);
  });
});
