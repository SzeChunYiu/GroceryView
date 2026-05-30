'use client';

import { useEffect, useMemo, useState } from 'react';
import { municipalities } from '@/lib/generated/municipalities';

export const MUNICIPALITY_STORAGE_KEY = 'gv-selected-municipality';
const COOKIE = 'gv_municipality';

function persist(area: string) {
  try {
    window.localStorage.setItem(MUNICIPALITY_STORAGE_KEY, area);
    // 1-year cookie so the server can read the choice on first paint
    document.cookie = `${COOKIE}=${encodeURIComponent(area)}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* storage unavailable */
  }
}

export function readSelectedMunicipality(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(MUNICIPALITY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Lets the shopper choose which municipality / store's prices to view. Backed by the
 * generated municipalities manifest (one representative store per area). Selection is
 * persisted to localStorage + a cookie so it sticks across visits.
 */
export function MunicipalitySelector({ onChange }: Readonly<{ onChange?: (area: string) => void }>) {
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const saved = readSelectedMunicipality();
    if (saved) setSelected(saved);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? municipalities.filter((m) => m.area.toLowerCase().includes(q)) : municipalities;
    return list.slice(0, 200);
  }, [query]);

  function choose(area: string) {
    setSelected(area);
    persist(area);
    onChange?.(area);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="block text-sm font-semibold text-slate-900" htmlFor="municipality-search">
        Your municipality
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Choose where to see prices. {municipalities.length} areas across Sweden.
        {selected ? ` Currently: ${selected}.` : ' No area selected — showing national prices.'}
      </p>
      <input
        id="municipality-search"
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Search municipality (e.g. Alingsås, Solna)…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        type="search"
        autoComplete="off"
      />
      <ul className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-100" role="listbox" aria-label="Municipalities">
        {filtered.map((m) => (
          <li key={m.storeSlug}>
            <button
              type="button"
              aria-selected={selected === m.area}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-emerald-50 ${
                selected === m.area ? 'bg-emerald-100 font-semibold text-emerald-900' : 'text-slate-700'
              }`}
              onClick={() => choose(m.area)}
            >
              <span>{m.area}</span>
              <span className="text-xs text-slate-400">{m.storeName}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No match.</li>}
      </ul>
    </div>
  );
}
