import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStaticPages } from './pages.mjs';

describe('buildStaticPages', () => {
  it('generates proposal-required SEO and user-flow pages', async () => {
    const root = await mkdtemp(join(tmpdir(), 'groceryview-pages-'));
    try {
      const pages = await buildStaticPages(root);
      assert.deepEqual(pages.sort(), [
        'account/index.html',
        'basket/index.html',
        'categories/coffee/index.html',
        'household/index.html',
        'login/index.html',
        'market/index.html',
        'privacy/index.html',
        'products/coffee/index.html',
        'scanner/index.html',
        'stores/willys-odenplan/index.html'
      ]);

      const product = await readFile(join(root, 'products/coffee/index.html'), 'utf8');
      assert.match(product, /ZOEGAS-COFFEE-450G/);
      assert.match(product, /Deal Score/);

      const market = await readFile(join(root, 'market/index.html'), 'utf8');
      assert.match(market, /Stockholm Grocery Market/);
      assert.match(market, /Coffee Index/);

      const login = await readFile(join(root, 'login/index.html'), 'utf8');
      assert.match(login, /Sign in to GroceryView/);
      assert.match(login, /Passkey or magic link/);

      const household = await readFile(join(root, 'household/index.html'), 'utf8');
      assert.match(household, /Shared household basket/);
      assert.match(household, /member attribution/);

      const scanner = await readFile(join(root, 'scanner/index.html'), 'utf8');
      assert.match(scanner, /Barcode and receipt scanner/);
      assert.match(scanner, /manual review queue/);

      const privacy = await readFile(join(root, 'privacy/index.html'), 'utf8');
      assert.match(privacy, /Export or delete your data/);
      assert.match(privacy, /advertiser payloads stay aggregated/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
