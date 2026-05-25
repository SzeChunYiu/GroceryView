import type { ProductSearchResult } from '@groceryview/db';
import type { GrocerySearchExpansion } from './search-suggest';

export function normalizeFuzzyText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function fuzzyEditDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0]!;
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const insert = previous[rightIndex]! + 1;
      const remove = previous[rightIndex - 1]! + 1;
      const replace = diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      diagonal = previous[rightIndex]!;
      previous[rightIndex] = Math.min(insert, remove, replace);
    }
  }
  return previous[right.length]!;
}

export function isTypoTolerantTokenMatch(queryToken: string, candidateToken: string) {
  if (queryToken === candidateToken) return true;
  if (queryToken.length >= 4 && candidateToken.startsWith(queryToken)) return true;
  if (candidateToken.length >= 4 && queryToken.startsWith(candidateToken)) return true;
  if (Math.abs(queryToken.length - candidateToken.length) > 1) return false;
  return Math.min(queryToken.length, candidateToken.length) >= 4 && fuzzyEditDistance(queryToken, candidateToken) <= 1;
}

function fuzzyTextScore(query: string, candidate: string) {
  const normalizedQuery = normalizeFuzzyText(query);
  const normalizedCandidate = normalizeFuzzyText(candidate);
  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedCandidate === normalizedQuery) return 2.5;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 2;
  if (normalizedCandidate.includes(normalizedQuery)) return 1.5;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const candidateTokens = normalizedCandidate.split(' ').filter(Boolean);
  if (queryTokens.length === 0 || candidateTokens.length === 0) return 0;

  const matchedTokens = queryTokens.filter((queryToken) => (
    candidateTokens.some((candidateToken) => isTypoTolerantTokenMatch(queryToken, candidateToken))
  )).length;

  return matchedTokens === 0 ? 0 : matchedTokens / queryTokens.length;
}

export function fuzzyProductSearchQueries(query: string, expansion: GrocerySearchExpansion) {
  const queries = [
    query,
    ...expansion.expandedQueries,
    ...expansion.matchedAliases,
    ...expansion.matchedFuzzyAliases,
    ...expansion.matchedSynonyms
  ];
  const seen = new Set<string>();
  return queries.filter((candidate) => {
    const normalized = normalizeFuzzyText(candidate);
    if (normalized.length < 2 || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).slice(0, 8);
}

export function fuzzyProductRank(query: string, product: ProductSearchResult, expansion: GrocerySearchExpansion) {
  const candidateText = [product.name, product.brand, product.slug].filter(Boolean).join(' ');
  const directScore = fuzzyTextScore(query, candidateText);
  const expandedScore = expansion.expandedQueries.reduce((bestScore, expandedQuery) => (
    Math.max(bestScore, fuzzyTextScore(expandedQuery, candidateText) * (expansion.queryWeights[expandedQuery] ?? 1) * 0.75)
  ), 0);
  return product.searchRank + Math.max(directScore, expandedScore);
}

export function rankFuzzyProductResults(query: string, batches: ProductSearchResult[][], expansion: GrocerySearchExpansion) {
  const byId = new Map<string, ProductSearchResult>();
  for (const results of batches) {
    for (const result of results) {
      const adjustedResult = { ...result, searchRank: fuzzyProductRank(query, result, expansion) };
      const existing = byId.get(result.id);
      if (!existing || adjustedResult.searchRank > existing.searchRank) byId.set(result.id, adjustedResult);
    }
  }
  return [...byId.values()].sort((left, right) => right.searchRank - left.searchRank || left.name.localeCompare(right.name, 'sv')).slice(0, 8);
}
