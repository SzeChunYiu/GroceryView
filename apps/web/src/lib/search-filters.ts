export const allergenAvoidanceParam = 'excludeAllergenRisks' as const;

export const commonAllergenRiskTerms = [
  {
    label: 'gluten / wheat',
    terms: ['gluten', 'glutenhaltig', 'wheat', 'vete', 'vetemjöl', 'durum', 'spelt', 'dinkel', 'råg', 'korn', 'barley', 'rye']
  },
  {
    label: 'milk / lactose',
    terms: ['mjölk', 'milk', 'laktos', 'lactose', 'grädde', 'cream', 'ost', 'cheese', 'yoghurt', 'yogurt', 'kvarg', 'smör', 'butter']
  },
  {
    label: 'egg',
    terms: ['ägg', 'egg', 'eggs', 'äggvita', 'äggula']
  },
  {
    label: 'peanut / tree nut',
    terms: ['jordnöt', 'peanut', 'hasselnöt', 'hazelnut', 'valnöt', 'walnut', 'cashew', 'pistage', 'pistachio', 'mandel', 'almond', 'nötter', 'nuts']
  },
  {
    label: 'soy',
    terms: ['soja', 'soy', 'soya']
  },
  {
    label: 'fish / shellfish',
    terms: ['fisk', 'fish', 'lax', 'salmon', 'tonfisk', 'tuna', 'räka', 'räkor', 'shrimp', 'skaldjur', 'shellfish', 'crab', 'krabba']
  },
  {
    label: 'sesame / mustard',
    terms: ['sesam', 'sesame', 'senap', 'mustard']
  }
] as const;

export type AllergenRiskLabel = typeof commonAllergenRiskTerms[number]['label'];

type SearchParamValue = string | string[] | undefined;

function firstSearchValue(value: SearchParamValue): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? '';
}

export function isSearchToggleEnabled(value: SearchParamValue): boolean {
  return ['1', 'true', 'yes', 'on'].includes(firstSearchValue(value).toLocaleLowerCase('sv-SE'));
}

function normalizeForRiskScan(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('sv-SE')
    .replace(/[|_/.,;:()[\]{}+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsTerm(haystack: string, term: string): boolean {
  const normalizedTerm = normalizeForRiskScan(term);
  if (!normalizedTerm) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm)}($|\\s)`, 'u').test(haystack);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function allergenRiskLabelsForText(parts: readonly Array<string | null | undefined>): AllergenRiskLabel[] {
  const haystack = normalizeForRiskScan(parts.filter((part): part is string => Boolean(part?.trim())).join(' '));
  if (!haystack) return [];

  return commonAllergenRiskTerms
    .filter((risk) => risk.terms.some((term) => containsTerm(haystack, term)))
    .map((risk) => risk.label);
}

export function hasAllergenRiskText(parts: readonly Array<string | null | undefined>): boolean {
  return allergenRiskLabelsForText(parts).length > 0;
}

export function filterAllergenRiskItems<T>(
  items: readonly T[],
  excludeAllergenRisks: boolean,
  partsForItem: (item: T) => readonly Array<string | null | undefined>
): T[] {
  if (!excludeAllergenRisks) return [...items];
  return items.filter((item) => !hasAllergenRiskText(partsForItem(item)));
}

export function allergenAvoidanceSummary(excludedProductCount: number): string {
  return excludedProductCount === 1
    ? '1 product with common allergen-risk terms excluded'
    : `${excludedProductCount.toLocaleString('sv-SE')} products with common allergen-risk terms excluded`;
}
