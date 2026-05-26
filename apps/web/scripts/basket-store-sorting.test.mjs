import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { basketCostWinner, sortStoresByTotalBasketCost } from '../src/lib/basketOptimizer.ts';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('compare basket store sorting', () => {
  it('sorts stores by total basket cost before coverage gaps and highlights the winner', () => {
    const stores = sortStoresByTotalBasketCost([
      { storeName: 'Best coverage', total: 101, missingCount: 0 },
      { storeName: 'Cheapest partial', total: 72, missingCount: 1 },
      { storeName: 'No prices', total: null, missingCount: 0 },
      { storeName: 'Second cheapest', total: 80, missingCount: 0 }
    ]);

    assert.deepEqual(stores.map((store) => store.storeName), [
      'Cheapest partial',
      'Second cheapest',
      'Best coverage',
      'No prices'
    ]);
    assert.equal(basketCostWinner(stores)?.storeName, 'Cheapest partial');
  });

  it('wires the total-cost sort into compare page stores and API route metadata', async () => {
    const comparePage = await read('src/app/compare/page.tsx');
    const chainCompare = await read('src/lib/chain-compare.ts');
    const compareRoutes = await read('../../apps/api/src/routes/compare.ts');

    assert.match(chainCompare, /sortStoresByTotalBasketCost/);
    assert.match(chainCompare, /basketCostWinner/);
    assert.match(chainCompare, /ranked first by total basket cost/);
    assert.match(comparePage, /sorted by the total cost of the current shopping list/);
    assert.match(comparePage, /highlighted as Cheapest/);
    assert.match(compareRoutes, /basketStoreSort: 'total_basket_cost'/);
    assert.match(compareRoutes, /basketWinnerHighlight: 'Cheapest'/);
  });
});
