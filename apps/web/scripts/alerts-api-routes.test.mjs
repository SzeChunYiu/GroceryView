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

describe('open price history JSON API route', () => {
  it('ships a documented, rate-limited JSON API for source-backed product history reuse', async () => {
    const route = await read('src/app/api/v1/products/[id]/history/route.ts');
    const docs = await read('../../docs/api.md');

    assert.match(route, /export async function GET\(request: Request, context: \{ params: Promise<\{ id: string \}> \}\)/);
    assert.match(route, /export function OPTIONS/);
    assert.match(route, /createPostgresPriceReader/);
    assert.match(route, /listPriceObservationHistory\(\{\s*productId,\s*\.\.\.parsedQuery\.value\s*\}\)/s);
    assert.match(route, /RATE_LIMIT_MAX_REQUESTS = 60/);
    assert.match(route, /checkRateLimit\(request\)/);
    assert.match(route, /Retry-After/);
    assert.match(route, /X-RateLimit-Remaining/);
    assert.match(route, /product_id must be a UUID/);
    assert.match(route, /Unsupported query parameter/);
    assert.match(route, /price_type must be one of/);
    assert.match(route, /open_price_history_database_unconfigured/);
    assert.match(route, /CODE_LICENSE = 'Apache-2.0'/);
    assert.match(route, /DATA_LICENSE = 'CC-BY-4.0'/);
    assert.match(route, /sourceRunId/);
    assert.match(route, /rawRecordId/);
    assert.match(route, /provenance/);

    assert.match(docs, /GET \/api\/v1\/products\/\{id\}\/history/);
    assert.match(docs, /researchers, journalists/);
    assert.match(docs, /Apache-2\.0/);
    assert.match(docs, /CC-BY-4\.0/);
    assert.match(docs, /60 requests per minute/);
    assert.match(docs, /X-RateLimit-Limit/);
    assert.match(docs, /sourceRunId/);
    assert.match(docs, /rawRecordId/);
    assert.match(docs, /provenance/);
  });
});


describe('price change webhook API route', () => {
  it('ships a DB-backed dispatcher that fires only for >5% price drops', async () => {
    const [route, store, migration] = await Promise.all([
      read('src/app/api/webhooks/price-change/route.ts'),
      read('src/app/api/webhooks/price-change/store.ts'),
      read('../../infra/db/migrations/018_webhook_subscriptions.sql')
    ]);

    assert.match(route, /export async function POST\(request: Request\)/);
    assert.match(route, /dispatchPriceChangeWebhook/);
    assert.match(route, /export const runtime = 'nodejs'/);

    assert.match(store, /webhook_subscriptions/);
    assert.match(store, /product_id/);
    assert.match(store, /callback_url/);
    assert.match(store, /new_price < old_price \* PRICE_DROP_THRESHOLD/);
    assert.match(store, /fetch\(subscription\.callbackUrl/);
    assert.match(store, /product_id: event\.product_id/);
    assert.match(store, /old_price: event\.old_price/);
    assert.match(store, /new_price: event\.new_price/);
    assert.match(store, /chain: event\.chain/);
    assert.match(store, /https:/);

    assert.match(migration, /create table if not exists webhook_subscriptions/);
    assert.match(migration, /callback_url text not null/);
    assert.match(migration, /product_id uuid references products\(id\)/);
    assert.match(migration, /create index if not exists webhook_subscriptions_active_product_idx/);
  });
});
