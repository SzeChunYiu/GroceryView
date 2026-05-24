import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('basket calculator component split', () => {
  it('BasketRow renders a mock product row with checkbox state, image fallback, and price chips', async () => {
    const row = await read('src/components/basket-row.tsx');

    assert.match(row, /export function BasketRow/);
    assert.match(row, /checked: boolean/);
    assert.match(row, /onToggle: \(productId: string\) => void/);
    assert.match(row, /product: BasketCalculatorProduct/);
    assert.match(row, /type="checkbox"/);
    assert.match(row, /checked=\{checked\}/);
    assert.match(row, /onToggle\(product\.id\)/);
    assert.match(row, /product\.prices\.map/);
    assert.match(row, /formatSek\(price\.price\)/);
    assert.match(row, /Brand not reported/);
    assert.match(row, /No img/);
  });

  it('BasketActions renders mock product actions by composing BasketRow without owning totals logic', async () => {
    const actions = await read('src/components/basket-actions.tsx');

    assert.match(actions, /export function BasketActions/);
    assert.match(actions, /products: BasketCalculatorProduct\[\]/);
    assert.match(actions, /selectedProductIds: Set<string>/);
    assert.match(actions, /selectedProductCount: number/);
    assert.match(actions, /onToggleProduct: \(productId: string\) => void/);
    assert.match(actions, /Build a basket from current chain rows/);
    assert.match(actions, /\{selectedProductCount\} selected/);
    assert.match(actions, /products\.map\(\(product\) => \(/);
    assert.match(actions, /<BasketRow/);
    assert.match(actions, /selectedProductIds\.has\(product\.id\)/);
    assert.match(actions, /onToggle=\{onToggleProduct\}/);
  });

  it('BasketTotals renders mock basket totals, split assignments, and missing coverage copy', async () => {
    const totals = await read('src/components/basket-totals.tsx');

    assert.match(totals, /export function BasketTotals/);
    assert.match(totals, /bestFullChain/);
    assert.match(totals, /chainTotals/);
    assert.match(totals, /assignments/);
    assert.match(totals, /Best full-chain total/);
    assert.match(totals, /Cheapest split basket/);
    assert.match(totals, /Chain totals and missing rows/);
    assert.match(totals, /href=\{`\/products\/\$\{assignment\.productSlug \?\? assignment\.productId\}`\}/);
    assert.match(totals, /Full selected-basket coverage/);
    assert.match(totals, /selected product\$\{chain\.missingCount === 1 \? '' : 's'\} missing/);
    assert.match(totals, /Source: \{sourceLabel\}/);
  });

  it('BasketCalculator keeps state and comparison logic while delegating rows, actions, and totals', async () => {
    const calculator = await read('src/components/basket-calculator.tsx');

    assert.match(calculator, /import \{ BasketActions \} from '\.\/basket-actions'/);
    assert.match(calculator, /import \{ BasketTotals \} from '\.\/basket-totals'/);
    assert.match(calculator, /useState\(\(\) => initialBasketIds\(products\)\)/);
    assert.match(calculator, /compareBasketStrategies\(basketInput\)/);
    assert.match(calculator, /summarizeStoreBasketCoverage\(basketInput\)/);
    assert.match(calculator, /function toggleProduct\(productId: string\)/);
    assert.match(calculator, /<BasketActions/);
    assert.match(calculator, /<BasketTotals/);
    assert.doesNotMatch(calculator, /<input\s+checked=/);
    assert.doesNotMatch(calculator, /Best full-chain total/);
  });
});
