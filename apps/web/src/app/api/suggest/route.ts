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
  match: 'prefix' | 'word-prefix' | 'contains' | 'fuzzy';
  detail?: string;
};

type CachedSuggestions = {
  expiresAt: number;
  suggestions: Suggestion[];
};

type SupportedCountry = 'SE' | 'NO' | 'IS';

const SUGGESTION_LIMIT = 10;
const GROUP_ITEM_LIMIT = 4;
const CACHE_TTL_MS = 60_000;
const supportedCountries = new Set<SupportedCountry>(['SE', 'NO', 'IS']);
const suggestionCache = new Map<string, CachedSuggestions>();
const groupLabels: Record<HeaderSuggestGroupKind, string> = {
  brands: 'Brands',
  categories: 'Categories',
  products: 'Products',
  stores: 'Stores'
};

function parseCountry(value: string | null): SupportedCountry | null {
  const country = value?.trim().toUpperCase();
  return country && supportedCountries.has(country as SupportedCountry) ? country as SupportedCountry : null;
}

function normalizedSearchText(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE');
}

function matchScore(label: string, query: string) {
  const normalizedLabel = normalizedSearchText(label);
  const fuzzyMatch = fuzzySuggestMatch(label, query);
  if (normalizedLabel.startsWith(query)) return { score: 0, match: 'prefix' as const };
  if (normalizedLabel.split(/\s+/).some((word) => word.startsWith(query))) return { score: 1, match: 'word-prefix' as const };
  if (normalizedLabel.includes(query)) return { score: 2, match: 'contains' as const };
  if (fuzzyMatch) return { score: 3 + fuzzyMatch.score, match: 'fuzzy' as const };
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

function countryProductCards(country: SupportedCountry) {
  return country === 'SE' ? adaptiveProductCards : [];
}

function countryCategorySummaries(country: SupportedCountry) {
  return country === 'SE' ? categorySummaries : [];
}

function countryStoreUniverse(country: SupportedCountry) {
  return country === 'SE' ? storeUniverse : [];
}

function buildSuggestions(query: string, country: SupportedCountry) {
  const products = countryProductCards(country).flatMap((product): Suggestion[] => {
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

  const categories = countryCategorySummaries(country).flatMap((category): Suggestion[] => {
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

function buildSuggestionGroups(query: string, country: SupportedCountry): HeaderSuggestGroup[] {
  const products = countryProductCards(country).flatMap((product): HeaderSuggestItem[] => {
    const item = groupedItem({
      id: `product:${product.slug}`,
      group: 'products',
      label: product.name,
      href: `/products/${product.slug}`,
      detail: product.brand
    }, query);
    return item ? [item] : [];
  });

  const brands = countryProductCards(country).flatMap((product): HeaderSuggestItem[] => {
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

  const categories = countryCategorySummaries(country).flatMap((category): HeaderSuggestItem[] => {
    const item = groupedItem({
      id: `category:${category.slug}`,
      group: 'categories',
      label: category.label,
      href: `/products?category=${encodeURIComponent(category.slug)}`,
      detail: `${category.openPriceRows + category.chainRows} verified rows`
    }, query);
    return item ? [item] : [];
  });

  const stores = countryStoreUniverse(country).flatMap((store): HeaderSuggestItem[] => {
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

function cachedSuggestions(query: string, country: SupportedCountry, now = Date.now()) {
  const cacheKey = `${country}:${query}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.suggestions;

  const suggestions = buildSuggestions(query, country);
  suggestionCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, suggestions });
  return suggestions;
}

function countryFacets(query: string, country: SupportedCountry) {
  if (country !== 'SE') {
    return headerSearchFacetChips({
      query,
      categoryFacets: [],
      chainFacets: [],
      dietaryFilters: [],
      priceRange: { min: null, max: null },
      formatPrice: formatSek
    });
  }

  const searchView = buildProductSearchView({ q: query });
  return headerSearchFacetChips({
    query,
    categoryFacets: searchView.categoryFacets,
    chainFacets: searchView.chainFacets,
    dietaryFilters: searchView.dietaryFilters,
    priceRange: searchView.priceRange,
    formatPrice: formatSek
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizedSearchText(searchParams.get('q') ?? '');
  const country = parseCountry(searchParams.get('country'));

  if (!country) {
    return NextResponse.json(
      { error: 'country query parameter must be one of SE, NO, or IS.', query, suggestions: [] },
      { status: 400 }
    );
  }

  if (query.length < 1) {
    return NextResponse.json(
      { error: 'q query parameter must be at least 1 character.', query, suggestions: [] },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      query,
      country,
      suggestions: cachedSuggestions(query, country),
      groups: buildSuggestionGroups(query, country),
      facets: countryFacets(query, country),
      limit: SUGGESTION_LIMIT,
      source: 'country-scoped verified product and category snapshots'
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60'
      }
    }
  );
}
