'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'groceryview:cert-filter:selected';

export const CERTIFICATION_FILTER_OPTIONS = [
  'KRAV',
  'EU-Eko',
  'Fairtrade',
  'MSC',
  'ASC',
  'Rainforest Alliance',
  'Free-range',
  'antibiotic-free'
] as const;

export type CertificationFilterOption = (typeof CERTIFICATION_FILTER_OPTIONS)[number];

type CertFilterProps = Readonly<{
  selected?: readonly CertificationFilterOption[];
  onChange?: (selected: CertificationFilterOption[]) => void;
  storageKey?: string;
  className?: string;
}>;

function isCertificationFilterOption(value: string): value is CertificationFilterOption {
  return (CERTIFICATION_FILTER_OPTIONS as readonly string[]).includes(value);
}

function normaliseSelected(values: readonly string[] | null | undefined): CertificationFilterOption[] {
  if (!values) {
    return [];
  }

  return CERTIFICATION_FILTER_OPTIONS.filter((option) => values.includes(option));
}

function readStoredSelection(storageKey: string): CertificationFilterOption[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return normaliseSelected(parsedValue.filter((value): value is string => typeof value === 'string'));
  } catch {
    return [];
  }
}

export function CertFilter({ selected, onChange, storageKey = STORAGE_KEY, className = '' }: CertFilterProps) {
  const isControlled = selected !== undefined;
  const [internalSelected, setInternalSelected] = useState<CertificationFilterOption[]>(() =>
    isControlled ? normaliseSelected(selected) : []
  );
  const currentSelected = useMemo(
    () => (isControlled ? normaliseSelected(selected) : internalSelected),
    [internalSelected, isControlled, selected]
  );

  useEffect(() => {
    if (!isControlled) {
      setInternalSelected(readStoredSelection(storageKey));
    }
  }, [isControlled, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(currentSelected));
  }, [currentSelected, storageKey]);

  function setSelected(nextSelected: CertificationFilterOption[]) {
    if (!isControlled) {
      setInternalSelected(nextSelected);
    }

    onChange?.(nextSelected);
  }

  function toggleOption(option: CertificationFilterOption) {
    const nextSelected = currentSelected.includes(option)
      ? currentSelected.filter((selectedOption) => selectedOption !== option)
      : [...currentSelected, option];

    setSelected(normaliseSelected(nextSelected));
  }

  function clearSelected() {
    setSelected([]);
  }

  return (
    <section className={`rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm ${className}`} aria-labelledby="cert-filter-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id="cert-filter-heading" className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
            Certifications
          </p>
          <p className="mt-1 text-sm text-slate-600">Filter products by one or more verified certification chips.</p>
        </div>
        {currentSelected.length > 0 ? (
          <button className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" type="button" onClick={clearSelected}>
            Clear {currentSelected.length}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Certification filters">
        {CERTIFICATION_FILTER_OPTIONS.map((option) => {
          const active = currentSelected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggleOption(option)}
              className={`rounded-full border px-3 py-2 text-sm font-black transition ${
                active
                  ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function matchesCertificationFilter(
  productCertifications: readonly string[] | null | undefined,
  selectedCertifications: readonly string[] | null | undefined
) {
  const selectedOptions = normaliseSelected(selectedCertifications);
  if (selectedOptions.length === 0) {
    return true;
  }

  if (!productCertifications || productCertifications.length === 0) {
    return false;
  }

  const productCertificationSet = new Set(productCertifications.filter(isCertificationFilterOption));
  return selectedOptions.every((option) => productCertificationSet.has(option));
}
