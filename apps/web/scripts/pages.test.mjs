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

      const store = await readFile(join(root, 'stores/willys-odenplan/index.html'), 'utf8');
      assert.match(store, /Store highlights/);
      assert.match(store, /Verified shelf/);
      assert.match(store, /Watchlist only/);

      const category = await readFile(join(root, 'categories/coffee/index.html'), 'utf8');
      assert.match(category, /Category signals/);
      assert.match(category, /Private-label swap candidate/);
      assert.match(category, /Arvid Nordquist/);

      const login = await readFile(join(root, 'login/index.html'), 'utf8');
      assert.match(login, /Sign in to GroceryView/);
      assert.match(login, /Passkey or magic link/);

      const account = await readFile(join(root, 'account/index.html'), 'utf8');
      assert.match(account, /Alert preferences/);
      assert.match(account, /Coffee below 50 SEK/);
      assert.match(account, /Daily digest/);

      const household = await readFile(join(root, 'household/index.html'), 'utf8');
      assert.match(household, /Shared household basket/);
      assert.match(household, /member attribution/);
      assert.match(household, /Household rules/);
      assert.match(household, /Owner approval over 400 SEK/);
      assert.match(household, /No pork, nut alert/);

      const basket = await readFile(join(root, 'basket/index.html'), 'utf8');
      assert.match(basket, /Basket lines/);
      assert.match(basket, /Lidl Sveavägen/);
      assert.match(basket, /Smart swaps/);

      const scanner = await readFile(join(root, 'scanner/index.html'), 'utf8');
      assert.match(scanner, /Barcode and receipt scanner/);
      assert.match(scanner, /manual review queue/);
      assert.match(scanner, /Coop Farsta receipt/);
      assert.match(scanner, /Route to product matching queue/);

      const privacy = await readFile(join(root, 'privacy/index.html'), 'utf8');
      assert.match(privacy, /Export or delete your data/);
      assert.match(privacy, /advertiser payloads stay aggregated/);
      assert.match(privacy, /Control states/);
      assert.match(privacy, /Receipt images/);
      assert.match(privacy, /District only/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
