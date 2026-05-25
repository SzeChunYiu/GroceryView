import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('recently viewed products carousel persists local product detail links', async () => {
  const personalization = await read('src/lib/personalization.ts');
  const carousel = await read('src/components/recently-viewed-products-carousel.tsx');
  const lazyItemCard = await read('src/components/LazyItemCard.tsx');
  const priceCards = await read('src/components/product-price-cards.tsx');
  const productsPage = await read('src/app/products/page.tsx');
  const marketShell = await read('src/components/market-shell.tsx');

  assert.match(personalization, /recentlyViewedProductsStorageKey = 'groceryview:recently-viewed-products:v1'/);
  assert.match(personalization, /rememberRecentlyViewedProduct/);
  assert.match(personalization, /readRecentlyViewedProducts/);
  assert.match(personalization, /clearRecentlyViewedProducts/);
  assert.match(personalization, /maxRecentlyViewedProducts = 12/);
  assert.match(personalization, /href\.startsWith\('\/products\/'\)/);

  assert.match(carousel, /data-recently-viewed-products-carousel/);
  assert.match(carousel, /readRecentlyViewedProducts/);
  assert.match(carousel, /recentlyViewedProductsChangedEvent/);
  assert.match(carousel, /clearRecentlyViewedProducts/);
  assert.match(carousel, /href=\{item\.href\}/);

  assert.match(lazyItemCard, /rememberRecentlyViewedProduct/);
  assert.match(lazyItemCard, /recentlyViewedProduct\?: RecentlyViewedProductInput/);
  assert.match(lazyItemCard, /data-recently-viewed-product/);
  assert.match(priceCards, /recentlyViewedProduct=\{\{/);

  assert.match(productsPage, /RecentlyViewedProductsCarousel/);
  assert.match(marketShell, /RecentlyViewedProductsCarousel/);
});
