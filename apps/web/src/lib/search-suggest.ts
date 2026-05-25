import { grocerySearchSynonymGroups, semanticSynonymsForQuery } from './search-synonyms';

export type GrocerySearchExpansion = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  matchedFuzzyAliases: string[];
  matchedFuzzyTerms: string[];
  matchedSynonyms: string[];
  queryWeights: Record<string, number>;
};

export type GroceryFuzzyMatch = {
  canonical: string;
  term: string;
  score: number;
  reason: 'exact' | 'diacritic' | 'plural' | 'typo';
};

export type GrocerySearchExpansionTelemetry = {
  cacheHit: boolean;
  cacheHitRate: number;
  cacheHits: number;
  cacheRequests: number;
};

type WeightedAlias = { value: string; weight: number };

const groceryAliasEntries: Array<{ canonical: string; aliases: WeightedAlias[] }> = [
  { canonical: 'coffee', aliases: [{ value: 'kaffe', weight: 1.2 }, { value: 'kafe', weight: 1.05 }, { value: 'java', weight: 0.8 }, { value: 'zoegas', weight: 1.1 }, { value: 'zogas', weight: 0.95 }, { value: 'zoégas', weight: 1.15 }] },
  { canonical: 'Zoégas coffee', aliases: [{ value: 'zoegas', weight: 1.25 }, { value: 'zogas', weight: 1.05 }, { value: 'zoégas brygg', weight: 1.3 }, { value: 'zoegas brygg', weight: 1.25 }] },
  { canonical: 'milk', aliases: [{ value: 'mjolk', weight: 1.15 }, { value: 'mjölk', weight: 1.25 }, { value: 'melk', weight: 0.95 }, { value: 'mjoelk', weight: 1.05 }, { value: 'arla mjolk', weight: 1.1 }, { value: 'arla mjölk', weight: 1.2 }] },
  { canonical: 'eggs', aliases: [{ value: 'agg', weight: 1.05 }, { value: 'ägg', weight: 1.2 }, { value: 'aegg', weight: 0.95 }] },
  { canonical: 'chicken', aliases: [{ value: 'kyck', weight: 1 }, { value: 'kyckling', weight: 1.2 }, { value: 'chix', weight: 0.8 }] },
  { canonical: 'yogurt', aliases: [{ value: 'yoghurt', weight: 1.15 }, { value: 'fil', weight: 0.9 }, { value: 'grekisk yoghurt', weight: 1.2 }] },
  { canonical: 'butter', aliases: [{ value: 'smor', weight: 1.05 }, { value: 'smör', weight: 1.2 }, { value: 'bregott', weight: 1.1 }] },
  { canonical: 'tomatoes', aliases: [{ value: 'tomat', weight: 1.1 }, { value: 'tomater', weight: 1.2 }] },
  { canonical: 'private label milk', aliases: [{ value: 'garant mjolk', weight: 1.15 }, { value: 'garant mjölk', weight: 1.25 }, { value: 'willys mjolk', weight: 1.15 }, { value: 'willys mjölk', weight: 1.25 }] }
];

function normalizeAliasText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/Å/g, 'a')
    .replace(/Ä/g, 'a')
    .replace(/Ö/g, 'o')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function addUnique(values: string[], value: string): void {
  const normalized = normalizeAliasText(value);
  if (!normalized) return;
  if (!values.some((existing) => normalizeAliasText(existing) === normalized)) values.push(value);
}

function addWeightedQuery(values: string[], weights: Record<string, number>, value: string, weight: number): void {
  addUnique(values, value);
  const existingKey = Object.keys(weights).find((key) => normalizeAliasText(key) === normalizeAliasText(value)) ?? value;
  weights[existingKey] = Math.max(weights[existingKey] ?? 0, weight);
}

function singularizeToken(token: string) {
  return token.replace(/(arna|erna|orna|ar|er|or|en|et|ies|es|s)$/i, (suffix) => (suffix.toLowerCase() === 'ies' ? 'y' : ''));
}

function editDistance(left: string, right: string, maxDistance = Number.POSITIVE_INFINITY) {
  if (Number.isFinite(maxDistance) && Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0]!;
    previous[0] = leftIndex;
    let rowMin = previous[0]!;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const insert = previous[rightIndex]! + 1;
      const remove = previous[rightIndex - 1]! + 1;
      const replace = diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      diagonal = previous[rightIndex]!;
      previous[rightIndex] = Math.min(insert, remove, replace);
      rowMin = Math.min(rowMin, previous[rightIndex]!);
    }
    if (Number.isFinite(maxDistance) && rowMin > maxDistance) return maxDistance + 1;
  }
  return previous[right.length]!;
}

function fuzzyTokenMatch(queryToken: string, aliasToken: string) {
  if (queryToken === aliasToken) return true;
  if (queryToken.length >= 4 && aliasToken.startsWith(queryToken)) return true;
  if (aliasToken.length >= 4 && queryToken.startsWith(aliasToken)) return true;
  if (Math.abs(queryToken.length - aliasToken.length) > 1) return false;
  return Math.min(queryToken.length, aliasToken.length) >= 4 && editDistance(queryToken, aliasToken, 1) <= 1;
}

function fuzzyAliasMatch(queryTokens: Set<string>, normalizedAlias: string) {
  const aliasTokens = normalizedAlias.split(' ').filter(Boolean);
  if (aliasTokens.length === 0 || queryTokens.size === 0) return false;
  const queryTokenList = [...queryTokens].map(singularizeToken);
  return aliasTokens.every((aliasToken) => queryTokenList.some((queryToken) => fuzzyTokenMatch(queryToken, singularizeToken(aliasToken))));
}

function fuzzyScore(query: string, term: string): Pick<GroceryFuzzyMatch, 'score' | 'reason'> | null {
  const normalizedQuery = normalizeAliasText(query);
  const normalizedTerm = normalizeAliasText(term);
  if (!normalizedQuery || !normalizedTerm) return null;
  if (normalizedQuery === normalizedTerm) return { score: 1, reason: query === term ? 'exact' : 'diacritic' };

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const termTokens = normalizedTerm.split(' ').filter(Boolean);
  const querySingular = queryTokens.map(singularizeToken).join(' ');
  const termSingular = termTokens.map(singularizeToken).join(' ');
  if (querySingular && querySingular === termSingular) return { score: 0.94, reason: 'plural' };
  if (normalizedTerm.includes(normalizedQuery) || normalizedQuery.includes(normalizedTerm)) return { score: 0.88, reason: 'exact' };

  const bestTokenDistance = Math.min(...queryTokens.flatMap((queryToken) => (
    termTokens.map((termToken) => editDistance(singularizeToken(queryToken), singularizeToken(termToken), 2))
  )));
  const longestToken = Math.max(1, ...queryTokens.map((token) => token.length), ...termTokens.map((token) => token.length));
  const fullDistance = editDistance(querySingular, termSingular, 3);
  const fullScore = 1 - fullDistance / Math.max(normalizedQuery.length, normalizedTerm.length, 1);
  const tokenScore = 1 - bestTokenDistance / longestToken;
  const score = Math.max(fullScore, tokenScore);
  return score >= 0.72 ? { score, reason: bestTokenDistance === 0 ? 'plural' : 'typo' } : null;
}

function fuzzyCandidates() {
  return [
    ...groceryAliasEntries.flatMap((entry) => [entry.canonical, ...entry.aliases.map((alias) => alias.value)].map((term) => ({ canonical: entry.canonical, term }))),
    ...grocerySearchSynonymGroups.flatMap((group) => [group.canonical, ...group.terms].map((term) => ({ canonical: group.canonical, term })))
  ];
}

export function rankFuzzyGrocerySynonyms(query: string, limit = 5): GroceryFuzzyMatch[] {
  const byCanonical = new Map<string, GroceryFuzzyMatch>();
  for (const candidate of fuzzyCandidates()) {
    const scored = fuzzyScore(query, candidate.term);
    if (!scored) continue;
    const match: GroceryFuzzyMatch = { canonical: candidate.canonical, term: candidate.term, ...scored };
    const existing = byCanonical.get(candidate.canonical);
    if (!existing || match.score > existing.score) byCanonical.set(candidate.canonical, match);
  }

  return [...byCanonical.values()]
    .sort((left, right) => right.score - left.score || left.canonical.localeCompare(right.canonical, 'sv'))
    .slice(0, limit);
}

const expansionCache = new Map<string, GrocerySearchExpansion>();
let expansionCacheRequests = 0;
let expansionCacheHits = 0;

function cloneExpansion(expansion: GrocerySearchExpansion): GrocerySearchExpansion {
  return {
    query: expansion.query,
    expandedQueries: [...expansion.expandedQueries],
    matchedAliases: [...expansion.matchedAliases],
    matchedFuzzyAliases: [...expansion.matchedFuzzyAliases],
    matchedFuzzyTerms: [...expansion.matchedFuzzyTerms],
    matchedSynonyms: [...expansion.matchedSynonyms],
    queryWeights: { ...expansion.queryWeights }
  };
}

function expansionTelemetry(cacheHit: boolean): GrocerySearchExpansionTelemetry {
  return {
    cacheHit,
    cacheHitRate: expansionCacheRequests === 0 ? 0 : expansionCacheHits / expansionCacheRequests,
    cacheHits: expansionCacheHits,
    cacheRequests: expansionCacheRequests
  };
}

function buildGrocerySearchExpansion(query: string, maxQueries: number): GrocerySearchExpansion {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const normalizedQuery = normalizeAliasText(trimmed);
  const tokens = new Set(normalizedQuery.split(' ').filter(Boolean));
  const expandedQueries: string[] = [];
  const matchedAliases: string[] = [];
  const matchedFuzzyAliases: string[] = [];
  const matchedFuzzyTerms: string[] = [];
  const matchedSynonyms: string[] = [];
  const queryWeights: Record<string, number> = {};
  addWeightedQuery(expandedQueries, queryWeights, trimmed, 1);

  for (const fuzzyMatch of rankFuzzyGrocerySynonyms(trimmed, 4)) {
    addUnique(matchedFuzzyTerms, fuzzyMatch.term);
    addWeightedQuery(expandedQueries, queryWeights, fuzzyMatch.canonical, fuzzyMatch.score);
    addWeightedQuery(expandedQueries, queryWeights, fuzzyMatch.term, fuzzyMatch.score * 0.9);
  }

  for (const entry of groceryAliasEntries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeAliasText(alias.value);
      if (!normalizedAlias) continue;
      if (normalizedQuery === normalizedAlias || tokens.has(normalizedAlias) || normalizedQuery.includes(normalizedAlias)) {
        addUnique(matchedAliases, alias.value);
        addWeightedQuery(expandedQueries, queryWeights, entry.canonical, alias.weight);
        for (const canonicalToken of normalizeAliasText(entry.canonical).split(' ')) addWeightedQuery(expandedQueries, queryWeights, canonicalToken, alias.weight * 0.85);
      } else if (fuzzyAliasMatch(tokens, normalizedAlias)) {
        addUnique(matchedFuzzyAliases, alias.value);
        addUnique(matchedFuzzyTerms, alias.value);
        addWeightedQuery(expandedQueries, queryWeights, entry.canonical, alias.weight * 0.75);
        for (const canonicalToken of normalizeAliasText(entry.canonical).split(' ')) addWeightedQuery(expandedQueries, queryWeights, canonicalToken, alias.weight * 0.65);
      }
    }
  }

  for (const synonym of semanticSynonymsForQuery(trimmed)) {
    addUnique(matchedSynonyms, synonym.matchedTerm);
    addWeightedQuery(expandedQueries, queryWeights, synonym.canonical, 0.9);
    for (const synonymTerm of synonym.terms) addUnique(expandedQueries, synonymTerm);
    for (const synonymTerm of synonym.terms) queryWeights[synonymTerm] = Math.max(queryWeights[synonymTerm] ?? 0, 0.75);
  }

  const limitedExpandedQueries = expandedQueries.slice(0, maxQueries);
  return {
    query: trimmed,
    expandedQueries: limitedExpandedQueries,
    matchedAliases,
    matchedFuzzyAliases,
    matchedFuzzyTerms,
    matchedSynonyms,
    queryWeights: Object.fromEntries(limitedExpandedQueries.map((expandedQuery) => [expandedQuery, queryWeights[expandedQuery] ?? 1]))
  };
}

export function expandGrocerySearchQueryWithTelemetry(query: string, maxQueries = 5) {
  expansionCacheRequests += 1;
  const cacheKey = `${maxQueries}:${query.trim().replace(/\s+/g, ' ')}`;
  const cached = expansionCache.get(cacheKey);
  if (cached) {
    expansionCacheHits += 1;
    return {
      expansion: cloneExpansion(cached),
      telemetry: expansionTelemetry(true)
    };
  }

  const expansion = buildGrocerySearchExpansion(query, maxQueries);
  expansionCache.set(cacheKey, cloneExpansion(expansion));

  return {
    expansion,
    telemetry: expansionTelemetry(false)
  };
}

export function expandGrocerySearchQuery(query: string, maxQueries = 5): GrocerySearchExpansion {
  return expandGrocerySearchQueryWithTelemetry(query, maxQueries).expansion;
}

export type CategorySearchProduct = {
  name: string;
  brand?: string | null;
  category?: string | null;
};

export type CategorySearchSuggestion = {
  query: string;
  categorySlug: string;
  reason: 'popular-brand' | 'product-match' | 'expanded-query';
  count: number;
};

export function buildCategoryScopedSearchSuggestions(
  categorySlug: string,
  products: CategorySearchProduct[],
  seedQuery = '',
  maxSuggestions = 6
): CategorySearchSuggestion[] {
  const scopedProducts = products.filter((product) => normalizeAliasText(product.category ?? '') === normalizeAliasText(categorySlug));
  const suggestions: CategorySearchSuggestion[] = [];

  for (const product of scopedProducts) {
    if (product.brand) {
      const existing = suggestions.find((suggestion) => normalizeAliasText(suggestion.query) === normalizeAliasText(product.brand ?? ''));
      if (existing) existing.count += 1;
      else suggestions.push({ query: product.brand, categorySlug, reason: 'popular-brand', count: 1 });
    }
  }

  for (const product of scopedProducts.slice(0, 12)) {
    const firstWords = product.name.split(/\s+/).slice(0, 3).join(' ');
    if (firstWords && !suggestions.some((suggestion) => normalizeAliasText(suggestion.query) === normalizeAliasText(firstWords))) {
      suggestions.push({ query: firstWords, categorySlug, reason: 'product-match', count: 1 });
    }
  }

  if (seedQuery.trim()) {
    for (const query of expandGrocerySearchQuery(seedQuery, 4).expandedQueries) {
      if (!suggestions.some((suggestion) => normalizeAliasText(suggestion.query) === normalizeAliasText(query))) {
        suggestions.push({ query, categorySlug, reason: 'expanded-query', count: 1 });
      }
    }
  }

  return suggestions
    .sort((left, right) => right.count - left.count || left.query.localeCompare(right.query))
    .slice(0, maxSuggestions);
}
