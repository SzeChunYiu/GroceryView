import { semanticSynonymsForQuery } from './search-synonyms';

export type GrocerySearchRankedQuery = {
  query: string;
  score: number;
  reason: 'original' | 'swedish_alias' | 'fuzzy_alias' | 'synonym';
  matchedAlias?: string;
};

export type GrocerySearchExpansion = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  matchedSynonyms: string[];
  rankedQueries: GrocerySearchRankedQuery[];
};

export type GrocerySearchExpansionTelemetry = {
  cacheHit: boolean;
  cacheHitRate: number;
  cacheHits: number;
  cacheRequests: number;
};

const groceryAliasEntries: Array<{ canonical: string; aliases: string[]; swedishAliases?: string[] }> = [
  { canonical: 'coffee', aliases: ['kaffe', 'kafe', 'java', 'zoegas', 'zogas', 'zoégas'], swedishAliases: ['kaffe', 'zoegas', 'zogas', 'zoégas'] },
  { canonical: 'Zoégas coffee', aliases: ['zoegas', 'zogas', 'zoégas brygg', 'zoegas brygg'], swedishAliases: ['zoegas', 'zogas', 'zoégas brygg', 'zoegas brygg'] },
  { canonical: 'milk', aliases: ['mjolk', 'mjölk', 'melk', 'mjoelk', 'arla mjolk', 'arla mjölk'], swedishAliases: ['mjolk', 'mjölk', 'arla mjolk', 'arla mjölk'] },
  { canonical: 'eggs', aliases: ['agg', 'ägg', 'aegg'], swedishAliases: ['agg', 'ägg'] },
  { canonical: 'chicken', aliases: ['kyck', 'kyckling', 'chix'], swedishAliases: ['kyck', 'kyckling'] },
  { canonical: 'yogurt', aliases: ['yoghurt', 'fil', 'grekisk yoghurt'], swedishAliases: ['fil', 'grekisk yoghurt'] },
  { canonical: 'butter', aliases: ['smor', 'smör', 'bregott'], swedishAliases: ['smor', 'smör', 'bregott'] },
  { canonical: 'tomatoes', aliases: ['tomat', 'tomater'], swedishAliases: ['tomat', 'tomater'] },
  { canonical: 'private label milk', aliases: ['garant mjolk', 'garant mjölk', 'willys mjolk', 'willys mjölk'], swedishAliases: ['garant mjolk', 'garant mjölk', 'willys mjolk', 'willys mjölk'] }
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

function trigrams(value: string): Set<string> {
  const padded = `  ${normalizeAliasText(value)}  `;
  const grams = new Set<string>();
  for (let index = 0; index <= padded.length - 3; index += 1) grams.add(padded.slice(index, index + 3));
  return grams;
}

export function trigramSimilarity(left: string, right: string): number {
  const leftGrams = trigrams(left);
  const rightGrams = trigrams(right);
  if (leftGrams.size === 0 || rightGrams.size === 0) return 0;

  let overlap = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) overlap += 1;
  }

  return (2 * overlap) / (leftGrams.size + rightGrams.size);
}

function addRankedQuery(values: GrocerySearchRankedQuery[], rankedQuery: GrocerySearchRankedQuery): void {
  const normalized = normalizeAliasText(rankedQuery.query);
  if (!normalized) return;
  const existing = values.find((value) => normalizeAliasText(value.query) === normalized);
  if (!existing) {
    values.push(rankedQuery);
    return;
  }

  if (rankedQuery.score > existing.score) {
    existing.score = rankedQuery.score;
    existing.reason = rankedQuery.reason;
    existing.matchedAlias = rankedQuery.matchedAlias;
  }
}

export function scoreSearchAliasMatch(query: string, alias: string): number {
  const normalizedQuery = normalizeAliasText(query);
  const normalizedAlias = normalizeAliasText(alias);
  if (!normalizedQuery || !normalizedAlias) return 0;
  if (normalizedQuery === normalizedAlias) return 1;
  if (normalizedAlias.includes(normalizedQuery) || normalizedQuery.includes(normalizedAlias)) return 0.88;
  return trigramSimilarity(normalizedQuery, normalizedAlias);
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
    rankedQueries: expansion.rankedQueries.map((rankedQuery) => ({ ...rankedQuery }))
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
  const rankedQueries: GrocerySearchRankedQuery[] = [];
  addUnique(expandedQueries, trimmed);
  addRankedQuery(rankedQueries, { query: trimmed, score: 1, reason: 'original' });

  for (const entry of groceryAliasEntries) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeAliasText(alias);
      if (!normalizedAlias) continue;
      const aliasScore = scoreSearchAliasMatch(normalizedQuery, normalizedAlias);
      const directAliasMatch = normalizedQuery === normalizedAlias || tokens.has(normalizedAlias) || normalizedQuery.includes(normalizedAlias);
      if (directAliasMatch || aliasScore >= 0.58) {
        const isSwedishAlias = entry.swedishAliases?.some((swedishAlias) => normalizeAliasText(swedishAlias) === normalizedAlias) ?? false;
        const reason = directAliasMatch && isSwedishAlias ? 'swedish_alias' : 'fuzzy_alias';
        addUnique(matchedAliases, alias);
        addUnique(expandedQueries, entry.canonical);
        addRankedQuery(rankedQueries, { query: entry.canonical, score: isSwedishAlias ? 0.94 : Math.max(0.72, aliasScore), reason, matchedAlias: alias });
        for (const canonicalToken of normalizeAliasText(entry.canonical).split(' ')) {
          addUnique(expandedQueries, canonicalToken);
          addRankedQuery(rankedQueries, { query: canonicalToken, score: 0.72, reason, matchedAlias: alias });
        }
      }
    }
  }

  for (const synonym of semanticSynonymsForQuery(trimmed)) {
    addUnique(matchedSynonyms, synonym.matchedTerm);
    addUnique(expandedQueries, synonym.canonical);
    addRankedQuery(rankedQueries, { query: synonym.canonical, score: 0.82, reason: 'synonym', matchedAlias: synonym.matchedTerm });
    for (const synonymTerm of synonym.terms) {
      addUnique(expandedQueries, synonymTerm);
      addRankedQuery(rankedQueries, { query: synonymTerm, score: 0.74, reason: 'synonym', matchedAlias: synonym.matchedTerm });
    }
  }

  const returnedQueries = expandedQueries.slice(0, maxQueries);

  return {
    query: trimmed,
    expandedQueries: returnedQueries,
    matchedAliases,
    matchedSynonyms,
    rankedQueries: rankedQueries
      .filter((rankedQuery) => returnedQueries.some((expandedQuery) => normalizeAliasText(expandedQuery) === normalizeAliasText(rankedQuery.query)))
      .sort((a, b) => b.score - a.score || a.query.localeCompare(b.query))
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
