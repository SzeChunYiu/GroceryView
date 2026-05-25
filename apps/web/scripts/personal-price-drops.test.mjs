import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFile(join(root, path), 'utf8');

describe('personalized price-drop feed', () => {
  it('ranks homepage price drops against favorites watchlist items and household categories', async () => {
    const shell = await read('src/components/market-shell.tsx');
    const feed = await read('src/components/feed/personal-price-drops.tsx');
    const personalization = await read('src/lib/personalization.ts');

    assert.match(shell, /PersonalPriceDrops/);
    assert.match(shell, /@\/components\/feed\/personal-price-drops/);

    assert.match(feed, /export function PersonalPriceDrops/);
    assert.match(feed, /buildPersonalizedPriceDropFeed/);
    assert.match(feed, /priceDropMoversBoard/);
    assert.match(feed, /watchlistAlertBoard/);
    assert.match(feed, /data-personal-price-drops/);
    assert.match(feed, /data-personal-price-drop-card/);
    assert.match(feed, /favorites, watchlist, and household categories/);
    assert.match(feed, /verified product page/);

    assert.match(personalization, /PersonalizedPriceDropInput/);
    assert.match(personalization, /PersonalizedPriceDropFeedItem/);
    assert.match(personalization, /buildPersonalizedPriceDropFeed/);
    assert.match(personalization, /favoriteProductSlugs/);
    assert.match(personalization, /watchlistProductSlugs/);
    assert.match(personalization, /householdCategoryScore/);
    assert.match(personalization, /relevanceReasons/);
    assert.match(personalization, /personalizationScore/);
  });
});
