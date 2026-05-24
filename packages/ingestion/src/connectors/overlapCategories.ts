export const overlapCategories = ['rice', 'noodles', 'sauces', 'frozen', 'snacks', 'drinks'] as const;

export type OverlapCategory = typeof overlapCategories[number];

export function isOverlapCategory(value: string): value is OverlapCategory {
  return (overlapCategories as readonly string[]).includes(value);
}
