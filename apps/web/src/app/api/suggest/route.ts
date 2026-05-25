import { NextResponse } from 'next/server';
import { readOnlyEdgeCacheHeaders } from '@/lib/cache-headers';
import { headerSearchFacetChips } from '@/lib/search-filters';
import { adaptiveProductCards, buildProductSearchView, categorySummaries, formatSek } from '@/lib/verified-data';

export const revalidate = 60;

type SuggestionKind = 'product' | 'category';

type Suggestion = {
  type: SuggestionKind;
  label: string;
  href: string;
  slug: string;
  score: number;
  match: 'prefix' | 'word-prefix' | 'contains';
  detail?: string;
};

type CachedSuggestions = {
  expiresAt: number;
  suggestions: Suggestion[];
};

const SUGGESTION_LIMIT = 10;
const CACHE_TTL_MS = 60_000;
const suggestionCache = new Map<string, CachedSuggestions>();

function normalizedSearchText(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE');
}

function matchScore(label: string, query: string) {
  const normalizedLabel = normalizedSearchText(label);
  if (normalizedLabel.startsWith(query)) return { score: 0, match: 'prefix' as const };
  if (normalizedLabel.split(/\s+/).some((word) => word.startsWith(query))) return { score: 1, match: 'word-prefix' as const };
  if (normalizedLabel.includes(query)) return { score: 2, match: 'contains' as const };
  return null;
}

function compareSuggestions(left: Suggestion, right: Suggestion) {
  return (
    left.score - right.score
    || (left.type === right.type ? 0 : left.type === 'product' ? -1 : 1)
    || left.label.localeCompare(right.label, 'sv')
    || left.slug.localeCompare(right.slug, 'sv')
  );
}

function buildSuggestions(query: string) {
  const products = adaptiveProductCards.flatMap((product): Suggestion[] => {
    const match = matchScore(product.name, query);
    if (!match) return [];
    return [{
      type: 'product',
      label: product.name,
      href: `/products/${product.slug}`,
      slug: product.slug,
      detail: product.brand,
      ...match
    }];
  });

  const categories = categorySummaries.flatMap((category): Suggestion[] => {
    const match = matchScore(category.label, query);
    if (!match) return [];
    return [{
      type: 'category',
      label: category.label,
      href: `/categories/${category.slug}`,
      slug: category.slug,
      detail: `${category.openPriceRows + category.chainRows} verified rows`,
      ...match
    }];
  });

  return [...products, ...categories].sort(compareSuggestions).slice(0, SUGGESTION_LIMIT);
}

function cachedSuggestions(query: string, now = Date.now()) {
  const cached = suggestionCache.get(query);
  if (cached && cached.expiresAt > now) return cached.suggestions;

  const suggestions = buildSuggestions(query);
  suggestionCache.set(query, { expiresAt: now + CACHE_TTL_MS, suggestions });
  return suggestions;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizedSearchText(searchParams.get('q') ?? '');

  if (query.length < 1) {
    return NextResponse.json(
      { error: 'q query parameter must be at least 1 character.', query, suggestions: [] },
      { status: 400 }
    );
  }

  const searchView = buildProductSearchView({ q: query });

  return NextResponse.json(
    {
      query,
      suggestions: cachedSuggestions(query),
      facets: headerSearchFacetChips({
        query,
        categoryFacets: searchView.categoryFacets,
        chainFacets: searchView.chainFacets,
        dietaryFilters: searchView.dietaryFilters,
        priceRange: searchView.priceRange,
        formatPrice: formatSek
      }),
      limit: SUGGESTION_LIMIT,
      source: 'verified product and category snapshots'
    },
    {
      headers: readOnlyEdgeCacheHeaders('suggest')
    }
  );
}
