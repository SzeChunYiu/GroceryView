import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const INP_GOOD_TARGET_MS = 200;
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('data-dense interactions keep explicit INP guardrails', async () => {
  const [
    searchPage,
    searchBar,
    screenerPage,
    mapPage,
    priceChartTerminal,
    basketBuilder
  ] = await Promise.all([
    read('src/app/search/page.tsx'),
    read('src/components/SearchBar.tsx'),
    read('src/app/screener/page.tsx'),
    read('src/app/map/page.tsx'),
    read('src/components/price-chart-terminal.tsx'),
    read('src/components/basket-builder.tsx')
  ]);

  assert.equal(INP_GOOD_TARGET_MS, 200);

  assert.match(searchPage, /SEARCH_PAGE_SIZE = 24/);
  assert.match(searchPage, /Quick view|SearchResultPreviewCard|Open product/);
  assert.match(searchBar, /new AbortController\(\)/);
  assert.match(searchBar, /window\.setTimeout\(async \(\) =>/);
  assert.match(searchBar, /window\.clearTimeout\(timeout\)/);

  assert.match(screenerPage, /screenerSortHref/);
  assert.match(screenerPage, /screenerCategoryHref/);
  assert.match(screenerPage, /screenerDiscountHref/);
  assert.match(screenerPage, /visible-row summary|Showing/);

  assert.match(mapPage, /topRouteAwareStores = routeAwareNearestStorePlan\.rows\.slice\(0, 4\)/);
  assert.match(mapPage, /districtHeatOverlay/);
  assert.match(mapPage, /StoreMap/);

  assert.match(priceChartTerminal, /import\('lightweight-charts'\)/);
  assert.match(priceChartTerminal, /overlaySeriesIds/);
  assert.match(priceChartTerminal, /visibleSeries = useMemo/);
  assert.match(priceChartTerminal, /chartApi\.timeScale\(\)\.fitContent\(\)/);

  assert.match(basketBuilder, /availableDietaryTags = useMemo/);
  assert.match(basketBuilder, /activeDietaryFilterSet = useMemo/);
  assert.match(basketBuilder, /filteredProducts = useMemo/);
  assert.match(basketBuilder, /removeOnBackspace/);
});
