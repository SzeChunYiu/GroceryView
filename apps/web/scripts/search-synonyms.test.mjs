import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

async function exists(relative) {
  try {
    await access(new URL(relative, root));
    return true;
  } catch {
    return false;
  }
}

test('semantic grocery synonym dictionary covers Swedish and English household terms', async () => {
  assert.equal(await exists('src/lib/search-synonyms.ts'), true);
  const source = await read('src/lib/search-synonyms.ts');

  assert.match(source, /grocerySearchSynonymGroups/);
  assert.match(source, /semanticSynonymsForQuery/);
  assert.match(source, /yoghurt/);
  assert.match(source, /fil/);
  assert.match(source, /diapers/);
  assert.match(source, /nappies/);
  assert.match(source, /glutenfri/);
  assert.match(source, /laktosfri/);
});

test('search suggestion expansion includes semantic synonym matches', async () => {
  const suggest = await read('src/lib/search-suggest.ts');
  const filters = await read('src/lib/search-filters.ts');

  assert.match(suggest, /semanticSynonymsForQuery/);
  assert.match(suggest, /matchedSynonyms/);
  assert.match(suggest, /for \(const synonym of semanticSynonymsForQuery\(trimmed\)\)/);
  assert.match(suggest, /for \(const synonymTerm of synonym\.terms\) addUnique\(expandedQueries, synonymTerm\)/);
  assert.match(filters, /searchSynonymBadgesForQuery/);
  assert.match(filters, /synonym: \$\{synonym\.canonical\}/);
});

test('product search APIs query expanded synonym terms before result ranking', async () => {
  const productsRoute = await read('src/app/api/products/route.ts');
  const searchRoute = await read('src/app/api/search/route.ts');

  assert.match(productsRoute, /expandGrocerySearchQuery/);
  assert.match(productsRoute, /matchedSynonyms/);
  assert.match(productsRoute, /Promise\.all\(expansion\.expandedQueries\.map/);
  assert.match(productsRoute, /mergeSearchResults\(batches\)/);
  assert.match(productsRoute, /postgres\.products_tsvector_alias_synonym_expansion/);
  assert.match(searchRoute, /matchedSynonyms/);
  assert.match(searchRoute, /postgres\.products_tsvector_alias_synonym_expansion/);
});
