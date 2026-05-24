export type SearchFilterParamValue = string | string[] | undefined;

export const allergenRiskGroups = [
  {
    value: 'gluten',
    label: 'Gluten',
    terms: ['gluten', 'vete', 'wheat', 'råg', 'rye', 'korn', 'barley'],
    safeLabels: ['glutenfree', 'crossed_ax'],
    safeTerms: ['glutenfri', 'glutenfritt', 'glutenfria', 'gluten-free']
  },
  {
    value: 'milk',
    label: 'Milk',
    terms: ['mjölk', 'milk', 'grädde', 'cream', 'ost', 'cheese', 'yoghurt', 'yogurt', 'smör', 'butter'],
    safeLabels: ['vegan']
  },
  {
    value: 'egg',
    label: 'Egg',
    terms: ['ägg', 'egg'],
    safeLabels: ['vegan']
  },
  {
    value: 'nuts',
    label: 'Nuts',
    terms: ['nötter', 'nötmix', 'jordnöt', 'peanut', 'hasselnöt', 'hazelnut', 'mandel', 'almond', 'cashew', 'valnöt', 'walnut', 'pistasch', 'pistachio', 'nuts']
  },
  {
    value: 'soy',
    label: 'Soy',
    terms: ['soja', 'soy', 'tofu']
  },
  {
    value: 'fish',
    label: 'Fish',
    terms: ['fisk', 'fish', 'lax', 'salmon', 'sill', 'herring', 'tonfisk', 'tuna', 'makrill', 'mackerel', 'torsk', 'cod'],
    safeLabels: ['vegan']
  },
  {
    value: 'sesame',
    label: 'Sesame',
    terms: ['sesam', 'sesame']
  },
  {
    value: 'mustard',
    label: 'Mustard',
    terms: ['senap', 'mustard']
  }
] as const;

export type AllergenRiskGroupValue = typeof allergenRiskGroups[number]['value'];

type AllergenRiskMatchInput = {
  brand?: string | null;
  canonicalName?: string | null;
  category?: string | null;
  categoryPath?: readonly string[];
  labels?: readonly string[];
  name?: string | null;
  subline?: string | null;
};

function normalizeText(value: string) {
  return value.toLocaleLowerCase('sv-SE');
}

function searchableAllergenText(input: AllergenRiskMatchInput) {
  return normalizeText([
    input.canonicalName,
    input.name,
    input.brand,
    input.subline,
    input.category,
    ...(input.categoryPath ?? []),
    ...(input.labels ?? [])
  ].filter((item): item is string => Boolean(item)).join(' '));
}

function normalizedLabels(input: AllergenRiskMatchInput) {
  return new Set((input.labels ?? []).map(normalizeText));
}

export function allergenSearchValues(value: SearchFilterParamValue): AllergenRiskGroupValue[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  const requested = new Set(rawValues.flatMap((item) => item.split(',')).map((item) => normalizeText(item.trim())).filter(Boolean));
  return allergenRiskGroups
    .filter((group) => requested.has(group.value))
    .map((group) => group.value);
}

export function allergenRisksForProduct(input: AllergenRiskMatchInput): AllergenRiskGroupValue[] {
  const text = searchableAllergenText(input);
  const labels = normalizedLabels(input);
  return allergenRiskGroups
    .filter((group) => {
      if ('safeLabels' in group && group.safeLabels?.some((label) => labels.has(label))) return false;
      if ('safeTerms' in group && group.safeTerms?.some((term) => text.includes(term))) return false;
      return group.terms.some((term) => text.includes(term));
    })
    .map((group) => group.value);
}

