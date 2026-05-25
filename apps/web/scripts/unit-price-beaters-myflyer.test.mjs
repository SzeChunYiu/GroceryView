import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repoRoot = new URL('../../../', import.meta.url);
const read = (relative) => readFile(new URL(relative, repoRoot), 'utf8');

test('unit-price beaters are exported through core api and surfaced on deals', async () => {
  const core = await read('packages/core/src/index.ts');
  const api = await read('packages/api/src/index.ts');
  const deals = await read('apps/web/src/app/deals/page.tsx');

  assert.match(core, /rankers\/unitPriceBeaters/);
  assert.match(api, /rankUnitPriceBeaters/);
  assert.match(api, /unitPriceBeaters: RankedUnitPriceBeaterPromo\[\]/);
  assert.match(api, /effectiveKrPerKg: offer\.effectiveUnitPrice/);
  assert.match(api, /krPerKg: comparableUnitPrice\(product, point\.price\)/);
  assert.match(api, /medianWindowDays: 30/);
  assert.match(api, /minimumBeatPercent: 2/);

  assert.match(deals, /data-unit-price-beater-deals/);
  assert.match(deals, /unit=beaters/);
  assert.match(deals, /flyerOfferReport\.unitPriceBeaters/);
  assert.match(deals, /Checkout and alert behavior is unchanged/);
});
