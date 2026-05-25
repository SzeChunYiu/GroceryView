import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('store price matrix supports regular member coupon and stacked comparison modes', async () => {
  const chainCompare = await read('src/lib/chain-compare.ts');
  const matrix = await read('src/components/store-price-matrix.tsx');
  const actions = await read('src/components/coupon-loyalty-actions.tsx');

  assert.match(chainCompare, /ChainPriceComparisonMode = 'regular' \| 'member' \| 'coupon' \| 'stacked'/);
  assert.match(chainCompare, /CHAIN_PRICE_COMPARISON_MODES/);
  assert.match(chainCompare, /priceModes: ChainPriceModeQuote\[\]/);
  assert.match(chainCompare, /account_required/);
  assert.match(chainCompare, /Needs member \+ coupon evidence/);

  assert.match(matrix, /'use client'/);
  assert.match(matrix, /comparisonMode/);
  assert.match(matrix, /aria-label="Chain price comparison mode"/);
  assert.match(matrix, /chainPriceMatrixModes/);
  assert.match(matrix, /selectedQuote/);
  assert.match(matrix, /account_required/);

  assert.match(actions, /regular', 'member', 'coupon', 'stacked/);
  assert.match(actions, /Price matrix comparison modes/);
  assert.match(actions, /account-bound loyalty offers/);
  assert.match(actions, /No anonymous coupon offers/);
});
