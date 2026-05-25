'use client';

import Link from 'next/link';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { RemovableSearchFilterChip } from '@/lib/search-filters';
import type { SearchFilterPreset } from '@/lib/search-presets';

const dietaryFilters = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'lactose-free', label: 'Lactose-free' }
] as const;

type FilterPanelProps = {
  selectedDietary?: readonly string[];
  activeChips?: readonly RemovableSearchFilterChip[];
};

type ActiveFilterChipsProps = {
  chips: readonly RemovableSearchFilterChip[];
};

type FacetOption = {
  value: string;
  label?: string;
  count?: number;
};

type DietaryFacetOption = FacetOption & {
  checked?: boolean;
  evidenceSummary?: string;
};

type BrandFilterOption = {
  value: string;
  label: string;
  productCount: number;
};

type AdvancedFilterDrawerProps = {
  activeChips?: readonly RemovableSearchFilterChip[];
  brandOptions: readonly BrandFilterOption[];
  categoryFacets: readonly FacetOption[];
  chainFacets: readonly FacetOption[];
  currentPreset: SearchFilterPreset;
  dietaryFilters: readonly DietaryFacetOption[];
  inStockOnly?: boolean;
  labelFacets: readonly FacetOption[];
  maxPrice?: number;
  minConfidence?: number;
  minPrice?: number;
  priceRange: { min: number; max: number };
  selectedBrand?: string;
  selectedCategories?: readonly string[];
  selectedChains?: readonly string[];
  selectedLabels?: readonly string[];
};

const searchPresetStorageKey = 'groceryview:advanced-search-presets';

function readSavedSearchPresets(): SearchFilterPreset[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(searchPresetStorageKey) || '[]') as SearchFilterPreset[];
    return Array.isArray(parsed)
      ? parsed.filter((preset) => typeof preset.id === 'string' && typeof preset.href === 'string' && typeof preset.name === 'string').slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function writeSavedSearchPresets(presets: SearchFilterPreset[]) {
  window.localStorage.setItem(searchPresetStorageKey, JSON.stringify(presets.slice(0, 8)));
}

function hasSignedInSession() {
  return Boolean(window.sessionStorage.getItem('groceryview:accessToken') || window.sessionStorage.getItem('groceryview:userId'));
}

function SavedSearchPresetControls({ currentPreset }: Readonly<{ currentPreset: SearchFilterPreset }>) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [presets, setPresets] = useState<SearchFilterPreset[]>([]);
  const hasFilters = currentPreset.summary !== 'No advanced filters selected';

  useEffect(() => {
    setIsSignedIn(hasSignedInSession());
    setPresets(readSavedSearchPresets());
  }, []);

  function saveCurrentPreset() {
    if (!isSignedIn || !hasFilters) return;
    const nextPreset = { ...currentPreset, createdAt: new Date().toISOString() };
    const next = [nextPreset, ...presets.filter((preset) => preset.id !== nextPreset.id)].slice(0, 8);
    setPresets(next);
    writeSavedSearchPresets(next);
  }

  return (
    <section className="mt-4 rounded-2xl border border-violet-200 bg-white p-4" aria-label="Saved advanced filter presets">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Saved advanced presets</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            Signed-in shoppers can save category, dietary, origin, chain, price, confidence, and brand filters as reusable product-search presets.
          </p>
          <p className="mt-2 text-xs font-bold text-violet-900">Current preset: {currentPreset.summary}</p>
        </div>
        <button
          className="rounded-full bg-violet-800 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!isSignedIn || !hasFilters}
          onClick={saveCurrentPreset}
          type="button"
        >
          Save current preset
        </button>
      </div>
      {!isSignedIn ? (
        <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900">Sign in to keep presets on this device.</p>
      ) : null}
      {presets.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Link className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-950 transition hover:bg-violet-100" href={preset.href} key={preset.id}>
              {preset.name}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  function handleChipKeyDown(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const nextIndex = event.key === 'ArrowRight'
      ? (index + 1) % chips.length
      : (index - 1 + chips.length) % chips.length;
    document.querySelector<HTMLAnchorElement>(`[data-filter-chip-index="${nextIndex}"]`)?.focus();
  }

  if (chips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-white/80 px-4 py-3 text-sm font-bold text-violet-900">
        No saved search filters.
      </div>
    );
  }

  return (
    <div aria-label="Active removable search filters" className="flex flex-wrap gap-2" role="list">
      {chips.map((chip, index) => (
        <Link
          aria-label={`Remove ${chip.label}`}
          className="rounded-full bg-violet-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-violet-700"
          data-filter-chip-index={index}
          href={chip.href}
          key={chip.id}
          onKeyDown={(event) => handleChipKeyDown(event, index)}
          role="listitem"
        >
          {chip.label}
          <span aria-hidden="true" className="ml-2">×</span>
          <span className="sr-only">Remove {chip.label}</span>
        </Link>
      ))}
    </div>
  );
}

function optionLabel(option: FacetOption) {
  return option.label ?? option.value;
}

export function AdvancedFilterDrawer({
  activeChips = [],
  brandOptions,
  categoryFacets,
  chainFacets,
  currentPreset,
  dietaryFilters,
  inStockOnly = false,
  labelFacets,
  maxPrice,
  minConfidence,
  minPrice,
  priceRange,
  selectedBrand = '',
  selectedCategories = [],
  selectedChains = [],
  selectedLabels = []
}: AdvancedFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(activeChips.length > 0);
  const drawerRef = useRef<HTMLDetailsElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const selectedCategorySet = new Set(selectedCategories);
  const selectedChainSet = new Set(selectedChains);
  const selectedLabelSet = new Set(selectedLabels);

  useEffect(() => {
    if (!isOpen) return;
    function handleDocumentKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        window.setTimeout(() => openerRef.current?.focus(), 0);
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), summary') ?? [])
          .filter((element) => element.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [isOpen]);

  return (
    <details
      className="rounded-3xl border border-violet-200 bg-violet-50/80 p-4 lg:col-span-full"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
      ref={drawerRef}
    >
      <summary
        aria-expanded={isOpen}
        className="cursor-pointer text-sm font-black uppercase tracking-[0.18em] text-violet-800"
        onClick={(event) => {
          if (!isOpen) openerRef.current = event.currentTarget;
        }}
        role="button"
      >
        Advanced filter drawer
      </summary>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <fieldset className="rounded-2xl bg-white p-4">
          <legend className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Category facets</legend>
          <div className="mt-3 grid gap-2">
            {categoryFacets.map((facet) => (
              <label className="flex items-center justify-between gap-3 rounded-xl bg-violet-50 px-3 py-2 text-sm font-bold text-violet-950" key={facet.value}>
                <span><input className="mr-2" defaultChecked={selectedCategorySet.has(facet.value)} name="category" type="checkbox" value={facet.value} />{optionLabel(facet)}</span>
                {facet.count !== undefined ? <span className="text-xs text-violet-700">{facet.count}</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl bg-white p-4">
          <legend className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Chain and brand</legend>
          <label className="block text-sm font-black text-slate-950">
            Brand
            <select className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" defaultValue={selectedBrand} name="brand">
              <option value="">Any verified brand</option>
              {brandOptions.map((brand) => (
                <option key={brand.value} value={brand.value}>{brand.label} · {brand.productCount}</option>
              ))}
            </select>
          </label>
          <div className="mt-3 grid gap-2">
            {chainFacets.map((facet) => (
              <label className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-950" key={facet.value}>
                <span><input className="mr-2" defaultChecked={selectedChainSet.has(facet.value)} name="chain" type="checkbox" value={facet.value} />{optionLabel(facet)}</span>
                {facet.count !== undefined ? <span className="text-xs text-sky-700">{facet.count}</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl bg-white p-4">
          <legend className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Diet and certification</legend>
          <div className="grid gap-2">
            {dietaryFilters.map((filter) => (
              <label className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-950" key={filter.value}>
                <input className="mr-2" defaultChecked={filter.checked} name="dietary" type="checkbox" value={filter.value} />
                {optionLabel(filter)}
                {filter.evidenceSummary ? <span className="mt-1 block text-xs font-semibold text-emerald-700">{filter.evidenceSummary}</span> : null}
              </label>
            ))}
            {labelFacets.map((facet) => (
              <label className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-950" key={facet.value}>
                <span><input className="mr-2" defaultChecked={selectedLabelSet.has(facet.value)} name="label" type="checkbox" value={facet.value} />{optionLabel(facet)}</span>
                {facet.count !== undefined ? <span className="text-xs text-emerald-700">{facet.count}</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <fieldset className="mt-4 rounded-2xl bg-white p-4">
        <legend className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Price range, unit price, and availability</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="text-sm font-black text-slate-950">
            Min unit SEK
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" defaultValue={minPrice ?? ''} min="0" name="minPrice" placeholder={String(priceRange.min)} step="0.01" type="number" />
          </label>
          <label className="text-sm font-black text-slate-950">
            Max unit SEK
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" defaultValue={maxPrice ?? ''} min="0" name="maxPrice" placeholder={String(priceRange.max)} step="0.01" type="number" />
          </label>
          <label className="text-sm font-black text-slate-950">
            Min confidence
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" defaultValue={minConfidence ?? ''} max="1" min="0" name="minConfidence" step="0.01" type="number" />
          </label>
          <label className="flex items-center gap-2 rounded-2xl bg-violet-50 px-3 py-2 text-sm font-black text-violet-950">
            <input defaultChecked={inStockOnly} name="inStockOnly" type="checkbox" value="true" />
            Available / priced rows only
          </label>
        </div>
      </fieldset>
      {activeChips.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-violet-800">Active filters</p>
          <ActiveFilterChips chips={activeChips} />
        </div>
      ) : null}
      <SavedSearchPresetControls currentPreset={currentPreset} />
    </details>
  );
}

export function FilterPanel({ selectedDietary = [], activeChips = [] }: FilterPanelProps) {
  const selected = new Set(selectedDietary);

  return (
    <fieldset className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
      <legend className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Dietary filters</legend>
      {activeChips.length > 0 ? (
        <div className="mb-3">
          <ActiveFilterChips chips={activeChips} />
        </div>
      ) : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {dietaryFilters.map((filter) => (
          <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-emerald-950 shadow-sm" key={filter.value}>
            <input defaultChecked={selected.has(filter.value)} name="dietary" type="checkbox" value={filter.value} />
            <span>{filter.label}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-emerald-900">
        Uses dietary flags captured during scraping; products without verified flags stay out of these filtered results.
      </p>
    </fieldset>
  );
}
