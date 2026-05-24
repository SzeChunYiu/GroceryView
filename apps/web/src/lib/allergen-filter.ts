export const ALLERGEN_FILTER_PARAM = 'excludeAllergens';
export const ALLERGEN_FILTER_STORAGE_KEY = 'groceryview.excludeAllergens';

const safeFreeClaims = /\b(?:gluten[-\s]?free|glutenfri\w*|lactose[-\s]?free|laktosfri\w*|milk[-\s]?free|dairy[-\s]?free|egg[-\s]?free|nut[-\s]?free|n[oö]tfri\w*|soy[-\s]?free|sojafri\w*)\b/giu;

const allergenRiskPatterns = [
  /\b(?:milk|mj[oö]lk|cheese|ost|yogh?urt|gr[aä]dde|cream|butter|sm[oö]r|whey|vassle)\b/iu,
  /\b(?:wheat|vete|rye|r[aå]g|barley|korn|oat|oats|havre|spelt|dinkel)\b/iu,
  /\b(?:egg|eggs|[aä]gg)\b/iu,
  /\b(?:peanut|peanuts|jordn[oö]t\w*|mandel|almond|hasseln[oö]t\w*|hazelnut|cashew|pistachio|valn[oö]t\w*|walnut|pecan|macadamia)\b/iu,
  /\b(?:soy|soya|soja)\b/iu,
  /\b(?:fish|fisk|lax|salmon|tuna|tonfisk|sill|herring|cod|torsk)\b/iu,
  /\b(?:shellfish|skaldjur|shrimp|r[aä]k\w*|crab|krabba|lobster|hummer|mussel|mussla)\b/iu,
  /\b(?:sesame|sesam|mustard|senap|celery|selleri|lupin)\b/iu
] as const;

export function isAllergenFilterEnabled(value: string | string[] | null | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return ['1', 'true', 'yes', 'on'].includes((raw ?? '').trim().toLocaleLowerCase('sv-SE'));
}

export function hasAllergenRiskText(...parts: Array<string | null | undefined>): boolean {
  const normalized = parts
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .replace(safeFreeClaims, ' ');

  return allergenRiskPatterns.some((pattern) => pattern.test(normalized));
}
