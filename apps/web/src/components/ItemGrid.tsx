import Link from 'next/link';
import { formatReviewSummary, reviewSummaryForProduct, type ProductReviewSummary } from '@/lib/community-reviews';

export type ItemGridRow = Readonly<{
  id: string;
  name: string;
  brand: string;
  href: string;
  source: 'Axfood' | 'OpenPrices';
  price: number;
  priceLabel: string;
  category: string;
  observationLabel: string;
  image?: string | null;
  reviewSummary?: ProductReviewSummary | null;
}>;

type ItemGridProps = Readonly<{
  rows: readonly ItemGridRow[];
  basePath: string;
  query: string;
  sort: string;
  page: number;
  pageSize?: number;
}>;

const sortOptions = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'price-asc', label: 'Price low-high' },
  { value: 'price-desc', label: 'Price high-low' },
  { value: 'source', label: 'Source' }
] as const;

function filteredRows(rows: readonly ItemGridRow[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...rows];
  return rows.filter((row) => [row.name, row.brand, row.source].some((value) => value.toLowerCase().includes(normalized)));
}

function sortedRows(rows: ItemGridRow[], sort: string) {
  return rows.sort((left, right) => {
    if (sort === 'price-asc') return left.price - right.price || left.name.localeCompare(right.name, 'sv');
    if (sort === 'price-desc') return right.price - left.price || left.name.localeCompare(right.name, 'sv');
    if (sort === 'source') return left.source.localeCompare(right.source) || left.name.localeCompare(right.name, 'sv');
    return left.name.localeCompare(right.name, 'sv');
  });
}

function pageHref(basePath: string, query: string, sort: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (sort && sort !== 'name') params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function ItemGrid({ rows, basePath, query, sort, page, pageSize = 12 }: ItemGridProps) {
  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const ranked = sortedRows(filteredRows(rows, query), sort);
  const totalPages = Math.max(1, Math.ceil(ranked.length / pageSize));
  const currentPage = Math.min(normalizedPage, totalPages);
  const visibleRows = ranked.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]" method="get">
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Filter items
          <input className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold" defaultValue={query} name="q" placeholder="Search name, brand, or source" />
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Sort
          <select className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold" defaultValue={sort} name="sort">
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button className="self-end rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white" type="submit">Apply</button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
        <p>{ranked.length} matching items · page {currentPage} of {totalPages}</p>
        <p>Sorted by {sortOptions.find((option) => option.value === sort)?.label ?? 'Name A-Z'}</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleRows.map((row) => (
          <ItemGridCard key={row.id} row={row} />
        ))}
      </div>

      {visibleRows.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">No items match this filter.</p> : null}

      <nav className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-label="Category pagination">
        <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40" aria-disabled={currentPage <= 1} href={pageHref(basePath, query, sort, currentPage - 1)}>
          Previous
        </Link>
        <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40" aria-disabled={currentPage >= totalPages} href={pageHref(basePath, query, sort, currentPage + 1)}>
          Next
        </Link>
      </nav>
    </section>
  );
}

function ItemGridCard({ row }: { row: ItemGridRow }) {
  const reviewSummary = row.reviewSummary ?? reviewSummaryForProduct(row.id, row.name);

  return (
    <Link className="group rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-white" href={row.href}>
      {row.image ? <img alt="" className="mb-4 aspect-square w-full rounded-2xl bg-white object-contain p-3" loading="lazy" src={row.image} /> : null}
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{row.source}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950 group-hover:text-emerald-800">{row.name}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <p className="rounded-2xl bg-white p-3 font-black text-emerald-800">{row.priceLabel}</p>
        <p className="rounded-2xl bg-white p-3 font-bold text-slate-600">{row.observationLabel}</p>
      </div>
      {reviewSummary ? (
        <div className="mt-3 rounded-2xl border border-violet-100 bg-white p-3 text-xs font-bold text-violet-950" data-community-review-summary>
          <p>{formatReviewSummary(reviewSummary)}</p>
          <p className="mt-1">{reviewSummary.sourceLabel}</p>
          <p className="mt-1">Top freshness complaint: {reviewSummary.topFreshnessComplaint ?? 'No recurring freshness complaint'}</p>
        </div>
      ) : null}
    </Link>
  );
}
