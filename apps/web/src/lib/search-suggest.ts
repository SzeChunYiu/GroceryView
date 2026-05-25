import { fuzzyEditDistance, isTypoTolerantTokenMatch } from './search-fuzzy';
import { semanticSynonymsForQuery, synonymExpansionWeight } from './search-synonyms';

export type GrocerySearchExpansion = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  matchedFuzzyAliases: string[];
  matchedSynonyms: string[];
  queryWeights: Record<string, number>;
};

export type GrocerySearchExpansionTelemetry = {
  cacheHit: boolean;
  cacheHitRate: number;
  cacheHits: number;
  cacheRequests: number;
};

export type HeaderSuggestGroupKind = 'products' | 'brands' | 'categories' | 'stores';

export type HeaderSuggestMatchRange = [number, number];

export type HeaderSuggestItem = {
  id: string;
  group: HeaderSuggestGroupKind;
  label: string;
  href: string;
  detail?: string;
  score: number;
  matchRanges: HeaderSuggestMatchRange[];
};

export type HeaderSuggestGroup = {
  id: HeaderSuggestGroupKind;
  label: string;
  items: HeaderSuggestItem[];
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
  { canonical: 'apples', aliases: [{ value: 'apple', weight: 1.05 }, { value: 'äpple', weight: 1.2 }, { value: 'aple', weight: 0.9 }, { value: 'royal gala', weight: 1.1 }] },
  { canonical: 'pasta', aliases: [{ value: 'makaroner', weight: 1.15 }, { value: 'spagetti', weight: 1 }, { value: 'spaghetti', weight: 1.05 }] },
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

export function normalizeSuggestText(value: string): string {
  return normalizeAliasText(value);
}

function mergeMatchedIndexes(indexes: number[]): HeaderSuggestMatchRange[] {
  const sortedIndexes = [...new Set(indexes)].sort((left, right) => left - right);
  const ranges: HeaderSuggestMatchRange[] = [];
  for (const index of sortedIndexes) {
    const lastRange = ranges[ranges.length - 1];
    if (lastRange && lastRange[1] === index) {
      lastRange[1] = index + 1;
    } else {
      ranges.push([index, index + 1]);
    }
  }
  return ranges;
}

export function fuzzySuggestMatch(label: string, query: string): Pick<HeaderSuggestItem, 'matchRanges' | 'score'> | null {
  const normalizedLabel = normalizeSuggestText(label);
  const normalizedQuery = normalizeSuggestText(query);
  if (!normalizedLabel || !normalizedQuery) return null;

  const exactIndex = normalizedLabel.indexOf(normalizedQuery);
  if (exactIndex >= 0) {
    const startsWord = exactIndex === 0 || normalizedLabel[exactIndex - 1] === ' ';
    return {
      matchRanges: [[exactIndex, exactIndex + normalizedQuery.length]],
      score: (startsWord ? 0 : 20) + exactIndex
    };
  }

  let searchFrom = 0;
  const matchedIndexes: number[] = [];
  for (const character of normalizedQuery.replace(/\s/g, '')) {
    const index = normalizedLabel.indexOf(character, searchFrom);
    if (index < 0) return null;
    matchedIndexes.push(index);
    searchFrom = index + 1;
  }

  const span = matchedIndexes.length > 0 ? matchedIndexes[matchedIndexes.length - 1] - matchedIndexes[0] : 0;
  return {
    matchRanges: mergeMatchedIndexes(matchedIndexes),
    score: 50 + span + normalizedLabel.length / 100
  };
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

function fuzzyTokenMatch(queryToken: string, aliasToken: string) {
  return isTypoTolerantTokenMatch(queryToken, aliasToken);
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    const current = [leftIndex + 1];
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      current[rightIndex + 1] = left[leftIndex] === right[rightIndex]
        ? previous[rightIndex]
        : Math.min(previous[rightIndex], previous[rightIndex + 1], current[rightIndex]) + 1;
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? 0;
}

function fuzzyAliasMatch(queryTokens: Set<string>, normalizedAlias: string) {
  const aliasTokens = normalizedAlias.split(' ').filter(Boolean);
  if (aliasTokens.length === 0 || queryTokens.size === 0) return false;
  const queryTokenList = [...queryTokens];
  return aliasTokens.every((aliasToken) => queryTokenList.some((queryToken) => fuzzyTokenMatch(queryToken, aliasToken)));
}

export function phoneticGroceryKey(value: string) {
  return normalizeAliasText(value)
    .replace(/sch|skj|stj|sj/g, '7')
    .replace(/tj|kj|ch/g, '6')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/[cq]/g, 'k')
    .replace(/[vw]/g, 'v')
    .replace(/z/g, 's')
    .replace(/[aeiouy]+/g, 'a')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, '');
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
  const matchedSynonyms: string[] = [];
  const queryWeights: Record<string, number> = {};
  addWeightedQuery(expandedQueries, queryWeights, trimmed, 1);

  for (const entry of groceryAliasEntries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeAliasText(alias.value);
      if (!normalizedAlias) continue;
      if (normalizedQuery === normalizedAlias || tokens.has(normalizedAlias) || normalizedQuery.includes(normalizedAlias)) {
        addUnique(matchedAliases, alias.value);
        addWeightedQuery(expandedQueries, queryWeights, entry.canonical, alias.weight);
        for (const canonicalToken of normalizeAliasText(entry.canonical).split(' ')) addWeightedQuery(expandedQueries, queryWeights, canonicalToken, alias.weight * 0.85);
      } else if (normalizedQuery.length >= 3 && phoneticGroceryKey(normalizedQuery) === phoneticGroceryKey(normalizedAlias)) {
        addUnique(matchedFuzzyAliases, alias.value);
        addWeightedQuery(expandedQueries, queryWeights, entry.canonical, alias.weight * 0.8);
        for (const canonicalToken of normalizeAliasText(entry.canonical).split(' ')) addWeightedQuery(expandedQueries, queryWeights, canonicalToken, alias.weight * 0.7);
      } else if (fuzzyAliasMatch(tokens, normalizedAlias)) {
        addUnique(matchedFuzzyAliases, alias.value);
        addWeightedQuery(expandedQueries, queryWeights, entry.canonical, alias.weight * 0.75);
        for (const canonicalToken of normalizeAliasText(entry.canonical).split(' ')) addWeightedQuery(expandedQueries, queryWeights, canonicalToken, alias.weight * 0.65);
      }
    }
  }

  for (const synonym of semanticSynonymsForQuery(trimmed)) {
    const synonymWeight = synonymExpansionWeight(synonym.intent);
    addUnique(matchedSynonyms, synonym.matchedTerm);
    addWeightedQuery(expandedQueries, queryWeights, synonym.canonical, synonymWeight);
    for (const synonymTerm of synonym.terms) addUnique(expandedQueries, synonymTerm);
    for (const synonymTerm of synonym.terms) queryWeights[synonymTerm] = Math.max(queryWeights[synonymTerm] ?? 0, synonymWeight * 0.85);
  }

  const limitedExpandedQueries = expandedQueries.slice(0, maxQueries);
  return {
    query: trimmed,
    expandedQueries: limitedExpandedQueries,
    matchedAliases,
    matchedFuzzyAliases,
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

export type MisspelledQueryRecovery = {
  query: string;
  didYouMean: string[];
  popularAlternatives: string[];
};

const popularRecoveryQueries = ['mjölk', 'kaffe', 'havregryn', 'ägg', 'yoghurt', 'pasta', 'äpple'];

export function phoneticRankedQueryHints(query: string, maxSuggestions = 4) {
  const normalizedQuery = normalizeAliasText(query);
  const queryKey = phoneticGroceryKey(normalizedQuery);
  if (normalizedQuery.length < 3 || !queryKey) return [];

  const aliasCandidates = groceryAliasEntries.flatMap((entry) => [entry.canonical, ...entry.aliases.map((alias) => alias.value)]);
  return aliasCandidates
    .map((candidate) => {
      const candidateKey = phoneticGroceryKey(candidate);
      return { candidate, distance: fuzzyEditDistance(candidateKey, queryKey), exact: candidateKey === queryKey };
    })
    .filter((row) => row.exact || row.distance <= 1)
    .sort((left, right) => Number(right.exact) - Number(left.exact) || left.distance - right.distance || left.candidate.localeCompare(right.candidate, 'sv'))
    .map((row) => row.candidate)
    .filter((candidate, index, values) => values.findIndex((value) => normalizeAliasText(value) === normalizeAliasText(candidate)) === index)
    .slice(0, maxSuggestions);
}

export function buildMisspelledQueryRecovery(query: string, maxSuggestions = 4): MisspelledQueryRecovery {
  const normalizedQuery = normalizeAliasText(query);
  const aliasCandidates = groceryAliasEntries.flatMap((entry) => [entry.canonical, ...entry.aliases.map((alias) => alias.value)]);
  const didYouMean = aliasCandidates
    .map((candidate) => ({ candidate, distance: fuzzyEditDistance(normalizeAliasText(candidate), normalizedQuery) }))
    .filter((row) => normalizedQuery.length >= 3 && row.distance <= Math.max(2, Math.floor(normalizedQuery.length / 3)))
    .sort((left, right) => left.distance - right.distance || left.candidate.localeCompare(right.candidate, 'sv'))
    .map((row) => row.candidate)
    .filter((candidate, index, values) => values.findIndex((value) => normalizeAliasText(value) === normalizeAliasText(candidate)) === index)
    .slice(0, maxSuggestions);

  const expansion = expandGrocerySearchQuery(query, maxSuggestions);
  const popularAlternatives = [...expansion.expandedQueries, ...phoneticRankedQueryHints(query, maxSuggestions), ...popularRecoveryQueries]
    .filter((candidate) => normalizeAliasText(candidate) !== normalizedQuery)
    .filter((candidate, index, values) => values.findIndex((value) => normalizeAliasText(value) === normalizeAliasText(candidate)) === index)
    .slice(0, maxSuggestions);

  return { query, didYouMean, popularAlternatives };
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
