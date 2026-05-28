import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), "utf8");
}

test("MVP product cards use slug routes, not backend ids", async () => {
  const source = await read("src/components/mvp/product-card.tsx");
  assert.match(source, /productSlugHref\(product\.slug\)/);
  assert.doesNotMatch(source, /productRoute\(product\.id\)/);
});

test("search cards link product, browse, market, and category-filter routes by slug", async () => {
  const searchPage = await read("src/app/search/page.tsx");
  const searchGrid = await read("src/components/search/search-results-grid.tsx");
  const previewCard = await read("src/components/preview/search-result-preview-card.tsx");
  assert.match(searchPage, /SearchResultsGrid/);
  assert.match(searchGrid, /categorySlug: card\.categorySlug/);
  assert.match(previewCard, /productSlugHref\(card\.slug\)/);
  assert.match(searchPage, /Sort results/);
  assert.match(searchPage, /Showing results/);
  assert.doesNotMatch(searchPage, /Server-side cursor pagination/);
});

test("market table and panels include requested analytical columns and surfaces", async () => {
  const source = await read("src/app/market/page.tsx");
  for (const label of ["Weekly", "3M", "1Y", "Trend", "Cheapest chain", "Confidence"]) {
    assert.match(source, new RegExp(`>${label}<`));
  }
  assert.match(source, /Market KPI cards/);
  assert.match(source, /Chain × category heatmap/);
  assert.match(source, /Deal opportunity panel/);
  assert.match(source, /Data quality panel/);
});

test("category browse uses real deal cards and combined quick actions", async () => {
  const source = await read("src/app/browse/[category]/page.tsx");
  assert.match(source, /data\.bestDeals\.map/);
  assert.match(source, /productSlugHref\(deal\.product\.slug\)/);
  assert.match(source, /Combined quick actions/);
  assert.match(source, /mini price index/);
});

test("map layer controls, selected detail panel, and linked deal-store cards are functional routes", async () => {
  const source = await read("src/app/map/page.tsx");
  for (const label of ["Layer selector", "Category selector", "Chain selector", "Region / kommun selector", "Confidence / freshness selector"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /Active layer: \{selectedLayer\}/);
  assert.match(source, /href=\{`\/products\/\$\{encodeURIComponent\(slugifyRouteValue\(deal\.dealName\)\)\}`\}/);
  assert.match(source, /MapNearbyStorePreviews/);
  const previews = await read("src/components/map/map-nearby-store-previews.tsx");
  assert.match(previews, /storeSlug=\{store\.id\}/);
});

test("mobile nav is constrained to primary MVP items", async () => {
  const source = await read("src/components/app-nav.tsx");
  assert.match(source, /const primaryMobileNavItems: NavItem\[\] = \[/);
  assert.match(source, /label: 'Home'/);
  assert.match(source, /label: 'Market'/);
  assert.match(source, /label: 'Deals'/);
  assert.match(source, /label: 'Browse'/);
  assert.match(source, /label: 'Map'/);
  assert.match(source, /label: 'Watchlist'/);
  assert.match(source, /label: 'More'/);
  assert.doesNotMatch(source, /const mobileNavItems = navGroups\.flatMap/);
});
