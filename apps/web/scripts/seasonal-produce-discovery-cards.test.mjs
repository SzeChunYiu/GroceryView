import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dealContext = new URL('../src/lib/deal-context.ts', import.meta.url);
const route = new URL('../src/app/seasonal-calendar/page.tsx', import.meta.url);
const shell = new URL('../src/components/market-shell.tsx', import.meta.url);

test('deal context builds seasonal produce discovery cards with peak months and linked deals', async () => {
  const source = await readFile(dealContext, 'utf8');

  assert.match(source, /export type SeasonalProduceDiscoveryCard/);
  assert.match(source, /peakMonths: string\[\]/);
  assert.match(source, /typicalPriceRangeLabel: string/);
  assert.match(source, /linkedCurrentDeals/);
  assert.match(source, /export function buildSeasonalProduceDiscoveryCards/);
  assert.match(source, /peakMonthsFor\(row\)/);
  assert.match(source, /typicalPriceRangeLabel\(row\)/);
  assert.match(source, /isLinkedSeasonalDeal\(row, deal\)/);
  assert.match(source, /formatPrice\(deal\.price, 'sv-SE', 'SEK'\)/);
});

test('seasonal calendar route renders in-season produce cards with current deal links', async () => {
  const source = await readFile(route, 'utf8');

  assert.match(source, /buildSeasonalProduceDiscoveryCards/);
  assert.match(source, /categoryDealLeaders/);
  assert.match(source, /const seasonalDiscoveryCards = buildSeasonalProduceDiscoveryCards/);
  assert.match(source, /In-season produce with current deal links/);
  assert.match(source, /Peak months \{card\.peakMonths\.join\(' \/ '\)\}/);
  assert.match(source, /card\.typicalPriceRangeLabel/);
  assert.match(source, /card\.linkedCurrentDeals/);
  assert.match(source, /No linked current category deal is available right now/);
});

test('homepage seasonal preview uses discovery cards instead of bare best-buy rows', async () => {
  const source = await readFile(shell, 'utf8');

  assert.match(source, /buildSeasonalProduceDiscoveryCards/);
  assert.match(source, /homepageSeasonalDiscoveryCards/);
  assert.match(source, /Peak months . \{row\.peakMonths\.join\(' \/ '\)\}/);
  assert.match(source, /row\.typicalPriceRangeLabel/);
  assert.match(source, /row\.linkedCurrentDeals\.length/);
  assert.match(source, /linked current deal/);
});
