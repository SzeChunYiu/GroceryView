import { semanticSynonymsForQuery } from './search-synonyms';

export type AllergenRiskBadge = {
  label: string;
  matchedTerms: string[];
};

export type SearchSynonymBadge = {
  label: string;
  matchedTerms: string[];
};

export type HeaderSearchFacetChip = {
  kind: 'category' | 'chain' | 'diet' | 'price-range';
  label: string;
  href: string;
  count?: number;
};

type HeaderSearchFacetSource = {
  query: string;
  categoryFacets: Array<{ value: string; count: number; label?: string }>;
  chainFacets: Array<{ value: string; count: number; label?: string }>;
  dietaryFilters: Array<{ value: string; label: string; count: number }>;
  priceRange: { min: number | null; max: number | null };
  formatPrice: (value: number) => string;
};

type AllergenRiskMatcher = {
  label: string;
  riskTerms: string[];
  safeTerms: string[];
};

const allergenRiskMatchers: AllergenRiskMatcher[] = [
  {
    label: 'milk/lactose',
    riskTerms: ['mjölk', 'milk', 'laktos', 'lactose', 'grädde', 'cream', 'ost', 'cheese'],
    safeTerms: ['laktosfri', 'laktosfree', 'lactose-free', 'milk-free', 'mjölkfri', 'vegan']
  },
  {
    label: 'gluten/wheat',
    riskTerms: ['gluten', 'vete', 'wheat', 'råg', 'rye', 'korn', 'barley'],
    safeTerms: ['glutenfri', 'glutenfree', 'gluten-free', 'crossed_ax']
  }
];

function normalizedSearchText(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part)).join(' ').toLocaleLowerCase('sv-SE');
}

function hasTerm(text: string, term: string) {
  return text.includes(term.toLocaleLowerCase('sv-SE'));
}

export function allergenRiskBadgesForText(parts: Array<string | null | undefined>): AllergenRiskBadge[] {
  const text = normalizedSearchText(parts);
  if (!text) return [];

  return allergenRiskMatchers.flatMap((matcher) => {
    if (matcher.safeTerms.some((term) => hasTerm(text, term))) return [];

    const matchedTerms = matcher.riskTerms
      .filter((term) => hasTerm(text, term))
      .map((term) => term.toLocaleLowerCase('sv-SE'));

    return matchedTerms.length > 0
      ? [{ label: `risk: ${matcher.label}`, matchedTerms: [...new Set(matchedTerms)] }]
      : [];
  });
}

export function searchSynonymBadgesForQuery(query: string): SearchSynonymBadge[] {
  return semanticSynonymsForQuery(query).map((synonym) => ({
    label: `synonym: ${synonym.canonical}`,
    matchedTerms: [synonym.matchedTerm]
  }));
}

function productsHref(query: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams();
  if (query.trim()) searchParams.set('q', query.trim());
  for (const [key, value] of Object.entries(params)) {
    if (value.trim()) searchParams.set(key, value.trim());
  }
  return `/products?${searchParams.toString()}`;
}

export function headerSearchFacetChips({
  query,
  categoryFacets,
  chainFacets,
  dietaryFilters,
  priceRange,
  formatPrice
}: HeaderSearchFacetSource): HeaderSearchFacetChip[] {
  const categoryChips = categoryFacets.slice(0, 2).map((facet) => ({
    kind: 'category' as const,
    label: facet.label ?? facet.value,
    href: productsHref(query, { category: facet.value }),
    count: facet.count
  }));

  const chainChips = chainFacets.slice(0, 2).map((facet) => ({
    kind: 'chain' as const,
    label: facet.label ?? facet.value,
    href: productsHref(query, { chain: facet.value }),
    count: facet.count
  }));

  const dietChips = dietaryFilters
    .filter((filter) => filter.count > 0)
    .slice(0, 2)
    .map((filter) => ({
      kind: 'diet' as const,
      label: filter.label,
      href: productsHref(query, { dietary: filter.value }),
      count: filter.count
    }));

  const priceChips: HeaderSearchFacetChip[] = [];
  if (typeof priceRange.min === 'number' && typeof priceRange.max === 'number') {
    const midpoint = Math.round(((priceRange.min + priceRange.max) / 2) * 100) / 100;
    if (priceRange.min < midpoint) {
      priceChips.push({
        kind: 'price-range',
        label: `≤ ${formatPrice(midpoint)}/unit`,
        href: productsHref(query, { maxPrice: String(midpoint) })
      });
    }
    if (midpoint < priceRange.max) {
      priceChips.push({
        kind: 'price-range',
        label: `≥ ${formatPrice(midpoint)}/unit`,
        href: productsHref(query, { minPrice: String(midpoint) })
      });
    }
  }

  return [...categoryChips, ...chainChips, ...dietChips, ...priceChips].slice(0, 8);
}
