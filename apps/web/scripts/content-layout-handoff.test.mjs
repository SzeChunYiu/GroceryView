import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

test('content layout handoff ships shared user-question and evidence primitives', async () => {
  const source = await read('src/components/mvp/handoff-content.tsx');
  assert.match(source, /PageQuestionHeader/);
  assert.match(source, /PanelPurpose/);
  assert.match(source, /ConnectedActionRow/);
  assert.match(source, /GuidedEmptyState/);
  assert.match(source, /Plain-language meaning first/);
});

test('core handoff pages start with plain-language user questions and connected actions', async () => {
  const pages = {
    home: await read('src/components/mvp/mvp-home-page.tsx'),
    market: await read('src/app/market/page.tsx'),
    browse: await read('src/app/browse/page.tsx'),
    categoryBrowse: await read('src/app/browse/[category]/page.tsx'),
    search: await read('src/app/search/page.tsx'),
    deals: await read('src/app/deals/page.tsx')
  };

  assert.match(pages.home, /Where can I save money on groceries today\?/);
  assert.match(pages.market, /Which grocery prices are rising or falling\?/);
  assert.match(pages.market, /Your market watchlist/);
  assert.match(pages.browse, /What product category do you want to explore\?/);
  assert.match(pages.categoryBrowse, /What is happening in this category, and what should I buy\?/);
  assert.match(pages.search, /Which products match my filters\?/);
  assert.match(pages.search, /PageShell/);
  assert.match(pages.deals, /Is this advertised deal actually good\?/);
  assert.match(pages.deals, /Clearly cheaper than usual and competitive against nearby stores/);
});

test('detail handoff pages expose product, map, store, and watchlist guidance', async () => {
  const pages = {
    product: await read('src/app/products/[slug]/page.tsx'),
    map: await read('src/app/map/page.tsx'),
    store: await read('src/app/stores/[slug]/page.tsx'),
    watchlist: await read('src/app/watchlist/page.tsx')
  };

  assert.match(pages.product, /Is this product a good buy, and where should I buy it\?/);
  assert.match(pages.product, /Where to buy this product/);
  assert.match(pages.map, /Where are grocery prices cheaper or more expensive\?/);
  assert.match(pages.map, /Map layers/);
  assert.match(pages.store, /Is this store good for the products I need\?/);
  assert.match(pages.store, /Search products in this store/);
  assert.match(pages.watchlist, /Sign in to track products, stores, categories, and saved market views/);
});
