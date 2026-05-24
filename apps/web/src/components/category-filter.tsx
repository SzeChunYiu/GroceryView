import Link from 'next/link';

type CategoryFacet = {
  value: string;
  count: number;
};

type CategoryFilterProps = {
  facets: CategoryFacet[];
  statusMessage: string;
  hrefForCategory(category: string): string;
};

export function CategoryFilter({ facets, statusMessage, hrefForCategory }: CategoryFilterProps) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Category facets</p>
      <p aria-live="polite" className="sr-only" role="status">{statusMessage}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {facets.map((facet) => {
          const resultCount = facet.count.toLocaleString('sv-SE');
          return (
            <Link
              aria-label={`Filter to ${facet.value}; ${resultCount} products match the current search`}
              className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-900"
              href={hrefForCategory(facet.value)}
              key={facet.value}
            >
              {facet.value} · {resultCount}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
