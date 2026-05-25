import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('search results page persists category chain price dietary and promotion filters in URL', async () => {
  const searchPage = await read('src/app/search/page.tsx');
  const productsPage = await read('src/app/products/page.tsx');
  const filterPanel = await read('src/components/FilterPanel.tsx');
  const searchFilters = await read('src/lib/search-filters.ts');
  const verifiedData = await read('src/lib/verified-data.ts');

  assert.match(searchPage, /basePath="\/search"/);
  assert.match(productsPage, /action=\{basePath\}/);
  assert.match(productsPage, /data-search-facet-form/);
  assert.match(productsPage, /'category' \| 'label' \| 'origin' \| 'dietary' \| 'chain' \| 'priceType'/);
  assert.match(productsPage, /name="minPrice"/);
  assert.match(productsPage, /name="maxPrice"/);
  assert.match(productsPage, /name="dietary"/);
  assert.match(productsPage, /<ChainFilterInput chains=\{search\.filters\.chains\}/);
  assert.match(productsPage, /setFirstParam\(params, 'chain', source\.chain\)/);
  assert.match(productsPage, /name="priceType"/);
  assert.match(productsPage, /Promotion filters use source priceType rows only/);

  assert.match(filterPanel, /data-search-filter-panel/);
  assert.match(filterPanel, /Category filters/);
  assert.match(filterPanel, /Chain filters/);
  assert.match(filterPanel, /Promotion filters/);
  assert.match(filterPanel, /name="minPrice"/);
  assert.match(filterPanel, /name="maxPrice"/);

  assert.match(searchFilters, /priceType/);
  assert.match(searchFilters, /Promotion:/);
  assert.match(searchFilters, /multiValueChipKeys = new Set<SearchFilterChipKey>\(\['category', 'chain', 'dietary', 'priceType'\]\)/);

  assert.match(verifiedData, /priceType\?: SearchParamValue/);
  assert.match(verifiedData, /priceTypeSearchValues/);
  assert.match(verifiedData, /priceTypes/);
  assert.match(verifiedData, /priceTypeFacets/);
});
