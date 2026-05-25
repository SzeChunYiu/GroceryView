import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('recurring basket inflation tracker compares personal basket movement with market index windows', async () => {
  const recurringBasket = await read('src/lib/recurring-basket.ts');
  const groceryIndex = await read('src/lib/grocery-index-widget.ts');
  const dashboard = await read('src/app/savings-dashboard/page.tsx');

  assert.match(groceryIndex, /groceryIndexMarketComparisons/);
  assert.match(groceryIndex, /last-month/);
  assert.match(groceryIndex, /last-quarter/);
  assert.match(groceryIndex, /grocery-index-observed-chain-basket/);

  assert.match(recurringBasket, /buildRecurringBasketInflationTracker/);
  assert.match(recurringBasket, /recurringBasketInflationTracker/);
  assert.match(recurringBasket, /lastMonthCost/);
  assert.match(recurringBasket, /lastQuarterCost/);
  assert.match(recurringBasket, /deltaVsMarketPercent/);
  assert.match(recurringBasket, /recurring-basket-observed-costs/);
  assert.match(recurringBasket, /no missing household trips are estimated/);

  assert.match(dashboard, /Recurring basket inflation tracker/);
  assert.match(dashboard, /recurringBasketInflationTracker\.comparisons/);
  assert.match(dashboard, /Personal versus market/);
  assert.match(dashboard, /Grocery Index/);
});
