export type CompareMode = 'adaptive' | 'total' | 'unit';

export const compareModeStorageKey = 'groceryview:product-card-compare-mode';

export function normalizeCompareMode(value: string | null): CompareMode | null {
  if (value === 'adaptive' || value === 'total' || value === 'unit') return value;
  return null;
}
