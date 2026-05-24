export type AllergenPreference = {
  value: string;
  label: string;
  kind: 'allergen' | 'intolerance';
  keywords: string[];
  description: string;
};

export const allergenPreferenceOptions = [
  {
    value: 'gluten',
    label: 'Gluten / wheat',
    kind: 'allergen',
    keywords: ['gluten', 'wheat', 'vete', 'råg', 'rye', 'barley', 'korn', 'spelt', 'dinkel'],
    description: 'Excludes products with gluten, wheat, rye, barley, or spelt evidence.'
  },
  {
    value: 'milk',
    label: 'Milk protein',
    kind: 'allergen',
    keywords: ['milk', 'mjölk', 'dairy', 'cream', 'grädde', 'cheese', 'ost', 'yoghurt', 'yogurt', 'butter', 'smör'],
    description: 'Excludes dairy and milk-protein evidence; lactose intolerance can be tracked separately.'
  },
  {
    value: 'lactose',
    label: 'Lactose intolerance',
    kind: 'intolerance',
    keywords: ['lactose', 'laktos', 'milk', 'mjölk', 'cream', 'grädde', 'yoghurt', 'yogurt'],
    description: 'Avoids lactose-bearing dairy evidence while still showing verified lactose-free labels.'
  },
  {
    value: 'nuts',
    label: 'Tree nuts',
    kind: 'allergen',
    keywords: ['nut', 'nuts', 'nöt', 'nötter', 'almond', 'mandel', 'hazelnut', 'hasselnöt', 'cashew', 'walnut', 'valnöt', 'pistachio'],
    description: 'Excludes tree nut evidence across names, labels, and category text.'
  },
  {
    value: 'peanut',
    label: 'Peanut',
    kind: 'allergen',
    keywords: ['peanut', 'peanuts', 'jordnöt', 'jordnötter'],
    description: 'Excludes peanut evidence separately from tree nuts.'
  },
  {
    value: 'egg',
    label: 'Egg',
    kind: 'allergen',
    keywords: ['egg', 'eggs', 'ägg', 'äggula', 'äggvita'],
    description: 'Excludes egg evidence in product text or labels.'
  },
  {
    value: 'soy',
    label: 'Soy',
    kind: 'allergen',
    keywords: ['soy', 'soya', 'soja'],
    description: 'Excludes soy evidence in product text or labels.'
  },
  {
    value: 'fish-shellfish',
    label: 'Fish / shellfish',
    kind: 'allergen',
    keywords: ['fish', 'fisk', 'salmon', 'lax', 'tuna', 'tonfisk', 'shrimp', 'räka', 'prawn', 'shellfish', 'skaldjur', 'crab', 'krabba'],
    description: 'Excludes fish and shellfish evidence.'
  }
] as const satisfies readonly AllergenPreference[];

export type AllergenPreferenceValue = typeof allergenPreferenceOptions[number]['value'];

type AllergenSearchValue = string | string[] | undefined;

export type AllergenMatchableProduct = {
  name: string;
  brand?: string;
  categoryLabel?: string;
  labels?: string[];
};

function selectedValues(value: AllergenSearchValue): Set<string> {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  return new Set(rawValues.flatMap((item) => item.split(',')).map((item) => item.trim().toLocaleLowerCase('sv-SE')).filter(Boolean));
}

export function selectedAllergenPreferences(value: AllergenSearchValue) {
  const selected = selectedValues(value);
  return allergenPreferenceOptions.filter((option) => selected.has(option.value));
}

export function productAllergenHits(product: AllergenMatchableProduct, preferences: readonly AllergenPreference[]) {
  const evidence = [product.name, product.brand, product.categoryLabel, ...(product.labels ?? [])]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLocaleLowerCase('sv-SE');
  return preferences.filter((preference) => preference.keywords.some((keyword) => evidence.includes(keyword.toLocaleLowerCase('sv-SE'))));
}

export function excludesAllergenPreferences(product: AllergenMatchableProduct, preferences: readonly AllergenPreference[]) {
  return productAllergenHits(product, preferences).length > 0;
}

export const savedAllergenPreferenceProfile = {
  title: 'Saved allergen exclusions and intolerance tags',
  storageContract: 'account.dietarySafetyProfile',
  appliesTo: ['future product search requests', 'recommendation ranking', 'basket substitutions', 'meal-planner suggestions'],
  selectedValues: ['gluten', 'lactose', 'peanut'] as AllergenPreferenceValue[],
  guardrails: [
    'Preferences hide or down-rank matching products; they are not medical advice.',
    'Products without verified ingredient or label evidence stay marked as needs package check.',
    'Lactose intolerance is tracked separately from milk-protein allergy.'
  ]
};
