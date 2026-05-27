import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('home page exposes a week-over-week price-drop discovery rail', async () => {
  const home = await read('src/app/page.tsx');
  const trending = await read('src/app/page-sections/trending.tsx');
  const priceEvents = await read('src/lib/price-events.ts');

  assert.match(priceEvents, /buildPriceDropDiscoveryRail/);
  assert.match(priceEvents, /PriceDropDiscoveryRailItem/);
  assert.match(priceEvents, /week-over-week compares/);
  assert.match(priceEvents, /right\.dropPercent - left\.dropPercent/);

  assert.match(trending, /export function PriceDropDiscoveryRail/);
  assert.match(trending, /data-price-drop-discovery-rail/);
  assert.match(trending, /Steepest verified week-over-week price drops/);
  assert.match(trending, /5-9 days earlier/);
  assert.match(trending, /data-price-drop-discovery-card/);

  const mvpHome = await read('src/components/mvp/mvp-home-page.tsx');
  assert.match(home, /MvpHomePage/);
  assert.match(mvpHome, /PriceDropDiscoveryRail/);
  assert.match(mvpHome, /<PriceDropDiscoveryRail \/>/);
});
