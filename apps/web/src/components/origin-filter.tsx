'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const ORIGIN_FILTER_OPTIONS = [
  { code: 'SE', flag: '🇸🇪', label: 'SE', market: 'Sweden' },
  { code: 'NO', flag: '🇳🇴', label: 'NO', market: 'Norway' },
  { code: 'IS', flag: '🇮🇸', label: 'IS', market: 'Iceland' },
  { code: 'DK', flag: '🇩🇰', label: 'DK', market: 'Denmark' },
  { code: 'FI', flag: '🇫🇮', label: 'FI', market: 'Finland' },
  { code: 'DE', flag: '🇩🇪', label: 'DE', market: 'Germany' },
  { code: 'NL', flag: '🇳🇱', label: 'NL', market: 'Netherlands' },
  { code: 'ES', flag: '🇪🇸', label: 'ES', market: 'Spain' },
  { code: 'IT', flag: '🇮🇹', label: 'IT', market: 'Italy' },
  { code: 'PL', flag: '🇵🇱', label: 'PL', market: 'Poland' },
  { code: 'IE', flag: '🇮🇪', label: 'IE', market: 'Ireland' }
] as const;

export type OriginFilterCode = (typeof ORIGIN_FILTER_OPTIONS)[number]['code'];

type OriginFilterProps = Readonly<{
  selected?: readonly string[];
  className?: string;
}>;

const SUPPORTED_ORIGINS = new Set<string>(ORIGIN_FILTER_OPTIONS.map((option) => option.code));
const DEFAULT_ORIGIN: OriginFilterCode = 'SE';

function normalizeOriginSelection(values: readonly string[] | null | undefined): OriginFilterCode[] {
  if (!values) return [];

  const requested = new Set(values.flatMap((value) => value.split(',')).map((value) => value.trim().toUpperCase()).filter(Boolean));
  return ORIGIN_FILTER_OPTIONS.filter((option) => requested.has(option.code)).map((option) => option.code);
}

function inferVisitorOrigin(): OriginFilterCode {
  if (typeof window === 'undefined') return DEFAULT_ORIGIN;

  const languageCandidates = [navigator.language, ...Array.from(navigator.languages ?? [])];
  for (const language of languageCandidates) {
    const region = language.split('-')[1]?.toUpperCase();
    if (region && SUPPORTED_ORIGINS.has(region)) {
      return region as OriginFilterCode;
    }
  }

  return DEFAULT_ORIGIN;
}

function urlForOriginSelection(pathname: string, searchParams: { toString(): string }, nextSelected: readonly OriginFilterCode[]) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('origin');
  params.delete('page');

  for (const origin of nextSelected) {
    params.append('origin', origin);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function OriginFilter({ selected = [], className = '' }: OriginFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSelectedOrigins = useMemo(() => normalizeOriginSelection(searchParams.getAll('origin')), [searchParams]);
  const selectedOrigins = useMemo(() => {
    const urlSelection = normalizeOriginSelection(searchParams.getAll('origin'));
    return urlSelection.length > 0 ? urlSelection : normalizeOriginSelection(selected);
  }, [searchParams, selected]);
  const selectedSet = useMemo(() => new Set(selectedOrigins), [selectedOrigins]);

  useEffect(() => {
    if (urlSelectedOrigins.length > 0) return;

    const defaultOrigin = inferVisitorOrigin();
    router.replace(urlForOriginSelection(pathname, searchParams, [defaultOrigin]), { scroll: false });
  }, [pathname, router, searchParams, urlSelectedOrigins.length]);

  function updateSelection(nextSelected: OriginFilterCode[]) {
    const fallbackSelection = nextSelected.length > 0 ? nextSelected : [inferVisitorOrigin()];
    router.replace(urlForOriginSelection(pathname, searchParams, fallbackSelection), { scroll: false });
  }

  function toggleOrigin(origin: OriginFilterCode) {
    const nextSelected = selectedSet.has(origin)
      ? selectedOrigins.filter((selectedOrigin) => selectedOrigin !== origin)
      : [...selectedOrigins, origin];

    updateSelection(nextSelected);
  }

  function chooseLocalFirst() {
    updateSelection([inferVisitorOrigin()]);
  }

  return (
    <section className={`rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 shadow-sm ${className}`} aria-labelledby="origin-filter-heading">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p id="origin-filter-heading" className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">
            Origin filter
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Local-first country chips</h3>
          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Pick one or more origin markets. The first visit defaults to the country from the browser locale, and each chip selection is written back to the URL.
          </p>
        </div>
        <button
          className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-black text-amber-900 shadow-sm transition hover:border-amber-400 hover:bg-amber-50"
          type="button"
          onClick={chooseLocalFirst}
        >
          Local first
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Origin country filters">
        {ORIGIN_FILTER_OPTIONS.map((option) => {
          const active = selectedSet.has(option.code);
          return (
            <button
              key={option.code}
              type="button"
              aria-pressed={active}
              title={option.market}
              onClick={() => toggleOrigin(option.code)}
              className={`rounded-full border px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                active
                  ? 'border-slate-950 bg-slate-950 text-white shadow-sm shadow-slate-950/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-slate-950'
              }`}
            >
              <span aria-hidden="true" className="mr-1">{option.flag}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-bold text-slate-500">
        URL key: <code className="rounded bg-white px-1 py-0.5 text-slate-700">origin</code> · selected {selectedOrigins.length > 0 ? selectedOrigins.join(', ') : 'local default'}
      </p>
    </section>
  );
}
