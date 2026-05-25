import { semanticSynonymsForQuery } from './search-synonyms';

export type GrocerySearchExpansion = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  matchedSynonyms: string[];
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

const groceryAliasEntries: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'coffee', aliases: ['kaffe', 'kafe', 'java', 'zoegas', 'zogas', 'zoégas'] },
  { canonical: 'Zoégas coffee', aliases: ['zoegas', 'zogas', 'zoégas brygg', 'zoegas brygg'] },
  { canonical: 'milk', aliases: ['mjolk', 'mjölk', 'melk', 'mjoelk', 'arla mjolk', 'arla mjölk'] },
  { canonical: 'eggs', aliases: ['agg', 'ägg', 'aegg'] },
  { canonical: 'chicken', aliases: ['kyck', 'kyckling', 'chix'] },
  { canonical: 'yogurt', aliases: ['yoghurt', 'fil', 'grekisk yoghurt'] },
  { canonical: 'butter', aliases: ['smor', 'smör', 'bregott'] },
  { canonical: 'tomatoes', aliases: ['tomat', 'tomater'] },
  { canonical: 'private label milk', aliases: ['garant mjolk', 'garant mjölk', 'willys mjolk', 'willys mjölk'] }
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

const expansionCache = new Map<string, GrocerySearchExpansion>();
let expansionCacheRequests = 0;
let expansionCacheHits = 0;

function cloneExpansion(expansion: GrocerySearchExpansion): GrocerySearchExpansion {
  return {
    query: expansion.query,
    expandedQueries: [...expansion.expandedQueries],
    matchedAliases: [...expansion.matchedAliases],
    matchedSynonyms: [...expansion.matchedSynonyms]
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
  const matchedSynonyms: string[] = [];
  addUnique(expandedQueries, trimmed);

  for (const entry of groceryAliasEntries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeAliasText(alias);
      if (!normalizedAlias) continue;
      if (normalizedQuery === normalizedAlias || tokens.has(normalizedAlias) || normalizedQuery.includes(normalizedAlias)) {
        addUnique(matchedAliases, alias);
        addUnique(expandedQueries, entry.canonical);
        for (const canonicalToken of normalizeAliasText(entry.canonical).split(' ')) addUnique(expandedQueries, canonicalToken);
      }
    }
  }

  for (const synonym of semanticSynonymsForQuery(trimmed)) {
    addUnique(matchedSynonyms, synonym.matchedTerm);
    addUnique(expandedQueries, synonym.canonical);
    for (const synonymTerm of synonym.terms) addUnique(expandedQueries, synonymTerm);
  }

  return {
    query: trimmed,
    expandedQueries: expandedQueries.slice(0, maxQueries),
    matchedAliases,
    matchedSynonyms
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
