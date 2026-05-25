import { grocerySearchSynonymGroups, semanticSynonymsForQuery } from './search-synonyms';

export type GrocerySearchExpansion = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  matchedFuzzyTerms: string[];
  matchedSynonyms: string[];
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

function addUnique(values: string[], value: string): void {
  const normalized = normalizeAliasText(value);
  if (!normalized) return;
  if (!values.some((existing) => normalizeAliasText(existing) === normalized)) values.push(value);
}

function singularizeToken(token: string) {
  return token.replace(/(arna|erna|orna|ar|er|or|en|et|es|s)$/i, '');
}

function editDistance(left: string, right: string, maxDistance = 2) {
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMin = current[0] ?? 0;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const value = Math.min(
        (previous[rightIndex] ?? maxDistance) + 1,
        (current[rightIndex - 1] ?? maxDistance) + 1,
        (previous[rightIndex - 1] ?? maxDistance) + substitutionCost
      );
      current[rightIndex] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? maxDistance + 1;
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
    termTokens.map((termToken) => editDistance(singularizeToken(queryToken), singularizeToken(termToken)))
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
    ...groceryAliasEntries.flatMap((entry) => [entry.canonical, ...entry.aliases].map((term) => ({ canonical: entry.canonical, term }))),
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
    matchedFuzzyTerms: [...expansion.matchedFuzzyTerms],
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
  const matchedFuzzyTerms: string[] = [];
  const matchedSynonyms: string[] = [];
  addUnique(expandedQueries, trimmed);

  for (const fuzzyMatch of rankFuzzyGrocerySynonyms(trimmed, 4)) {
    addUnique(matchedFuzzyTerms, fuzzyMatch.term);
    addUnique(expandedQueries, fuzzyMatch.canonical);
    addUnique(expandedQueries, fuzzyMatch.term);
  }

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
    matchedFuzzyTerms,
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
