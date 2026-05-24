import Link from 'next/link';
import type { storeUniverse } from '@/lib/verified-data';

type StoreSummary = (typeof storeUniverse)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

function sourceFreshnessDays(retrievedDate: string) {
  const retrievedAt = new Date(retrievedDate);
  if (Number.isNaN(retrievedAt.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - retrievedAt.getTime()) / DAY_MS));
}

function stockAvailabilityForStore(retrievedDate: string) {
  const ageDays = sourceFreshnessDays(retrievedDate);
  if (ageDays === null) {
    return {
      label: 'Stock unknown',
      detail: 'freshness unavailable',
      className: 'bg-slate-100 text-slate-700'
    };
  }
  if (ageDays <= 14) {
    return {
      label: 'Likely in stock',
      detail: 'high freshness confidence',
      className: 'bg-emerald-100 text-emerald-800'
    };
  }
  if (ageDays <= 45) {
    return {
      label: 'Check stock',
      detail: 'medium freshness confidence',
      className: 'bg-amber-100 text-amber-900'
    };
  }
  return {
    label: 'Stock stale',
    detail: 'low freshness confidence',
    className: 'bg-rose-100 text-rose-800'
  };
}

export function StoreList({ stores }: Readonly<{ stores: StoreSummary[] }>) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {stores.map((store) => {
        const stockAvailability = stockAvailabilityForStore(store.retrievedDate);
        return (
          <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{store.name}</p>
                <p className="text-sm text-slate-600">
                  {store.brand} · {store.city || store.district || 'City not reported'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${stockAvailability.className}`}>{stockAvailability.label}</span>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">{stockAvailability.detail}</p>
          </Link>
        );
      })}
    </div>
  );
}
