/**
 * CategoryFilter lets grocery listing surfaces narrow visible products by category
 * while keeping the underlying product data and surrounding layout unchanged.
 *
 * @example
 * ```tsx
 * <CategoryFilter
 *   categories={categories}
 *   selectedCategory={selectedCategory}
 *   onCategoryChange={setSelectedCategory}
 * />
 * ```
 *
 * @param props - Props passed to the CategoryFilter component.
 * @param props.categories - Category labels available for filtering.
 * @param props.selectedCategory - The currently selected category, or `null` when all categories are shown.
 * @param props.onCategoryChange - Called with the next selected category, or `null` to clear the filter.
 */
export interface Props {
  categories: readonly string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}
