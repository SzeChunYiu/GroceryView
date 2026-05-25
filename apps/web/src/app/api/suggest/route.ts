import { NextResponse } from 'next/server';
import { headerSearchFacetChips } from '@/lib/search-filters';
import { fuzzySuggestMatch, type HeaderSuggestGroup, type HeaderSuggestGroupKind, type HeaderSuggestItem } from '@/lib/search-suggest';
import { adaptiveProductCards, buildProductSearchView, categorySummaries, formatSek, storeUniverse } from '@/lib/verified-data';

export const revalidate = 60;

type SuggestionKind = 'product' | 'category' | 'brand' | 'store';

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

const SUGGESTION_LIMIT = 12;
const GROUP_ITEM_LIMIT = 4;
const CACHE_TTL_MS = 60_000;
const suggestionCache = new Map<string, CachedSuggestions>();
const groupLabels: Record<HeaderSuggestGroupKind, string> = {
  brands: 'Brands',
  categories: 'Categories',
  products: 'Products',
  stores: 'Stores'
};

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

function groupedItem(input: Omit<HeaderSuggestItem, 'matchRanges' | 'score'>, query: string): HeaderSuggestItem | null {
  const match = fuzzySuggestMatch(input.label, query);
  if (!match) return null;
  return { ...input, ...match };
}

function compareGroupItems(left: HeaderSuggestItem, right: HeaderSuggestItem) {
  return left.score - right.score || left.label.localeCompare(right.label, 'sv') || left.id.localeCompare(right.id, 'sv');
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

function uniqueGroupItems(items: HeaderSuggestItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.group}:${item.label.toLocaleLowerCase('sv-SE')}:${item.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSuggestionGroups(query: string): HeaderSuggestGroup[] {
  const products = adaptiveProductCards.flatMap((product): HeaderSuggestItem[] => {
    const item = groupedItem({
      id: `product:${product.slug}`,
      group: 'products',
      label: product.name,
      href: `/products/${product.slug}`,
      detail: product.brand
    }, query);
    return item ? [item] : [];
  });

  const brands = adaptiveProductCards.flatMap((product): HeaderSuggestItem[] => {
    if (!product.brand) return [];
    const item = groupedItem({
      id: `brand:${product.brand}`,
      group: 'brands',
      label: product.brand,
      href: `/products?brand=${encodeURIComponent(product.brand)}`,
      detail: 'Brand filter'
    }, query);
    return item ? [item] : [];
  });

  const categories = categorySummaries.flatMap((category): HeaderSuggestItem[] => {
    const item = groupedItem({
      id: `category:${category.slug}`,
      group: 'categories',
      label: category.label,
      href: `/products?category=${encodeURIComponent(category.slug)}`,
      detail: `${category.openPriceRows + category.chainRows} verified rows`
    }, query);
    return item ? [item] : [];
  });

  const stores = storeUniverse.flatMap((store): HeaderSuggestItem[] => {
    const item = groupedItem({
      id: `store:${store.slug}`,
      group: 'stores',
      label: store.name || store.brand,
      href: `/stores/${store.slug}`,
      detail: [store.brand, store.city].filter(Boolean).join(' · ')
    }, query);
    return item ? [item] : [];
  });

  const groupedEntries: Array<[HeaderSuggestGroupKind, HeaderSuggestItem[]]> = [
    ['products', products],
    ['brands', uniqueGroupItems(brands)],
    ['categories', categories],
    ['stores', stores]
  ];

  return groupedEntries.flatMap(([id, items]) => {
    const rankedItems = uniqueGroupItems(items).sort(compareGroupItems).slice(0, GROUP_ITEM_LIMIT);
    return rankedItems.length > 0 ? [{ id, label: groupLabels[id], items: rankedItems }] : [];
  });
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
      groups: buildSuggestionGroups(query),
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
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60'
      }
    }
  );
}
