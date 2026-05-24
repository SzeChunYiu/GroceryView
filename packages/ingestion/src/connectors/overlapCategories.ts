export const groceryOverlapCategories = [
  'bakery',
  'beverages',
  'dairy',
  'deli',
  'frozen',
  'meat',
  'pantry',
  'preserves',
  'snacks',
  'sweets'
] as const;

export type GroceryOverlapCategory = typeof groceryOverlapCategories[number];

export function isGroceryOverlapCategory(value: string): value is GroceryOverlapCategory {
  return groceryOverlapCategories.includes(value.toLowerCase() as GroceryOverlapCategory);
}
