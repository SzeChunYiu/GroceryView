import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('Norway market SEO pages and switcher', () => {
  it('defines country-specific market routes with preview states and hreflang metadata', async () => {
    const routing = await read('src/lib/market-routing.ts');
    const switcher = await read('src/components/market-switcher.tsx');
    const landing = await read('src/app/[country]/page.tsx');
    const compare = await read('src/app/[country]/compare/page.tsx');
    const index = await read('src/app/[country]/chain-index/page.tsx');
    const deals = await read('src/app/[country]/deals/page.tsx');
    const city = await read('src/app/[country]/cities/[city]/page.tsx');

    for (const country of ['sweden', 'norway', 'iceland']) {
      assert.match(routing, new RegExp(`slug: '${country}'`));
    }
    // The switcher renders every market defined in market-routing (sweden/norway/iceland)
    // dynamically from marketCountries rather than hard-coding each country slug.
    assert.match(switcher, /marketCountries\.map/);
    assert.match(switcher, /country\.nativeLabel/);
    assert.match(switcher, /equivalentMarketPath\(pathname, country\.slug\)/);
    for (const route of [landing, compare, index, deals]) {
      assert.match(route, /alternates/);
      assert.match(route, /canonical/);
      assert.match(route, /marketLanguageAlternates/);
    }
    assert.match(city, /alternates/);
    assert.match(city, /canonical/);
    assert.match(city, /\[entry\.language\]/);
    assert.match(routing, /Norway is a crawlable preview/);
    assert.match(routing, /No borrowed rankings|without borrowing another country/);
    assert.match(routing, /oslo/);
    assert.match(routing, /bergen/);
    assert.match(routing, /trondheim/);
  });
});
