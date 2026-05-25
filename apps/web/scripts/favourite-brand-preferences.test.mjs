import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('favourite brand preferences', () => {
  it('persists preferred and avoided brands from the favourites experience', async () => {
    const [library, client, page] = await Promise.all([
      read('src/lib/favourites.ts'),
      read('src/components/favourite-products-page-client.tsx'),
      read('src/app/favorites/page.tsx')
    ]);

    assert.match(library, /FAVOURITE_BRANDS_STORAGE_KEY/);
    assert.match(library, /export type FavouriteBrandPreference = 'preferred' \| 'avoided'/);
    assert.match(library, /parseFavouriteBrandPreferenceEntries/);
    assert.match(library, /saveFavouriteBrandPreferenceEntries/);
    assert.match(library, /setFavouriteBrandPreference/);

    assert.match(client, /readFavouriteBrandPreferenceEntries/);
    assert.match(client, /markBrand\(liveProduct\.brand, 'preferred'\)/);
    assert.match(client, /markBrand\(liveProduct\.brand, 'avoided'\)/);
    assert.match(client, /brandPreferencesByBrand/);
    assert.match(client, /brand \{brandPreference\}/);

    assert.match(page, /Brand preference actions/);
    assert.match(page, /data-brand-preference-action="preferred"/);
    assert.match(page, /data-brand-preference-action="avoided"/);
  });
});
