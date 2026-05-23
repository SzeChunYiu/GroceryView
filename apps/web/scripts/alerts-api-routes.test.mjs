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

describe('price history CSV export API route', () => {
  it('ships a DB-backed CSV export for all observations of a validated product id', async () => {
    const route = await read('src/app/api/export/prices/route.ts');

    assert.match(route, /export async function GET\(request: Request\)/);
    assert.match(route, /searchParams\.get\('product_id'\)/);
    assert.match(route, /isValidProductId/);
    assert.match(route, /createPostgresPriceReader/);
    assert.match(route, /listPriceObservationHistory\(\{\s*productId,\s*limit: 1000\s*\}\)/s);
    assert.match(route, /Content-Disposition/);
    assert.match(route, /attachment; filename="price-history-\$\{productId\}\.csv"/);
    assert.match(route, /text\/csv; charset=utf-8/);
    assert.match(route, /csvCell/);
    assert.match(route, /formulaInjectionPrefixPattern/);
    assert.match(route, /DATABASE_URL/);
    assert.match(route, /export_database_unconfigured/);
    assert.match(route, /product_id must be a UUID/);
  });
});
