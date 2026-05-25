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

test('search utilities expose phonetic and edit-distance grocery query expansion', async () => {
  assert.equal(await exists('src/lib/search-suggest.ts'), true);
  const source = await read('src/lib/search-suggest.ts');

  assert.match(source, /buildPhoneticSearchCandidates/);
  assert.match(source, /editDistance/);
  assert.match(source, /grocerySoundKey/);
  assert.match(source, /yoghurt/);
  assert.match(source, /diapers/);
  assert.match(source, /phoneticQueries/);
});

test('search filter scoring ranks exact, phonetic, and edit-distance matches', async () => {
  assert.equal(await exists('src/lib/search-filters.ts'), true);
  const source = await read('src/lib/search-filters.ts');

  assert.match(source, /TypoTolerantSearchMatch/);
  assert.match(source, /typoTolerantSearchMatch/);
  assert.match(source, /reason: 'exact'/);
  assert.match(source, /reason: 'phonetic'/);
  assert.match(source, /reason: 'edit-distance'/);
  assert.match(source, /score: 0\.9/);
});

test('search page and product search view use typo-tolerant ranked candidates', async () => {
  const searchPage = await read('src/app/search/page.tsx');
  const verifiedData = await read('src/lib/verified-data.ts');

  assert.match(searchPage, /phonetic-typo-tolerance/);
  assert.match(searchPage, /edit-distance-ranking/);
  assert.match(verifiedData, /expandGrocerySearchQuery\(query, 6\)/);
  assert.match(verifiedData, /typoTolerantSearchMatch\(expandedQuery/);
  assert.match(verifiedData, /right\.match\.score - left\.match\.score/);
  assert.match(verifiedData, /searchExpansion: queryExpansion/);
});
