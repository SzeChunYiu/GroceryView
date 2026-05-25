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
    matchedTerms: [synonym.matchedTerm]
  }));
}

export type SearchFilterParamValue = string | string[] | undefined;

export type RemovableSearchFilterChip = {
  id: string;
  label: string;
  href: string;
};

type SearchFilterChipKey = 'category' | 'chain' | 'dietary' | 'minPrice' | 'maxPrice';

type SearchFilterChipOptions = {
  basePath?: string;
  labels?: Partial<Record<SearchFilterChipKey, Record<string, string>>>;
};

type SearchFilterParams = Record<string, SearchFilterParamValue>;

const multiValueChipKeys = new Set<SearchFilterChipKey>(['category', 'chain', 'dietary']);

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

  for (const dietary of searchParamValues(searchParams.dietary)) {
    chips.push({
      id: `dietary:${dietary}`,
      label: `Dietary: ${displayChipValue(dietary, options.labels?.dietary)}`,
      href: chipRemovalHref(searchParams, 'dietary', dietary, basePath)
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
