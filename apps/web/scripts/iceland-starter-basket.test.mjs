import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('Iceland starter basket defines Reykjavik 80-staple parity without price claims', async () => {
  const basket = await read('src/lib/iceland-starter-basket.ts');
  const page = await read('src/app/iceland/starter-basket/page.tsx');

  assert.match(basket, /buildIcelandStarterBasketReadiness/);
  assert.match(basket, /80-staple parity target/);
  assert.match(basket, /Reykjavik starter basket/);
  assert.match(basket, /blocked_until_live_reykjavik_prices/);
  assert.match(basket, /livePriceObservationCount: 0/);
  assert.match(basket, /preview taxonomy only; no Iceland prices are claimed/);
  assert.match(basket, /Bonus/);
  assert.match(basket, /Kronan/);
  assert.match(basket, /Netto/);
  assert.match(basket, /Hagkaup/);
  assert.match(page, /noIndex: true/);
  assert.match(page, /no prices/);
  assert.match(page, /readiness\.itemCount/);

  const itemNameCount = [...basket.matchAll(/'[^']+',/g)]
    .filter((match) => !match[0].includes('is-reykjavik') && !match[0].includes('awaiting_live'))
    .length;
  assert.ok(itemNameCount >= 80);
});

