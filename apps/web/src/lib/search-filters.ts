export const accountAllergenAvoidanceStorageKey = 'groceryview:account:allergenAvoidance';
export const accountAllergenAvoidanceCookieName = 'gv_allergen_avoidance';

export const accountAllergenAvoidanceOptions = [
  {
    value: 'glutenfree',
    label: 'Avoid gluten',
    description: 'Default product search to verified gluten-free evidence.'
  },
  {
    value: 'laktosfree',
    label: 'Avoid lactose',
    description: 'Default product search to verified lactose-free evidence.'
  },
  {
    value: 'vegan',
    label: 'Avoid animal products',
    description: 'Default product search to verified vegan or vegetarian evidence.'
  }
] as const;

export type AccountAllergenAvoidanceValue = typeof accountAllergenAvoidanceOptions[number]['value'];
export type SearchParamValue = string | string[] | undefined;

const allowedAccountAllergenAvoidanceValues = new Set<string>(accountAllergenAvoidanceOptions.map((option) => option.value));

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parsePreferenceText(value: string): string[] {
  const decoded = safeDecode(value.trim());
  if (!decoded) return [];

  try {
    const parsed = JSON.parse(decoded) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { allergenAvoidance?: unknown }).allergenAvoidance)) {
      return (parsed as { allergenAvoidance: unknown[] }).allergenAvoidance.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    // Cookie values are stored as comma-separated strings; non-JSON text falls through to that parser.
  }

  return decoded.split(',');
}

export function normalizeAccountAllergenAvoidance(value: SearchParamValue): AccountAllergenAvoidanceValue[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  const requested = rawValues.flatMap(parsePreferenceText).map((item) => item.trim().toLocaleLowerCase('sv-SE'));
  return [...new Set(requested)].filter((item): item is AccountAllergenAvoidanceValue => allowedAccountAllergenAvoidanceValues.has(item));
}

export function searchParamsHaveDietaryOverride(searchParams: { dietary?: SearchParamValue }): boolean {
  return searchParams.dietary !== undefined;
}

export function applyAccountAllergenDefaultsToSearchParams<T extends { dietary?: SearchParamValue }>(
  searchParams: T,
  accountAllergenAvoidance: SearchParamValue
): T {
  if (searchParamsHaveDietaryOverride(searchParams)) return searchParams;

  const defaults = normalizeAccountAllergenAvoidance(accountAllergenAvoidance);
  if (defaults.length === 0) return searchParams;

  return { ...searchParams, dietary: defaults };
}
