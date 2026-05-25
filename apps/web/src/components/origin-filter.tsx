'use client';

import { useEffect, useMemo, useState } from 'react';

export const ORIGIN_FILTER_PARAM = 'origin';

export const ORIGIN_FILTER_OPTIONS = [
  { code: 'SE', flag: '🇸🇪', label: 'Sweden' },
  { code: 'NO', flag: '🇳🇴', label: 'Norway' },
  { code: 'IS', flag: '🇮🇸', label: 'Iceland' },
  { code: 'DK', flag: '🇩🇰', label: 'Denmark' },
  { code: 'FI', flag: '🇫🇮', label: 'Finland' },
  { code: 'DE', flag: '🇩🇪', label: 'Germany' },
  { code: 'NL', flag: '🇳🇱', label: 'Netherlands' },
  { code: 'ES', flag: '🇪🇸', label: 'Spain' },
  { code: 'IT', flag: '🇮🇹', label: 'Italy' },
  { code: 'PL', flag: '🇵🇱', label: 'Poland' },
  { code: 'IE', flag: '🇮🇪', label: 'Ireland' }
] as const;

export type OriginFilterCode = (typeof ORIGIN_FILTER_OPTIONS)[number]['code'];

type OriginFilterProps = Readonly<{
  selected?: readonly string[];
  counts?: Partial<Record<OriginFilterCode, number>>;
  className?: string;
}>;

const supportedOriginCodes = new Set<string>(ORIGIN_FILTER_OPTIONS.map((option) => option.code));

export function normalizeOriginFilterValues(values: readonly string[] | null | undefined): OriginFilterCode[] {
  if (!values) return [];

  const requested = new Set(values.map((value) => value.trim().toUpperCase()).filter(Boolean));
  return ORIGIN_FILTER_OPTIONS
    .map((option) => option.code)
    .filter((code) => requested.has(code));
}

function originValuesFromUrl(): OriginFilterCode[] {
  if (typeof window === 'undefined') return [];

  const params = new URLSearchParams(window.location.search);
  return normalizeOriginFilterValues(params.getAll(ORIGIN_FILTER_PARAM).flatMap((value) => value.split(',')));
}

function localOriginFromNavigator(): OriginFilterCode | null {
  if (typeof navigator === 'undefined') return null;

  const country = navigator.languages
    ?.map((language) => language.split('-').at(1)?.toUpperCase())
    .find((value): value is OriginFilterCode => Boolean(value && supportedOriginCodes.has(value)));

  return country ?? null;
}

function navigateWithOrigins(nextSelected: readonly OriginFilterCode[], replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.delete(ORIGIN_FILTER_PARAM);
  url.searchParams.delete('page');

  for (const code of nextSelected) {
    url.searchParams.append(ORIGIN_FILTER_PARAM, code);
  }

  if (replace) {
    window.location.replace(url.toString());
    return;
  }

  window.location.assign(url.toString());
}

export function OriginFilter({ selected = [], counts = {}, className = '' }: OriginFilterProps) {
  const initialSelected = useMemo(() => normalizeOriginFilterValues(selected), [selected]);
  const [currentSelected, setCurrentSelected] = useState<OriginFilterCode[]>(initialSelected);

  useEffect(() => {
    setCurrentSelected(originValuesFromUrl());
  }, []);

  useEffect(() => {
    if (originValuesFromUrl().length > 0) return;

    const localOrigin = localOriginFromNavigator();
    if (!localOrigin) return;

    setCurrentSelected([localOrigin]);
    navigateWithOrigins([localOrigin], true);
  }, []);

  function toggleOrigin(code: OriginFilterCode) {
    const nextSelected = currentSelected.includes(code)
      ? currentSelected.filter((selectedCode) => selectedCode !== code)
      : [...currentSelected, code];

    setCurrentSelected(nextSelected);
    navigateWithOrigins(nextSelected);
  }

  function clearOrigins() {
    setCurrentSelected([]);
    navigateWithOrigins([]);
  }

  return (
    <section aria-label="Origin filters" className={['rounded-2xl border border-violet-100 bg-white p-4 shadow-sm', className].filter(Boolean).join(' ')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Origin</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Local-first country chips stay in the product URL.</p>
        </div>
        {currentSelected.length > 0 ? (
          <button className="text-sm font-bold text-violet-800 underline decoration-violet-300 underline-offset-4" onClick={clearOrigins} type="button">
            Clear {currentSelected.length}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Product origin countries">
        {ORIGIN_FILTER_OPTIONS.map((option) => {
          const active = currentSelected.includes(option.code);
          const count = counts[option.code] ?? 0;

          return (
            <button
              aria-label={`${option.label} origin${count > 0 ? `, ${count} products` : ''}`}
              aria-pressed={active}
              className={[
                'rounded-full border px-3 py-2 text-sm font-black transition',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700',
                active ? 'border-violet-800 bg-violet-800 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-950'
              ].join(' ')}
              key={option.code}
              onClick={() => toggleOrigin(option.code)}
              type="button"
            >
              {option.flag} {option.code}
              {count > 0 ? <span className="ml-2 text-xs opacity-80">{count}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
