import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('discover route ranks categories from movement saves and seasonal demand', async () => {
  const route = await read('src/app/discover/page.tsx');
  const carousel = await read('src/components/TrendingCarousel.tsx');
  const trendingCategories = await read('src/lib/trending-categories.ts');
  const seo = await read('src/lib/seo.ts');
  const sitemap = await read('src/app/sitemap.ts');

  assert.match(route, /buildTrendingCategories/);
  assert.match(route, /TrendingCategoryCarousel/);
  assert.match(route, /homepageTrendingPriceChanges/);
  assert.match(route, /categoryDealLeaders/);
  assert.match(route, /seasonalProduceCalendar/);
  assert.match(route, /routeMetadata\('\/discover'\)/);

  assert.match(carousel, /export function TrendingCategoryCarousel/);
  assert.match(carousel, /data-trending-category-carousel/);
  assert.match(carousel, /data-trending-category-rank/);
  assert.match(carousel, /priceMovementLabel/);
  assert.match(carousel, /shopperSavesLabel/);
  assert.match(carousel, /seasonalDemandLabel/);

  assert.match(trendingCategories, /homepageTrendingPriceChanges/);
  assert.match(trendingCategories, /categoryDealLeaders/);
  assert.match(trendingCategories, /seasonalProduceCalendar\.topBestBuys/);
  assert.match(trendingCategories, /score: movementScore \+ savesScore \+ seasonalScore \+ coverageScore/);

  assert.match(seo, /'\/discover'/);
  assert.match(sitemap, /entry\('\/discover', 0\.9, 'daily'\)/);
});
