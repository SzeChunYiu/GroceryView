"use client";

import { useEffect, useMemo, useState } from "react";

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

const SEARCH_DEBOUNCE_MS = 250;

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState(searchInput);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchInput(searchInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const visibleCategories = useMemo(() => {
    const query = debouncedSearchInput.trim().toLocaleLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      category.toLocaleLowerCase().includes(query),
    );
  }, [categories, debouncedSearchInput]);

  return (
    <section aria-label="Category filter">
      <label htmlFor="category-filter-search">Search categories</label>
      <input
        id="category-filter-search"
        type="search"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
      />
      <ul>
        <li>
          <button
            type="button"
            aria-pressed={selectedCategory === null}
            onClick={() => onCategoryChange(null)}
          >
            All categories
          </button>
        </li>
        {visibleCategories.map((category) => (
          <li key={category}>
            <button
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
