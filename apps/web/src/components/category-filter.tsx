'use client';

export type CategoryFilterOption = {
  id: string;
  label: string;
  count?: number;
};

export type CategoryFilterProps = {
  categories: CategoryFilterOption[];
  selectedCategoryIds?: string[];
  query?: string;
  onCategoryToggle?: (id: string) => void;
  onQueryChange?: (query: string) => void;
  onClear?: () => void;
};

export function CategoryFilter({
  categories,
  selectedCategoryIds = [],
  query = '',
  onCategoryToggle,
  onQueryChange,
  onClear,
}: CategoryFilterProps) {
  const selected = new Set(selectedCategoryIds);

  return (
    <section aria-label="Category filter" className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">Categories</h2>
        <button
          type="button"
          className="rounded-full border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700"
          onClick={onClear}
        >
          Clear filters
        </button>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="category-filter-search">
        Search categories
      </label>
      <input
        id="category-filter-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange?.(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
      />

      <div className="mt-4 grid gap-2" role="group" aria-label="Available categories">
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.has(category.id)}
                onChange={() => onCategoryToggle?.(category.id)}
              />
              {category.label}
            </span>
            {typeof category.count === 'number' ? <span>{category.count}</span> : null}
          </label>
        ))}
      </div>
    </section>
  );
}

export default CategoryFilter;
