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
  assert.match(appNav, /<SearchBar surface="app-nav" \/>/);
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
