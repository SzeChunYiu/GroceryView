import { semanticSynonymsForQuery } from './search-synonyms';

export type AllergenRiskBadge = {
  label: string;
  matchedTerms: string[];
};

export type SearchSynonymBadge = {
  label: string;
  matchedTerms: string[];
};

export type SearchExplanationBadge = {
  kind: 'name' | 'brand' | 'category' | 'barcode' | 'synonym';
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

function normalizedExplanationText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9åäö]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function searchTerms(query: string) {
  const normalized = normalizedExplanationText(query);
  return normalized.split(' ').filter((term) => term.length > 1);
}

function matchesSearchText(value: string | null | undefined, query: string) {
  const normalizedValue = normalizedExplanationText(value);
  const normalizedQuery = normalizedExplanationText(query);
  if (!normalizedValue || !normalizedQuery) return false;
  if (normalizedValue.includes(normalizedQuery)) return true;
  const terms = searchTerms(query);
  return terms.length > 0 && terms.some((term) => normalizedValue.includes(term));
}

function pushUniqueBadge(badges: SearchExplanationBadge[], badge: SearchExplanationBadge) {
  if (!badges.some((existing) => existing.kind === badge.kind && existing.label === badge.label)) {
    badges.push({
      ...badge,
      matchedTerms: [...new Set(badge.matchedTerms.filter(Boolean))]
    });
  }
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
    matchedTerms: [...new Set([synonym.matchedTerm, ...synonym.terms.slice(0, 2)])]
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

export type SearchFilterParamValue = string | string[] | undefined;

export type RemovableSearchFilterChip = {
  id: string;
  label: string;
  href: string;
};

type SearchFilterChipKey = 'brand' | 'category' | 'chain' | 'dietary' | 'inStockOnly' | 'label' | 'minConfidence' | 'minPrice' | 'maxPrice';

type SearchFilterChipOptions = {
  basePath?: string;
  labels?: Partial<Record<SearchFilterChipKey, Record<string, string>>>;
};

type SearchFilterParams = Record<string, SearchFilterParamValue>;

const multiValueChipKeys = new Set<SearchFilterChipKey>(['category', 'chain', 'dietary', 'label']);

function searchParamValues(value: SearchFilterParamValue): string[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  return rawValues.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean);
}

function appendOriginalSearchParam(params: URLSearchParams, key: string, value: SearchFilterParamValue) {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  for (const rawValue of rawValues) {
    const trimmed = rawValue.trim();
    if (trimmed) params.append(key, trimmed);
  }
}

function chipRemovalHref(searchParams: SearchFilterParams, keyToRemove: SearchFilterChipKey, valueToRemove: string, basePath: string) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page') continue;

    if (key !== keyToRemove) {
      appendOriginalSearchParam(params, key, value);
      continue;
    }

    if (!multiValueChipKeys.has(keyToRemove)) continue;

    for (const valueCandidate of searchParamValues(value)) {
      if (valueCandidate !== valueToRemove) params.append(key, valueCandidate);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function displayChipValue(value: string, labelMap: Record<string, string> | undefined) {
  return labelMap?.[value] ?? value;
}

export function buildRemovableSearchFilterChips(searchParams: SearchFilterParams, options: SearchFilterChipOptions = {}): RemovableSearchFilterChip[] {
  const basePath = options.basePath ?? '/products';
  const chips: RemovableSearchFilterChip[] = [];

  for (const category of searchParamValues(searchParams.category)) {
    chips.push({
      id: `category:${category}`,
      label: `Category: ${displayChipValue(category, options.labels?.category)}`,
      href: chipRemovalHref(searchParams, 'category', category, basePath)
    });
  }

  for (const chain of searchParamValues(searchParams.chain)) {
    chips.push({
      id: `chain:${chain}`,
      label: `Store: ${displayChipValue(chain, options.labels?.chain)}`,
      href: chipRemovalHref(searchParams, 'chain', chain, basePath)
    });
  }

  for (const brand of searchParamValues(searchParams.brand)) {
    chips.push({
      id: `brand:${brand}`,
      label: `Brand: ${displayChipValue(brand, options.labels?.brand)}`,
      href: chipRemovalHref(searchParams, 'brand', brand, basePath)
    });
  }

  for (const dietary of searchParamValues(searchParams.dietary)) {
    chips.push({
      id: `dietary:${dietary}`,
      label: `Dietary: ${displayChipValue(dietary, options.labels?.dietary)}`,
      href: chipRemovalHref(searchParams, 'dietary', dietary, basePath)
    });
  }

  for (const label of searchParamValues(searchParams.label)) {
    chips.push({
      id: `label:${label}`,
      label: `Certification: ${displayChipValue(label, options.labels?.label)}`,
      href: chipRemovalHref(searchParams, 'label', label, basePath)
    });
  }

  const minPrice = searchParamValues(searchParams.minPrice)[0];
  if (minPrice) {
    chips.push({
      id: `minPrice:${minPrice}`,
      label: `Min unit price: ${minPrice} SEK`,
      href: chipRemovalHref(searchParams, 'minPrice', minPrice, basePath)
    });
  }

  const maxPrice = searchParamValues(searchParams.maxPrice)[0];
  if (maxPrice) {
    chips.push({
      id: `maxPrice:${maxPrice}`,
      label: `Max unit price: ${maxPrice} SEK`,
      href: chipRemovalHref(searchParams, 'maxPrice', maxPrice, basePath)
    });
  }

  const minConfidence = searchParamValues(searchParams.minConfidence)[0];
  if (minConfidence) {
    chips.push({
      id: `minConfidence:${minConfidence}`,
      label: `Min confidence: ${minConfidence}`,
      href: chipRemovalHref(searchParams, 'minConfidence', minConfidence, basePath)
    });
  }

  const inStockOnly = searchParamValues(searchParams.inStockOnly)[0];
  if (inStockOnly === 'true' || inStockOnly === '1' || inStockOnly === 'on') {
    chips.push({
      id: 'inStockOnly:true',
      label: 'Availability: in stock only',
      href: chipRemovalHref(searchParams, 'inStockOnly', inStockOnly, basePath)
    });
  }

  return chips;
}

export function searchExplanationBadgesForProduct({
  barcode,
  brand,
  category,
  matchedSynonyms = [],
  name,
  query
}: {
  barcode?: string | null;
  brand?: string | null;
  category?: string | null;
  matchedSynonyms?: string[];
  name: string;
  query: string;
}): SearchExplanationBadge[] {
  const badges: SearchExplanationBadge[] = [];
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return badges;

  if (matchesSearchText(brand, trimmedQuery)) {
    pushUniqueBadge(badges, { kind: 'brand', label: 'brand match', matchedTerms: [trimmedQuery] });
  }

  if (matchesSearchText(category, trimmedQuery)) {
    pushUniqueBadge(badges, { kind: 'category', label: 'category match', matchedTerms: [trimmedQuery] });
  }

  const queryDigits = trimmedQuery.replace(/\D/g, '');
  const barcodeDigits = (barcode ?? '').replace(/\D/g, '');
  if (queryDigits.length >= 4 && barcodeDigits.includes(queryDigits)) {
    pushUniqueBadge(badges, { kind: 'barcode', label: 'barcode match', matchedTerms: [queryDigits] });
  }

  if (matchedSynonyms.length > 0) {
    pushUniqueBadge(badges, { kind: 'synonym', label: 'synonym match', matchedTerms: matchedSynonyms });
  }

  if (matchesSearchText(name, trimmedQuery)) {
    pushUniqueBadge(badges, { kind: 'name', label: 'name match', matchedTerms: [trimmedQuery] });
  }

  if (badges.length === 0) {
    pushUniqueBadge(badges, { kind: 'name', label: 'ranked text match', matchedTerms: searchTerms(trimmedQuery).slice(0, 3) });
  }

  return badges;
}
