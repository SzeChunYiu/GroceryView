import Link from 'next/link';
import { Card, Eyebrow } from '@/components/data-ui';
import { formatSek } from '@/lib/verified-data';

type FacetOption = {
  count: number;
  label?: string;
  value: string;
};

type SearchFilterRailProps = {
  basePath: string;
  categoryFacets: readonly FacetOption[];
  chainFacets: readonly FacetOption[];
  labelFacets: readonly FacetOption[];
  maxPrice?: number;
  minPrice?: number;
  query: string;
  searchFacetHref: (overrides: Record<string, string | undefined>) => string;
};

export function SearchFilterRail({
  basePath,
  categoryFacets,
  chainFacets,
  labelFacets,
  maxPrice,
  minPrice,
  query,
  searchFacetHref
}: Readonly<SearchFilterRailProps>) {
  return (
    <aside aria-label="Search filters">
      <Card className="sticky top-4 space-y-5 p-4">
        <div>
          <Eyebrow>Filters</Eyebrow>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Narrow results by category, label, or chain.</p>
        </div>

        <form action={basePath} className="space-y-3" method="get">
          <label className="block text-sm font-black text-slate-950" htmlFor="search-filter-q">
            Search term
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950"
              defaultValue={query}
              id="search-filter-q"
              name="q"
              placeholder="e.g. havregryn"
            />
          </label>
          <button className="w-full rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" type="submit">
            Search
          </button>
        </form>

        {categoryFacets.length > 0 ? (
          <section>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Category</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryFacets.map((facet) => (
                <Link
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-emerald-100 hover:text-emerald-900"
                  href={searchFacetHref({ category: facet.value })}
                  key={facet.value}
                >
                  {facet.value} · {facet.count}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {labelFacets.length > 0 ? (
          <section>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Labels</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {labelFacets.map((facet) => (
                <Link
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-900 hover:bg-emerald-100"
                  href={searchFacetHref({ label: facet.value })}
                  key={facet.value}
                >
                  {facet.label ?? facet.value} · {facet.count}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {chainFacets.length > 0 ? (
          <section>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Chain</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {chainFacets.map((facet) => (
                <Link
                  className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-900 hover:bg-sky-100"
                  href={searchFacetHref({ chain: facet.value })}
                  key={facet.value}
                >
                  {facet.label ?? facet.value} · {facet.count}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {minPrice !== undefined && maxPrice !== undefined ? (
          <section>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Price range</p>
            <p className="mt-2 text-sm font-black text-slate-950">
              {formatSek(minPrice)} – {formatSek(maxPrice)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Comparable unit prices from verified rows.</p>
          </section>
        ) : null}

        <Link className="inline-block text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={basePath}>
          Clear all filters
        </Link>
      </Card>
    </aside>
  );
}
