import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URLSearchParams } from 'node:url';
import { categoryCanonicalMetadataCases, searchCanonicalMetadataCases } from './metadata-fixtures.mjs';

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function canonicalFromFixture(base, params, keep) {
  const search = new URLSearchParams();

  for (const key of keep) {
    const raw = first(params[key]);
    if (typeof raw !== 'string') continue;

    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (key === 'currency') {
      search.set(key, trimmed.toUpperCase());
    } else if (key === 'lang') {
      search.set(key, trimmed.toLowerCase());
    } else {
      search.set(key, trimmed);
    }
  }

  return search.toString() ? `${base}?${search.toString()}` : base;
}

describe('metadata tests for filtered canonical routes', () => {
  it('declares canonical metadata in category detail and search routes', async () => {
    const categorySource = await readFile(new URL('../src/app/categories/[slug]/page.tsx', import.meta.url), 'utf8');
    const searchSource = await readFile(new URL('../src/app/search/page.tsx', import.meta.url), 'utf8');
    const helperSource = await readFile(new URL('../src/lib/metadata-canonical.ts', import.meta.url), 'utf8');

    assert.ok(/export async function generateMetadata/.test(categorySource), 'category route should define generateMetadata');
    assert.ok(/alternates:\s*{[\s\S]*canonical/.test(categorySource), 'category route should set alternates canonical');
    assert.ok(/buildCategoryCanonicalPath/.test(categorySource), 'category route should call canonical path helper');
    assert.ok(/CATEGORY_CANONICAL_KEYS/.test(helperSource), 'category canonical helper should define lang/currency keys');
    assert.ok(/const CATEGORY_CANONICAL_KEYS/.test(helperSource), 'category canonical helper should define a canonical key list');

    assert.ok(/export async function generateMetadata/.test(searchSource), 'search route should define generateMetadata');
    assert.ok(/alternates:\s*{[\s\S]*canonical/.test(searchSource), 'search route should set alternates canonical');
    assert.ok(/buildSearchCanonicalPath/.test(searchSource), 'search route should call search canonical path helper');
    assert.ok(/SEARCH_CANONICAL_KEYS/.test(helperSource), 'search canonical helper should include q/lang/currency keys');
  });

  it('preserves language and currency with canonical URL fixtures', () => {
    for (const fixture of categoryCanonicalMetadataCases) {
      const expected = fixture.expectedCanonical;
      const actual = canonicalFromFixture(`/categories/${fixture.slug}`, fixture.searchParams, ['lang', 'currency']);
      assert.equal(actual, expected, `category fixture mismatch: ${fixture.name}`);
    }

    for (const fixture of searchCanonicalMetadataCases) {
      const expected = fixture.expectedCanonical;
      const actual = canonicalFromFixture('/search', fixture.searchParams, ['q', 'lang', 'currency']);
      assert.equal(actual, expected, `search fixture mismatch: ${fixture.name}`);
    }
  });

  it('ignores unsupported filters in canonical URL fixtures', () => {
    const source = {
      lang: 'sv',
      currency: 'sek',
      q: 'milk',
      page: '2',
      sort: 'desc'
    };

    assert.equal(canonicalFromFixture('/categories/dairy', source, ['lang', 'currency']), '/categories/dairy?lang=sv&currency=SEK');
    assert.equal(canonicalFromFixture('/search', source, ['q', 'lang', 'currency']), '/search?q=milk&lang=sv&currency=SEK');
  });
});
