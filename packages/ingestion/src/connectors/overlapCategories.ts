export const overlapCategories = [
  'noodles',
  'rice',
  'soy-sauce',
  'cooking-oil',
  'sauces',
  'frozen',
  'snacks',
  'tea'
] as const;

export type OverlapCategory = (typeof overlapCategories)[number];

export function isOverlapCategory(value: string): value is OverlapCategory {
  return (overlapCategories as readonly string[]).includes(value);
}
