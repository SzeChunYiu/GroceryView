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

test('product cards expose a localStorage-backed favourite heart toggle', async () => {
  const productCards = await read('src/components/product-price-cards.tsx');
  const toggle = await read('src/components/favourite-product-toggle.tsx');
  const storage = await read('src/lib/favourites.ts');

  assert.match(productCards, /FavouriteProductToggle/);
  assert.match(productCards, /product=\{\{ slug: card\.slug, name: card\.name/);
  assert.match(toggle, /aria-pressed=\{isFavourite\}/);
  assert.match(toggle, /localStorage\.setItem\(FAVOURITES_STORAGE_KEY/);
  assert.match(toggle, /window\.dispatchEvent\(new CustomEvent\(FAVOURITES_UPDATED_EVENT/);
  assert.match(storage, /groceryview:favourite-products/);
  assert.match(storage, /parseFavouriteProductEntries/);
  assert.match(storage, /toggleFavouriteProduct/);
});

test('favourites route renders saved localStorage products using current product price cards', async () => {
  assert.equal(await exists('src/app/favourites/page.tsx'), true);
  const page = await read('src/app/favourites/page.tsx');
  const client = await read('src/components/favourite-products-page-client.tsx');

  assert.match(page, /routeMetadata\('\/favourites'\)/);
  assert.match(page, /adaptiveProductCards\.map/);
  assert.match(page, /FavouriteProductsPageClient/);
  assert.match(client, /localStorage\.getItem\(FAVOURITES_STORAGE_KEY\)/);
  assert.match(client, /productCatalogue\.filter/);
  assert.match(client, /saved product/);
  assert.match(client, /current price/i);
  assert.match(client, /No favourite products yet/);
  assert.doesNotMatch(client, /fetch\(/);
  assert.doesNotMatch(client, /@\/components\/data-ui/);
});
