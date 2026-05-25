import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const loader = new URL('../src/lib/account-receipt-spend-forecast.ts', import.meta.url);
const route = new URL('../src/app/api/savings-dashboard/spend-forecast/route.ts', import.meta.url);
const page = new URL('../src/app/savings-dashboard/page.tsx', import.meta.url);
const contracts = new URL('../../../packages/api-contracts/src/index.ts', import.meta.url);

test('account receipt spend loader forecasts from signed-in receipt rows only', async () => {
  const source = await readFile(loader, 'utf8');

  assert.match(source, /export function forecastGrocerySpend/);
  assert.match(source, /sourceTable: 'receipt_uploads' \| 'purchase_history'/);
  assert.match(source, /rows\.filter\(\(row\) => row\.userId === userId\)/);
  assert.match(source, /No signed-in receipt_uploads or purchase_history rows/);
  assert.match(source, /No demo purchaseHistory, sample receipts, or estimated cash trips/);
  assert.match(source, /endpoint: '\/api\/savings-dashboard\/spend-forecast'/);
});

test('spend forecast API is protected and uses the account receipt loader', async () => {
  const source = await readFile(route, 'utf8');

  assert.match(source, /authorization/);
  assert.match(source, /Bearer\\s\+/);
  assert.match(source, /status: 401/);
  assert.match(source, /loadAccountReceiptSpendForecast\(\{ userId \}\)/);
  assert.doesNotMatch(source, /searchParams\.get\('userId'\)/);
});

test('api contracts publish the protected receipt forecast response schema', async () => {
  const source = await readFile(contracts, 'utf8');

  assert.match(source, /accountReceiptSpendRowSchema/);
  assert.match(source, /accountReceiptSpendForecastResponseSchema/);
  assert.match(source, /sourceTable: z\.enum\(\['receipt_uploads', 'purchase_history'\]\)/);
  assert.match(source, /endpoint: z\.literal\('\/api\/savings-dashboard\/spend-forecast'\)/);
  assert.match(source, /accountReceiptSpendForecastResponse: accountReceiptSpendForecastResponseSchema/);
});

test('savings dashboard uses protected spend forecast state instead of demo purchase history', async () => {
  const source = await readFile(page, 'utf8');

  assert.match(source, /loadAccountReceiptSpendForecast/);
  assert.match(source, /const accountSpendForecast = loadAccountReceiptSpendForecast\(\{ userId: null \}\)/);
  assert.match(source, /Signed-in receipt spend forecast/);
  assert.match(source, /receipt_uploads or purchase_history rows/);
  assert.match(source, /demo purchaseHistory rows are no longer used/);
  assert.doesNotMatch(source, /savingsDashboard/);
});
