const ethnicAsianOverlapCategories = [
  'bageri',
  'barn',
  'chips & snacks',
  'dryck',
  'färdigmat',
  'frukt & grönt',
  'glass',
  'godis & choklad',
  'kött & chark',
  'mejeri & ägg',
  'skafferi',
  'städ & hushåll'
] as const;

export const overlapCategories = {
  ethnic_asian: ethnicAsianOverlapCategories
} as const;

export function isOverlapCategory(retailerType: keyof typeof overlapCategories, category: string): boolean {
  const normalized = category.trim().toLowerCase();
  return (overlapCategories[retailerType] as readonly string[]).some((allowed) => allowed.toLowerCase() === normalized);
}
