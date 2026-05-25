import { semanticSynonymsForQuery } from './search-synonyms';

export type GrocerySearchExpansion = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  matchedSynonyms: string[];
  fuzzyQueries: string[];
};

export type GrocerySearchExpansionTelemetry = {
  cacheHit: boolean;
  cacheHitRate: number;
  cacheHits: number;
  cacheRequests: number;
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

const swedishTypoSeeds = ['kaffe', 'mjölk', 'ägg', 'kyckling', 'yoghurt', 'smör', 'tomater', 'bregott', 'garant mjölk'];

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

function trigrams(value: string) {
  const padded = `  ${normalizeAliasText(value)} `;
  const grams = new Set<string>();
  for (let index = 0; index < padded.length - 2; index += 1) grams.add(padded.slice(index, index + 3));
  return grams;
}

export function trigramSimilarity(left: string, right: string) {
  const leftGrams = trigrams(left);
  const rightGrams = trigrams(right);
  if (leftGrams.size === 0 || rightGrams.size === 0) return 0;
  let shared = 0;
  for (const gram of leftGrams) if (rightGrams.has(gram)) shared += 1;
  return (2 * shared) / (leftGrams.size + rightGrams.size);
}

function fuzzyQueriesFor(normalizedQuery: string) {
  if (normalizedQuery.length < 3) return [];
  const candidates = [
    ...groceryAliasEntries.flatMap((entry) => [entry.canonical, ...entry.aliases]),
    ...swedishTypoSeeds
  ];
  return candidates
    .map((candidate) => ({ candidate, score: trigramSimilarity(normalizedQuery, candidate) }))
    .filter((match) => match.score >= 0.45 && normalizeAliasText(match.candidate) !== normalizedQuery)
    .sort((a, b) => b.score - a.score || a.candidate.localeCompare(b.candidate, 'sv'))
    .slice(0, 3)
    .map((match) => match.candidate);
}

const expansionCache = new Map<string, GrocerySearchExpansion>();
let expansionCacheRequests = 0;
let expansionCacheHits = 0;

function cloneExpansion(expansion: GrocerySearchExpansion): GrocerySearchExpansion {
  return {
    query: expansion.query,
    expandedQueries: [...expansion.expandedQueries],
    matchedAliases: [...expansion.matchedAliases],
    matchedSynonyms: [...expansion.matchedSynonyms],
    fuzzyQueries: [...expansion.fuzzyQueries]
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

  const fuzzyQueries = fuzzyQueriesFor(normalizedQuery);
  for (const fuzzyQuery of fuzzyQueries) addUnique(expandedQueries, fuzzyQuery);

  return {
    query: trimmed,
    expandedQueries: expandedQueries.slice(0, maxQueries),
    matchedAliases,
    matchedSynonyms,
    fuzzyQueries
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
