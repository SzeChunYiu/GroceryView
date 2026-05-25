import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL('../src/components/origin-filter.tsx', import.meta.url);
const pageUrl = new URL('../src/app/products/page.tsx', import.meta.url);
const verifiedUrl = new URL('../src/lib/verified-data.ts', import.meta.url);
const apiUrl = new URL('../../../packages/api/src/index.ts', import.meta.url);

test('OriginFilter exposes the required per-country multi-select URL chips', async () => {
  const source = await readFile(componentUrl, 'utf8');

  assert.match(source, /export const ORIGIN_FILTER_PARAM = 'origin'/);
  for (const code of ['SE', 'NO', 'IS', 'DK', 'FI', 'DE', 'NL', 'ES', 'IT', 'PL', 'IE']) {
    assert.match(source, new RegExp(`code: '${code}'`));
  }
  for (const flag of ['🇸🇪', '🇳🇴', '🇮🇸', '🇩🇰', '🇫🇮', '🇩🇪', '🇳🇱', '🇪🇸', '🇮🇹', '🇵🇱', '🇮🇪']) {
    assert.match(source, new RegExp(flag, 'u'));
  }
  assert.match(source, /url\.searchParams\.append\(ORIGIN_FILTER_PARAM, code\)/);
  assert.match(source, /localOriginFromNavigator/);
  assert.match(source, /window\.location\.replace/);
  assert.match(source, /aria-pressed=\{active\}/);
});

test('product search preserves and applies origin URL filters', async () => {
  const [page, verified, api] = await Promise.all([
    readFile(pageUrl, 'utf8'),
    readFile(verifiedUrl, 'utf8'),
    readFile(apiUrl, 'utf8')
  ]);

  assert.match(page, /import \{ OriginFilter/);
  assert.match(page, /setAllParams\(params, 'origin', source\.origin\)/);
  assert.match(page, /name="origin"/);
  assert.match(page, /selected=\{search\.originFilters\}/);
  assert.match(verified, /originCountries = originSearchValues\(searchParams\.origin\)/);
  assert.match(verified, /originCountryForAxfoodProduct\(product\)/);
  assert.match(verified, /originFacets: supportedOriginCountries\.map/);
  assert.match(api, /originCountries\?: string\[\]/);
  assert.match(api, /queryParams: \['q', 'category', 'brand', 'label', 'origin'/);
  assert.match(api, /facets: \{[\s\S]*origins: sortedFacet\(originFacet\)/);
});
