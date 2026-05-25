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
