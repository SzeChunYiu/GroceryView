export const ethnicAfricanOverlapCategories = [
  'beverages',
  'beans',
  'flour',
  'frozen',
  'grains',
  'legumes',
  'oils',
  'pantry',
  'rice',
  'sauces',
  'snacks',
  'spices'
] as const;

export type EthnicAfricanOverlapCategory = typeof ethnicAfricanOverlapCategories[number];

export function isEthnicAfricanOverlapCategory(value: string): value is EthnicAfricanOverlapCategory {
  return ethnicAfricanOverlapCategories.includes(value.trim().toLowerCase() as EthnicAfricanOverlapCategory);
}
