import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('Iceland preview separates tourist and resident grocery modes without live price claims', async () => {
  const basket = await read('src/lib/iceland-starter-basket.ts');
  const page = await read('src/app/iceland/starter-basket/page.tsx');

  assert.match(basket, /buildIcelandTouristResidentModes/);
  assert.match(basket, /tourist-road-trip/);
  assert.match(basket, /resident-household/);
  assert.match(basket, /map-first discovery/);
  assert.match(basket, /opening-hours caveats/);
  assert.match(basket, /saved basket history/);
  assert.match(basket, /price alerts/);
  assert.match(basket, /local chain comparison/);
  assert.match(basket, /preview_no_live_isk_prices/);
  assert.match(basket, /no live ISK prices, personal location, basket history, or alert delivery is claimed/);

  assert.match(page, /data-iceland-tourist-resident-modes/);
  assert.match(page, /data-iceland-persona-mode/);
  assert.match(page, /Tourist mode is map-first/);
  assert.match(page, /Resident mode is basket-history and alert-first/);
  assert.match(page, /preview no live ISK prices/);
});
