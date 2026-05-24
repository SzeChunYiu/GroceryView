export const overlapCategoryIds = [
  'personal_care',
  'household_cleaning',
  'paper_goods',
  'batteries',
  'otc_basic',
  'baby_care',
  'pet_food',
  'candy_snacks',
  'beverages_non_alcohol'
] as const;

export type OverlapCategoryId = typeof overlapCategoryIds[number];

const overlapCategorySet = new Set<string>(overlapCategoryIds);

export function isOverlapCategory(categoryId: string): categoryId is OverlapCategoryId {
  return overlapCategorySet.has(categoryId);
}

export function filterOverlapCategories<T extends Readonly<{ categoryId: string }>>(rows: readonly T[]) {
  return rows.filter((row) => isOverlapCategory(row.categoryId));
}
