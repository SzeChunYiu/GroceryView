'use client';

import { useEffect, useMemo, useState } from 'react';

export type HiddenPreferenceOption = {
  id: string;
  label: string;
  description?: string;
};

type HiddenSettingsActionsProps = {
  initialProductOptions: HiddenPreferenceOption[];
  initialStoreOptions: HiddenPreferenceOption[];
  initialHiddenProductIds?: string[];
  initialHiddenStoreIds?: string[];
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function mergeOptions(options: HiddenPreferenceOption[]) {
  const byId = new Map<string, HiddenPreferenceOption>();
  for (const option of options) {
    if (!byId.has(option.id)) byId.set(option.id, option);
  }
  return [...byId.values()];
}

function optionLabelFor(options: HiddenPreferenceOption[], id: string) {
  const option = options.find((candidate) => candidate.id === id);
  return option?.label ?? id;
}

function filterOptions(options: HiddenPreferenceOption[], query: string, selectedIds: string[]) {
  const normalizedQuery = normalizeQuery(query);
  const selected = new Set(selectedIds);
  return options
    .filter((option) => !selected.has(option.id))
    .filter((option) => {
      if (normalizedQuery.length === 0) return true;
      return `${option.label} ${option.description ?? ''} ${option.id}`.toLowerCase().includes(normalizedQuery);
    })
    .slice(0, 8);
}

function Picker({
  label,
  query,
  options,
  selectedIds,
  onQueryChange,
  onAdd,
  onRemove,
  onFocus
}: {
  label: string;
  query: string;
  options: HiddenPreferenceOption[];
  selectedIds: string[];
  onQueryChange: (value: string) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onFocus?: () => void;
}) {
  const filteredOptions = useMemo(() => filterOptions(options, query, selectedIds), [options, query, selectedIds]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
        <input
          className="mt-3 block w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          placeholder={`Search ${label.toLowerCase()}`}
          type="search"
          value={query}
        />
      </label>

      <div className="mt-3 flex min-h-12 flex-wrap gap-2">
        {selectedIds.length > 0 ? selectedIds.map((id) => (
          <button
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-950"
            key={id}
            onClick={() => onRemove(id)}
            type="button"
          >
            {optionLabelFor(options, id)} x
          </button>
        )) : (
          <p className="text-sm font-semibold text-slate-500">No hidden {label.toLowerCase()} selected.</p>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        {filteredOptions.map((option) => (
          <button
            className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            key={option.id}
            onClick={() => onAdd(option.id)}
            type="button"
          >
            <span className="block text-sm font-black text-slate-950">{option.label}</span>
            <span className="mt-1 block text-xs font-semibold text-slate-500">{option.description ?? option.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HiddenSettingsActions({
  initialProductOptions,
  initialStoreOptions,
  initialHiddenProductIds = [],
  initialHiddenStoreIds = []
}: HiddenSettingsActionsProps) {
  const [productOptions, setProductOptions] = useState(initialProductOptions);
  const [storeOptions, setStoreOptions] = useState(initialStoreOptions);
  const [hiddenProductIds, setHiddenProductIds] = useState(initialHiddenProductIds);
  const [hiddenStoreIds, setHiddenStoreIds] = useState(initialHiddenStoreIds);
  const [productQuery, setProductQuery] = useState('');
  const [storeQuery, setStoreQuery] = useState('');
  const [storeOptionsLoaded, setStoreOptionsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    const query = productQuery.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    fetch(`/api/products?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { results?: Array<{ id?: string; slug?: string; name?: string; brand?: string }> } | null) => {
        const results = payload?.results ?? [];
        const fetchedOptions = results.flatMap((result): HiddenPreferenceOption[] => {
          const id = result.id ?? result.slug;
          if (!id || !result.name) return [];
          return [{ id, label: result.name, description: result.brand ?? id }];
        });
        setProductOptions((current) => mergeOptions([...fetchedOptions, ...current]));
      })
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') console.warn('Product hidden-picker search failed', error);
      });

    return () => controller.abort();
  }, [productQuery]);

  function loadStoreOptions() {
    if (storeOptionsLoaded) return;
    setStoreOptionsLoaded(true);
    fetch('/api/public/v1?resource=stores&limit=100&key=gv_public_demo')
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { data?: Array<{ slug?: string; name?: string; brand?: string; city?: string; district?: string }> } | null) => {
        const fetchedOptions = (payload?.data ?? []).flatMap((store): HiddenPreferenceOption[] => {
          if (!store.slug || !store.name) return [];
          return [{
            id: store.slug,
            label: store.name,
            description: [store.brand, store.city || store.district].filter(Boolean).join(' - ')
          }];
        });
        setStoreOptions((current) => mergeOptions([...fetchedOptions, ...current]));
      })
      .catch((error) => console.warn('Store hidden-picker load failed', error));
  }

  function addSelected(setter: (value: string[]) => void, selectedIds: string[], id: string) {
    setter([...new Set([...selectedIds, id])]);
    setSaveState('idle');
  }

  function removeSelected(setter: (value: string[]) => void, selectedIds: string[], id: string) {
    setter(selectedIds.filter((selectedId) => selectedId !== id));
    setSaveState('idle');
  }

  async function saveHiddenPreferences() {
    setSaveState('saving');
    try {
      const response = await fetch('/api/settings/hidden', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenProductIds, hiddenStoreIds })
      });
      setSaveState(response.ok ? 'saved' : 'error');
    } catch {
      setSaveState('error');
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Hidden preferences</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Search and hide products or stores</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Pickers save the same product and store id arrays expected by the hidden settings API.
          </p>
        </div>
        <button
          className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={saveState === 'saving'}
          onClick={saveHiddenPreferences}
          type="button"
        >
          {saveState === 'saving' ? 'Saving...' : 'Save hidden settings'}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Picker
          label="Products"
          onAdd={(id) => addSelected(setHiddenProductIds, hiddenProductIds, id)}
          onQueryChange={setProductQuery}
          onRemove={(id) => removeSelected(setHiddenProductIds, hiddenProductIds, id)}
          options={productOptions}
          query={productQuery}
          selectedIds={hiddenProductIds}
        />
        <Picker
          label="Stores"
          onAdd={(id) => addSelected(setHiddenStoreIds, hiddenStoreIds, id)}
          onFocus={loadStoreOptions}
          onQueryChange={setStoreQuery}
          onRemove={(id) => removeSelected(setHiddenStoreIds, hiddenStoreIds, id)}
          options={storeOptions}
          query={storeQuery}
          selectedIds={hiddenStoreIds}
        />
      </div>

      <div className="mt-4" aria-live="polite">
        {saveState === 'saved' ? <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-900">Hidden preferences saved.</p> : null}
        {saveState === 'error' ? <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-rose-900">Hidden preferences could not be saved.</p> : null}
      </div>
    </section>
  );
}
