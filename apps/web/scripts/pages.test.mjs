import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Script } from 'node:vm';
import { buildStaticPages } from './pages.mjs';

describe('buildStaticPages', () => {
  it('generates proposal-required SEO and user-flow pages', async () => {
    const root = await mkdtemp(join(tmpdir(), 'groceryview-pages-'));
    try {
      const pages = await buildStaticPages(root);
      assert.deepEqual(pages.sort(), [
        'account/index.html',
        'admin/human-review/index.html',
        'basket/index.html',
        'categories/coffee/index.html',
        'guides/coffee-price-index/index.html',
        'household/index.html',
        'login/index.html',
        'loyalty/offers/index.html',
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
      assert.match(market, /Brand-tier indices/);
      assert.match(market, /Private Label Index/);
      assert.match(market, /Premium Brand Index/);
      assert.match(market, /private-label savings vs national brands/);

      const store = await readFile(join(root, 'stores/willys-odenplan/index.html'), 'utf8');
      assert.match(store, /Store highlights/);
      assert.match(store, /Verified shelf/);
      assert.match(store, /Watchlist only/);

      const category = await readFile(join(root, 'categories/coffee/index.html'), 'utf8');
      assert.match(category, /Category signals/);
      assert.match(category, /Private-label swap candidate/);
      assert.match(category, /Arvid Nordquist/);

      const guide = await readFile(join(root, 'guides/coffee-price-index/index.html'), 'utf8');
      assert.match(guide, /Coffee price index guide/);
      assert.match(guide, /Current Stockholm percentile/);
      assert.match(guide, /sponsored placements never improve the score/);
      assert.match(guide, /Article display ad/);
      assert.match(guide, /Clearly labelled sponsored placement/);

      const login = await readFile(join(root, 'login/index.html'), 'utf8');
      assert.match(login, /Sign in to GroceryView/);
      assert.match(login, /Passkey or magic link/);

      const account = await readFile(join(root, 'account/index.html'), 'utf8');
      assert.match(account, /Alert preferences/);
      assert.match(account, /Coffee below 50 SEK/);
      assert.match(account, /Daily digest/);
      assert.match(account, /Subscription access/);
      assert.match(account, /Premium access is active/);
      assert.match(account, /\/api\/account\/subscription-access/);
      assert.match(account, /Manage subscription/);

      const nutritionAllergens = await readFile(join(root, 'nutrition/allergens/index.html'), 'utf8');
      assert.match(nutritionAllergens, /Nutrition and allergen review/);
      assert.match(nutritionAllergens, /Diet review queue/);
      assert.match(nutritionAllergens, /Peanut granola/);
      assert.match(nutritionAllergens, /Blocked allergens outrank price savings and Deal Score/);
      assert.match(nutritionAllergens, /Diet conflicts stop meal-plan and basket updates until reviewed/);

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

      const humanReview = await readFile(join(root, 'admin/human-review/index.html'), 'utf8');
      assert.match(humanReview, /Human review operations/);
      assert.match(humanReview, /Moderator assignments/);
      assert.match(humanReview, /SLA breached/);
      assert.match(humanReview, /Approve product match/);
      assert.match(humanReview, /approve_product_match/);

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
