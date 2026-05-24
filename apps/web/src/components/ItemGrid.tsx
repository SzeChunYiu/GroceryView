import Link from 'next/link';

export type ItemGridSort = 'relevance' | 'price-asc' | 'price-desc' | 'observed-desc' | 'name-asc';
export type ItemGridSource = 'all' | 'openprices' | 'chain';

export type ItemGridItem = {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  image?: string;
  source: 'openprices' | 'chain';
  sourceLabel: string;
  price: number;
  priceLabel: string;
  detailLabel: string;
  observedAt?: string;
  spreadPct?: number;
  href: string;
  badges?: string[];
};

export type ItemGridProps = {
  items: ItemGridItem[];
  categorySlug: string;
  query: string;
  source: ItemGridSource;
  sort: ItemGridSort;
  page: number;
  pageSize?: number;
};

const sortLabels: Record<ItemGridSort, string> = {
  relevance: 'Relevance',
  'price-asc': 'Lowest price',
  'price-desc': 'Highest price',
  'observed-desc': 'Freshest evidence',
  'name-asc': 'A–Z'
};

const sourceLabels: Record<ItemGridSource, string> = {
  all: 'All sources',
  openprices: 'OpenPrices',
  chain: 'Chain catalogue'
};

function buildHref(categorySlug: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === 'all' || (key === 'page' && Number(value) <= 1)) continue;
    search.set(key, String(value));
  }
  const suffix = search.toString();
  return `/categories/${categorySlug}${suffix ? `?${suffix}` : ''}`;
}

function compareItems(sort: ItemGridSort) {
  return (left: ItemGridItem, right: ItemGridItem) => {
    if (sort === 'price-asc') return left.price - right.price || left.name.localeCompare(right.name, 'sv');
    if (sort === 'price-desc') return right.price - left.price || left.name.localeCompare(right.name, 'sv');
    if (sort === 'observed-desc') return (right.observedAt ?? '').localeCompare(left.observedAt ?? '') || left.name.localeCompare(right.name, 'sv');
    if (sort === 'name-asc') return left.name.localeCompare(right.name, 'sv');
    return (right.spreadPct ?? 0) - (left.spreadPct ?? 0) || right.price - left.price || left.name.localeCompare(right.name, 'sv');
  };
}

function itemMatchesQuery(item: ItemGridItem, query: string) {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return [item.name, item.brand, item.sourceLabel, item.detailLabel, ...(item.badges ?? [])]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

export function ItemGrid({ items, categorySlug, query, source, sort, page, pageSize = 24 }: ItemGridProps) {
  const filteredItems = items
    .filter((item) => source === 'all' || item.source === source)
    .filter((item) => itemMatchesQuery(item, query))
    .sort(compareItems(sort));
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const visibleItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstRow = filteredItems.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(filteredItems.length, safePage * pageSize);

  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.20),_transparent_35%),linear-gradient(135deg,#f8fafc,#ffffff)] p-5 md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Filterable item grid</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Verified category shelf</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Showing {firstRow.toLocaleString('sv-SE')}–{lastRow.toLocaleString('sv-SE')} of {filteredItems.length.toLocaleString('sv-SE')} matching rows.
            </p>
          </div>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] xl:min-w-[720px]" action={`/categories/${categorySlug}`}>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Search</span>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none ring-emerald-200 transition focus:border-emerald-700 focus:ring-4"
                defaultValue={query}
                name="q"
                placeholder="Brand, product, evidence…"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Source</span>
              <select className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black" defaultValue={source} name="source">
                {(Object.keys(sourceLabels) as ItemGridSource[]).map((value) => <option key={value} value={value}>{sourceLabels[value]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Sort</span>
              <select className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black" defaultValue={sort} name="sort">
                {(Object.keys(sortLabels) as ItemGridSort[]).map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}
              </select>
            </label>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 md:self-end" type="submit">
              Apply
            </button>
          </form>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <div className="grid gap-px bg-slate-200 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <Link className="group flex min-h-64 flex-col bg-white p-5 transition hover:bg-emerald-50" href={item.href} key={item.id}>
              <div className="flex items-start gap-4">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-20 w-20 rounded-2xl border border-slate-100 bg-slate-50 object-contain p-2" src={item.image} />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-400">GV</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{item.sourceLabel}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-slate-950 group-hover:text-emerald-900">{item.name}</h3>
                  {item.brand ? <p className="mt-1 truncate text-sm font-semibold text-slate-500">{item.brand}</p> : null}
                </div>
              </div>
              <div className="mt-auto pt-5">
                <p className="text-3xl font-black tracking-tight text-slate-950">{item.priceLabel}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.detailLabel}</p>
                {item.badges?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.badges.slice(0, 3).map((badge) => <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700" key={badge}>{badge}</span>)}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center">
          <p className="text-xl font-black text-slate-950">No rows match these filters.</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Try all sources or clear the search query.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-black text-slate-600">Page {safePage.toLocaleString('sv-SE')} of {pageCount.toLocaleString('sv-SE')}</p>
        <div className="flex gap-2">
          <Link aria-disabled={safePage <= 1} className={`rounded-2xl px-4 py-2 text-sm font-black ${safePage <= 1 ? 'pointer-events-none bg-slate-200 text-slate-400' : 'bg-white text-slate-950 hover:bg-emerald-100'}`} href={buildHref(categorySlug, { q: query, source, sort, page: safePage - 1 })}>Previous</Link>
          <Link aria-disabled={safePage >= pageCount} className={`rounded-2xl px-4 py-2 text-sm font-black ${safePage >= pageCount ? 'pointer-events-none bg-slate-200 text-slate-400' : 'bg-white text-slate-950 hover:bg-emerald-100'}`} href={buildHref(categorySlug, { q: query, source, sort, page: safePage + 1 })}>Next</Link>
        </div>
      </div>
    </section>
  );
}
