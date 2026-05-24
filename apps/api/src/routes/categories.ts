import { allProducts } from '../demo-data.js';
import { getCategoryCounts, type CategoryCount } from '../../../packages/db/src/queries/categories.js';

export type CategoryNavItem = CategoryCount;

export function listCategoriesWithCounts(): CategoryNavItem[] {
  return getCategoryCounts(allProducts());
}
