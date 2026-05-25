import assert from 'node:assert/strict';
import test from 'node:test';
import { expandGrocerySearchQuery, rankFuzzyGrocerySynonyms } from '../search-suggest.js';

test('fuzzy grocery matcher ranks common misspellings before exact fallback', () => {
  const [match] = rankFuzzyGrocerySynonyms('yoghrt');

  assert.equal(match?.canonical, 'yogurt');
  assert.equal(match?.reason, 'typo');
  assert.ok((match?.score ?? 0) >= 0.72);
});

test('grocery search expansion tolerates Swedish diacritics and extra typed letters', () => {
  const expansion = expandGrocerySearchQuery('mjölkk', 6);

  assert.ok(expansion.expandedQueries.includes('milk'));
  assert.ok(expansion.matchedFuzzyTerms.some((term) => /mjölk|mjolk/.test(term)));
});

test('grocery search expansion singularizes English plural produce terms', () => {
  const expansion = expandGrocerySearchQuery('tomatos', 6);

  assert.ok(expansion.expandedQueries.includes('tomatoes'));
  assert.ok(expansion.matchedFuzzyTerms.includes('tomatoes'));
});
