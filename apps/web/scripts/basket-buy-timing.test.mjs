import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const priceIntelligence = new URL('../src/lib/price-intelligence.ts', import.meta.url);
const component = new URL('../src/components/basket-buy-timing.tsx', import.meta.url);
const route = new URL('../src/app/basket/page.tsx', import.meta.url);

test('price intelligence classifies basket lines as buy now watch or substitute', async () => {
  const source = await readFile(priceIntelligence, 'utf8');

  assert.match(source, /export type BasketBuyTimingAction = 'buy_now' \| 'watch' \| 'substitute'/);
  assert.match(source, /export type BasketBuyTimingRecommendation/);
  assert.match(source, /export function assessBasketBuyTiming/);
  assert.match(source, /substituteDelta !== null && substituteDelta <= -8/);
  assert.match(source, /action: 'substitute'/);
  assert.match(source, /previousDelta !== null && previousDelta <= -5/);
  assert.match(source, /action: 'buy_now'/);
  assert.match(source, /action: 'watch'/);
  assert.match(source, /export function summarizeBasketBuyTiming/);
});

test('basket timing component renders whole-trip guidance without mutating the basket', async () => {
  const source = await readFile(component, 'utf8');

  assert.match(source, /BasketBuyTiming/);
  assert.match(source, /summarizeBasketBuyTiming/);
  assert.match(source, /Whole-trip timing recommendations/);
  assert.match(source, /buy now/);
  assert.match(source, /watch/);
  assert.match(source, /substitute/);
  assert.match(source, /data-buy-timing-action=\{item\.action\}/);
  assert.match(source, /does not auto-rewrite the basket/);
  assert.match(source, /Suggested substitute/);
});

test('basket route builds timing recommendations from verified chain rows', async () => {
  const source = await readFile(route, 'utf8');

  assert.match(source, /import \{ BasketBuyTiming \} from '@\/components\/basket-buy-timing';/);
  assert.match(source, /assessBasketBuyTiming/);
  assert.match(source, /const basketBuyTimingRecommendations = topChainSpreads\.slice\(0, 12\)\.map/);
  assert.match(source, /chainPriceRows\(product\)\.sort/);
  assert.match(source, /typicalPrice: averagePrice/);
  assert.match(source, /previousPrice: highest\.price/);
  assert.match(source, /substituteProduct/);
  assert.match(source, /<BasketBuyTiming recommendations=\{basketBuyTimingRecommendations\} \/>/);
  assert.doesNotMatch(source, /@\/lib\/demo-data|@\/components\/sample-data/);
});
