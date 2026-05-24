import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

async function exists(relative) {
  try {
    await access(new URL(relative, root));
    return true;
  } catch {
    return false;
  }
}

test('city dashboard ships a trending price-drop engine, API feed, and concise cards', async () => {
  assert.equal(await exists('src/lib/trends.ts'), true);
  assert.equal(await exists('src/app/api/feed/trending/route.ts'), true);
  assert.equal(await exists('src/app/page-sections/trending.tsx'), true);

  const trends = await read('src/lib/trends.ts');
  const route = await read('src/app/api/feed/trending/route.ts');
  const section = await read('src/app/page-sections/trending.tsx');
  const shell = await read('src/components/market-shell.tsx');

  assert.match(trends, /export function buildCityPriceDropTrends/);
  assert.match(trends, /cityAliases/);
  assert.match(trends, /latestDropPair/);
  assert.match(trends, /latest\.price >= previous\.price/);
  assert.match(trends, /deltaAmount/);
  assert.match(trends, /deltaPercent/);
  assert.match(trends, /confidenceScore/);
  assert.match(trends, /confidenceLabel/);
  assert.match(trends, /urgencyLabel/);
  assert.match(trends, /OpenPrices dated SEK observations/);

  assert.match(route, /export function GET\(request: Request\)/);
  assert.match(route, /searchParams\.get\('city'\)/);
  assert.match(route, /searchParams\.get\('limit'\)/);
  assert.match(route, /buildCityPriceDropTrends\(\{ city, limit \}\)/);
  assert.doesNotMatch(route, /console\./);

  assert.match(section, /export function TrendingPriceDropCards/);
  assert.match(section, /data-trending-price-drop-card/);
  assert.match(section, /Top drops in \{feed\.city\}/);
  assert.match(section, /formatSek\(card\.deltaAmount\)/);
  assert.match(section, /card\.confidenceLabel/);
  assert.match(section, /card\.confidenceScore\.toFixed\(2\)/);
  assert.match(section, /card\.urgencyLabel/);

  assert.match(shell, /import \{ TrendingPriceDropCards \} from '@\/app\/page-sections\/trending'/);
  assert.match(shell, /<TrendingPriceDropCards city="stockholm" \/>/);
});
