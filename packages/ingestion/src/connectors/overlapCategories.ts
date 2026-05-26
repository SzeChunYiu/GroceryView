export const GROCERY_OVERLAP_CATEGORIES = [
  'bakery',
  'beverages',
  'dairy',
  'frozen',
  'meat_deli',
  'pantry',
  'produce',
  'rice_noodles',
  'sauces_condiments',
  'seafood',
  'snacks'
] as const;

export type GroceryOverlapCategory = typeof GROCERY_OVERLAP_CATEGORIES[number];

export function isGroceryOverlapCategory(category: string): category is GroceryOverlapCategory {
  return (GROCERY_OVERLAP_CATEGORIES as readonly string[]).includes(category);
}
