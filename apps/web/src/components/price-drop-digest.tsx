import Link from 'next/link';
import type { PriceDropDigestFilters, PriceDropDigestItem } from '@/lib/price-events';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(value * 100)}%`;
}

function filterHref(filters: PriceDropDigestFilters, key: keyof PriceDropDigestFilters, value: string) {
  const params = new URLSearchParams();
  for (const [name, current] of Object.entries({ ...filters, [key]: value })) {
    if (current) params.set(name, current);
  }
  return `/deals?${params.toString()}`;
}

export function PriceDropDigest({
  categories,
  filters,
  items,
  stores
}: Readonly<{
  categories: string[];
  filters: PriceDropDigestFilters;
  items: PriceDropDigestItem[];
  stores: string[];
}>) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" data-price-drop-digest>
      <div className="rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Recent price drops</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Chronological deal digest</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Scan verified week-over-week drops by latest observation date, then narrow by store signal, category, or savings band before opening product evidence.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Price drop filters">
          <FilterGroup label="Store" values={stores} active={filters.store} hrefFor={(value) => filterHref(filters, 'store', value)} />
          <FilterGroup label="Category" values={categories} active={filters.category} hrefFor={(value) => filterHref(filters, 'category', value)} />
          <FilterGroup label="Savings" values={['10%+', '20%+', '30%+']} active={filters.savings} hrefFor={(value) => filterHref(filters, 'savings', value)} />
        </div>
        <div className="mt-6 divide-y divide-slate-200">
          {items.map((item) => (
            <Link className="grid gap-3 py-4 transition hover:bg-emerald-50 md:grid-cols-[8rem_1fr_auto] md:items-center" href={`/products/${item.productSlug}`} key={`${item.productSlug}-${item.latestObservedAt}`}>
              <time className="text-sm font-black text-slate-500" dateTime={item.latestObservedAt}>{item.latestObservedAt}</time>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{item.store} · {item.category}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{item.productName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">Dropped from {formatSek(item.previousWeekPrice)} to {formatSek(item.latestPrice)}.</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-right text-emerald-900">
                <p className="text-xl font-black">-{formatPercent(item.dropPercent)}</p>
                <p className="text-xs font-black uppercase tracking-[0.12em]">Save {formatSek(item.dropAmount)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterGroup({ active, hrefFor, label, values }: Readonly<{ active?: string; hrefFor: (value: string) => string; label: string; values: string[] }>) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.slice(0, 6).map((value) => (
          <Link className={`rounded-full px-3 py-1 text-xs font-black ${active === value ? 'bg-emerald-800 text-white' : 'bg-white text-slate-700'}`} href={hrefFor(value)} key={value}>
            {value}
          </Link>
        ))}
      </div>
    </div>
  );
}
