import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('filtered route canonical URLs', () => {
  it('canonicalizes category filters and tracking params back to the category path', async () => {
    const [seo, categoryRoute] = await Promise.all([
      read('src/lib/seo.ts'),
      read('src/app/categories/[slug]/page.tsx')
    ]);

    assert.match(seo, /export function metadataForCategory\(category: \{ slug: string; label: string \}, searchParams\?: CanonicalFilterSearchParams\)/);
    assert.match(seo, /const categoryPath = `\/categories\/\$\{category\.slug\}`/);
    assert.match(seo, /canonicalPath: hasAppliedCanonicalFilters\(searchParams\) \? categoryPath : undefined/);
    assert.match(seo, /Object\.values\(searchParams \?\? \{\}\)\.some/);
    assert.match(seo, /Array\.isArray\(value\)/);
    assert.match(categoryRoute, /type CategorySearchParams = Readonly<\{ q\?: string; sort\?: string; page\?: string \}>/);
    assert.match(categoryRoute, /metadataForCategory\(\{ slug, label \}, resolvedSearchParams\)/);
    assert.doesNotMatch(categoryRoute, /utm_source|utm_medium|utm_campaign/);
  });

  it('canonicalizes search filters and tracking params back to /search', async () => {
    const [seo, searchRoute] = await Promise.all([
      read('src/lib/seo.ts'),
      read('src/app/search/page.tsx')
    ]);

    assert.match(seo, /export function metadataForSearch\(searchParams\?: CanonicalFilterSearchParams\)/);
    assert.match(seo, /path: '\/search'/);
    assert.match(seo, /canonicalPath: hasAppliedCanonicalFilters\(searchParams\) \? '\/search' : undefined/);
    assert.match(searchRoute, /type SearchPageParams = Record<string, string \| string\[\] \| undefined>/);
    assert.match(searchRoute, /hasAppliedCanonicalFilters\(resolvedSearchParams\) \? metadataForSearch\(resolvedSearchParams\) : routeMetadata\('\/search'\)/);
    assert.doesNotMatch(searchRoute, /utm_source|utm_medium|utm_campaign/);
  });
});
