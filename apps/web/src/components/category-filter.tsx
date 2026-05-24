import Link from 'next/link';

type CategoryFacet = {
  value: string;
  label?: string;
  count: number;
};

type CategoryFilterProps = {
  facets: CategoryFacet[];
  selectedCategories?: string[];
  allHref: string;
  getCategoryHref: (category: string) => string;
};

export function CategoryFilter({ facets, selectedCategories = [], allHref, getCategoryHref }: CategoryFilterProps) {
  const selected = new Set(selectedCategories);
  const hasSelection = selected.size > 0;

  return (
    <nav aria-label="Filter products by category" className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700" id="product-category-filter-heading">
        Category facets
      </p>
      <Link
        aria-current={!hasSelection ? 'page' : undefined}
        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
          hasSelection ? 'bg-slate-50 text-slate-700' : 'bg-violet-900 text-white'
        }`}
        href={allHref}
      >
        All categories
      </Link>
      <ul aria-labelledby="product-category-filter-heading" className="mt-3 flex flex-wrap gap-2">
        {facets.map((facet) => {
          const isSelected = selected.has(facet.value);
          return (
            <li key={facet.value}>
              <Link
                aria-current={isSelected ? 'page' : undefined}
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  isSelected ? 'bg-violet-900 text-white' : 'bg-violet-50 text-violet-900'
                }`}
                href={getCategoryHref(facet.value)}
              >
                {facet.label ?? facet.value} · {facet.count.toLocaleString('sv-SE')}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
