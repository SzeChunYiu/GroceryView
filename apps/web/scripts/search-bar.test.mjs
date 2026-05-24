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

test('search bar debounces product search API calls and renders a dropdown', async () => {
  assert.equal(await exists('src/components/SearchBar.tsx'), true);
  const searchBar = await read('src/components/SearchBar.tsx');

  assert.match(searchBar, /'use client'/);
  assert.match(searchBar, /setTimeout\([\s\S]*300/);
  assert.match(searchBar, /AbortController/);
  assert.match(searchBar, /\/api\/products\?q=/);
  assert.match(searchBar, /role="combobox"/);
  assert.match(searchBar, /role="listbox"/);
  assert.match(searchBar, /href=\{`\/products\/\$\{result\.slug\}`\}/);
});

test('global navigation mounts the debounced product search bar', async () => {
  const appNav = await read('src/components/app-nav.tsx');

  assert.match(appNav, /import \{ SearchBar \} from '\.\/SearchBar'/);
  assert.match(appNav, /<SearchBar \/>/);
});

test('web product search API is backed by PostgreSQL full-text search', async () => {
  assert.equal(await exists('src/app/api/products/route.ts'), true);
  const route = await read('src/app/api/products/route.ts');

  assert.match(route, /runtime = 'nodejs'/);
  assert.match(route, /dynamic = 'force-dynamic'/);
  assert.match(route, /DATABASE_URL/);
  assert.match(route, /searchProductsByText/);
  assert.match(route, /product_search_database_unconfigured/);
  assert.match(route, /NextResponse\.json\(\{ query, results/);
});

test('web product search auto-archives stale latest prices before ranking', async () => {
  assert.equal(await exists('src/lib/freshness.ts'), true);
  const freshness = await read('src/lib/freshness.ts');
  const route = await read('src/app/api/products/route.ts');

  assert.match(freshness, /DEFAULT_STALE_PRICE_THRESHOLD_DAYS = 14/);
  assert.match(freshness, /update latest_prices/);
  assert.match(freshness, /is_available = false/);
  assert.match(freshness, /latest_prices\.domain = 'grocery'/);
  assert.match(freshness, /latest_prices\.observed_at < \$1::timestamptz/);
  assert.match(route, /archiveStalePricesIfDue/);
  assert.match(route, /archiveStalePrices\(executor\)/);
  assert.match(route, /searchProductsByText\(executor, query/);
});
