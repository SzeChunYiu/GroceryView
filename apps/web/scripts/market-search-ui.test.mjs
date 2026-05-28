import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const forbiddenPublicCopy = [
  /server-side cursor pagination/i,
  /cursor-paginated/i,
  /ingestion pipeline/i,
  /buildFacetedProductSearch/i,
  /latest_prices/i
];

describe('31-onward handoff: public search and market routes', () => {
  it('exports default page modules for search and market routes', async () => {
    const searchPage = await read('src/app/search/page.tsx');
    const marketPage = await read('src/app/market/page.tsx');
    const categoryMarketPage = await read('src/app/market/[category]/page.tsx');

    assert.match(searchPage, /export default async function SearchPage/);
    assert.match(marketPage, /export default async function MarketPage/);
    assert.match(categoryMarketPage, /export default async function CategoryMarketPage/);
  });

  it('search uses handoff question header and human result copy', async () => {
    const searchPage = await read('src/app/search/page.tsx');

    assert.match(searchPage, /PageQuestionHeader/);
    assert.match(searchPage, /Which products match my filters\?/);
    assert.match(searchPage, /Showing .*matching products/);
    assert.match(searchPage, /ChartShell/);
    assert.match(searchPage, /href=\{`\/products\/\$\{card\.slug\}`\}/);
  });

  it('market uses visual intelligence primitives and 3M/1Y table columns', async () => {
    const marketPage = await read('src/app/market/page.tsx');

    assert.match(marketPage, /PageQuestionHeader/);
    assert.match(marketPage, /ChartShell/);
    assert.match(marketPage, /HeatmapMatrix/);
    for (const label of ['Weekly', '3M', '1Y']) {
      assert.match(marketPage, new RegExp(`>${label}<`));
    }
  });

  it('category market route keeps redesigned chart parts', async () => {
    const categoryMarketPage = await read('src/app/market/[category]/page.tsx');
    const marketParts = await read('src/components/market/market-page-parts.tsx');

    assert.match(categoryMarketPage, /CategorySparklineChart|MarketKpiRow/);
    assert.match(marketParts, /ChartShell/);
  });

  it('avoids forbidden debug or backstage phrases on public search and market routes', async () => {
    const files = [
      'src/app/search/page.tsx',
      'src/app/market/page.tsx',
      'src/components/market-shell.tsx',
      'src/components/preview/search-result-preview-card.tsx'
    ];

    for (const file of files) {
      const source = await read(file);
      for (const pattern of forbiddenPublicCopy) {
        assert.doesNotMatch(source, pattern, `${file} should not contain ${pattern}`);
      }
    }
  });
});
