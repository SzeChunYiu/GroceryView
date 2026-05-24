'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type StoreLocatorStore = {
  id?: string;
  slug?: string;
  name: string;
  brand?: string;
  city?: string;
  country?: string;
};

function countryFromPathname(pathname: string | null) {
  const segment = pathname?.split('/').filter(Boolean)[0]?.toLowerCase();
  if (segment === 'no') return 'NO';
  if (segment === 'se' || segment === 'sv') return 'SE';
  return 'SE';
}

export function StoreLocator() {
  const pathname = usePathname();
  const country = countryFromPathname(pathname);
  const [stores, setStores] = useState<StoreLocatorStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    fetch(`/api/stores?country=${encodeURIComponent(country)}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((payload) => {
        if (!isCurrent) return;
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.stores) ? payload.stores : [];
        setStores(rows.filter((store: StoreLocatorStore) => (store.country ?? country).toUpperCase() === country));
      })
      .catch(() => {
        if (isCurrent) setStores([]);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [country]);

  const countryLabel = useMemo(() => (country === 'NO' ? 'Norway' : 'Sweden'), [country]);

  return (
    <section className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-sm" data-store-locator-country={country}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Store locator</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{countryLabel} stores</h2>
        </div>
        <p className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900">/api/stores?country={country}</p>
      </div>

      {isLoading ? <p className="mt-4 text-sm font-semibold text-slate-600">Loading {countryLabel} stores…</p> : null}
      {!isLoading && stores.length === 0 ? <p className="mt-4 text-sm font-semibold text-slate-600">No stores found for {countryLabel}.</p> : null}

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {stores.map((store) => (
          <li className="rounded-2xl border border-slate-200 p-4" key={store.id ?? store.slug ?? store.name}>
            <p className="font-black text-slate-950">{store.name}</p>
            <p className="text-sm font-semibold text-slate-600">{store.brand ?? 'Store'} · {store.city ?? countryLabel}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const __storeLocatorCountryFromPathname = countryFromPathname;
