'use client';

import { useEffect, useMemo, useState } from 'react';

type HiddenPreferences = {
  hiddenProductIds: string[];
  hiddenStoreIds: string[];
};

type PickerOption = {
  id: string;
  label: string;
  meta: string;
  source: 'api' | 'saved';
};

type Status = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type OptionKind = 'product' | 'store';

const emptyPreferences: HiddenPreferences = { hiddenProductIds: [], hiddenStoreIds: [] };

function readSession() {
  return {
    accessToken: sessionStorage.getItem('groceryview:accessToken') || '',
    userId: sessionStorage.getItem('groceryview:userId') || ''
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function savedOption(kind: OptionKind, id: string): PickerOption {
  return {
    id,
    label: id,
    meta: kind === 'product' ? 'Saved product id' : 'Saved store id',
    source: 'saved'
  };
}

function productOption(raw: unknown): PickerOption | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readString(record, ['id', 'productId', 'slug', 'productSlug']);
  const label = readString(record, ['name', 'productName', 'canonicalName', 'label']) || id;
  if (!id || !label) return null;
  return {
    id,
    label,
    meta: [readString(record, ['brand']), readString(record, ['slug', 'productSlug'])].filter(Boolean).join(' · ') || 'Product API result',
    source: 'api'
  };
}

function storeOption(raw: unknown): PickerOption | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readString(record, ['id', 'storeId', 'slug', 'storeSlug']);
  const label = readString(record, ['name', 'storeName', 'label']) || id;
  if (!id || !label) return null;
  return {
    id,
    label,
    meta: [readString(record, ['chain', 'chainName', 'brand']), readString(record, ['district', 'city']), readString(record, ['slug', 'storeSlug'])].filter(Boolean).join(' · ') || 'Store API result',
    source: 'api'
  };
}

function arrayFromPayload(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function mergeOptions(options: PickerOption[]): PickerOption[] {
  const byId = new Map<string, PickerOption>();
  for (const option of options) {
    const existing = byId.get(option.id);
    if (!existing || existing.source === 'saved') byId.set(option.id, option);
  }
  return [...byId.values()].sort((left, right) => left.label.localeCompare(right.label, 'sv'));
}

function withoutOption(options: PickerOption[], id: string): PickerOption[] {
  return options.filter((option) => option.id !== id);
}

function clientFilter(options: PickerOption[], query: string): PickerOption[] {
  const normalized = query.trim().toLocaleLowerCase('sv-SE');
  if (normalized.length < 2) return options.slice(0, 8);
  return options
    .filter((option) => `${option.label} ${option.id} ${option.meta}`.toLocaleLowerCase('sv-SE').includes(normalized))
    .slice(0, 8);
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function loadProductOptions(query: string): Promise<PickerOption[]> {
  if (query.trim().length < 2) return [];
  const payload = await fetchJson(`/api/products?q=${encodeURIComponent(query.trim())}`);
  return mergeOptions(arrayFromPayload(payload, ['results', 'items', 'products']).map(productOption).filter((option): option is PickerOption => option !== null));
}

async function loadStoreOptions(query: string): Promise<PickerOption[]> {
  const payload = await fetchJson('/api/stores');
  return clientFilter(mergeOptions(arrayFromPayload(payload, ['stores', 'items', 'results']).map(storeOption).filter((option): option is PickerOption => option !== null)), query);
}

function SelectedChips({ emptyLabel, kind, onRemove, options }: { emptyLabel: string; kind: OptionKind; onRemove: (id: string) => void; options: PickerOption[] }) {
  if (options.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm font-semibold text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 shadow-sm" key={`${kind}:${option.id}`}>
          <span>{option.label}</span>
          <span className="font-mono text-xs font-bold text-slate-500">{option.id}</span>
          <button aria-label={`Remove ${option.label}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700 hover:bg-rose-100 hover:text-rose-800" onClick={() => onRemove(option.id)} type="button">
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function SearchPicker({
  helper,
  kind,
  loading,
  onAdd,
  onQueryChange,
  options,
  query,
  title
}: {
  helper: string;
  kind: OptionKind;
  loading: boolean;
  onAdd: (option: PickerOption) => void;
  onQueryChange: (query: string) => void;
  options: PickerOption[];
  query: string;
  title: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <label className="block text-sm font-black text-slate-950" htmlFor={`hidden-${kind}-search`}>{title}</label>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{helper}</p>
      <input
        autoComplete="off"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
        id={`hidden-${kind}-search`}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={kind === 'product' ? 'Search by product name, brand, or slug' : 'Search by store, chain, or city'}
        value={query}
      />
      <div className="mt-3 min-h-28 space-y-2" aria-live="polite">
        {loading ? <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-600">Searching verified {kind} options…</p> : null}
        {!loading && query.trim().length < 2 ? <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-600">Type at least two characters to search.</p> : null}
        {!loading && query.trim().length >= 2 && options.length === 0 ? <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-600">No matching {kind} options returned by the API.</p> : null}
        {options.map((option) => (
          <button className="flex w-full items-start justify-between gap-3 rounded-2xl border border-white bg-white p-3 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50" key={`${kind}:option:${option.id}`} onClick={() => onAdd(option)} type="button">
            <span>
              <span className="block text-sm font-black text-slate-950">{option.label}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-600">{option.meta}</span>
            </span>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">Add</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HiddenSettingsActions() {
  const [selectedProducts, setSelectedProducts] = useState<PickerOption[]>([]);
  const [selectedStores, setSelectedStores] = useState<PickerOption[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [storeQuery, setStoreQuery] = useState('');
  const [productOptions, setProductOptions] = useState<PickerOption[]>([]);
  const [storeOptions, setStoreOptions] = useState<PickerOption[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Search products and stores, add chips, then save. Hidden preferences stay account-owned and use the existing /api/settings/hidden contract.');

  const preferences = useMemo<HiddenPreferences>(() => ({
    hiddenProductIds: selectedProducts.map((option) => option.id),
    hiddenStoreIds: selectedStores.map((option) => option.id)
  }), [selectedProducts, selectedStores]);

  useEffect(() => {
    let cancelled = false;
    const query = productQuery.trim();
    if (query.length < 2) {
      setProductOptions([]);
      setProductLoading(false);
      return;
    }
    setProductLoading(true);
    const timeout = window.setTimeout(() => {
      loadProductOptions(query)
        .then((options) => {
          if (!cancelled) setProductOptions(options);
        })
        .catch(() => {
          if (!cancelled) setProductOptions([]);
        })
        .finally(() => {
          if (!cancelled) setProductLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [productQuery]);

  useEffect(() => {
    let cancelled = false;
    const query = storeQuery.trim();
    if (query.length < 2) {
      setStoreOptions([]);
      setStoreLoading(false);
      return;
    }
    setStoreLoading(true);
    const timeout = window.setTimeout(() => {
      loadStoreOptions(query)
        .then((options) => {
          if (!cancelled) setStoreOptions(options);
        })
        .catch(() => {
          if (!cancelled) setStoreOptions([]);
        })
        .finally(() => {
          if (!cancelled) setStoreLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [storeQuery]);

  function sessionOrBlock() {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. Hidden preferences are account-owned and are not saved anonymously.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  function addOption(kind: OptionKind, option: PickerOption) {
    if (kind === 'product') setSelectedProducts((current) => mergeOptions([...current, option]));
    if (kind === 'store') setSelectedStores((current) => mergeOptions([...current, option]));
  }

  async function loadHidden() {
    const session = sessionOrBlock();
    if (!session) return;
    const response = await fetch(`/api/settings/hidden?userId=${encodeURIComponent(session.userId)}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Hidden preferences could not be loaded from the signed-in settings endpoint.');
      return;
    }
    const payload = await response.json() as Partial<HiddenPreferences>;
    const nextPreferences = {
      hiddenProductIds: Array.isArray(payload.hiddenProductIds) ? payload.hiddenProductIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0) : emptyPreferences.hiddenProductIds,
      hiddenStoreIds: Array.isArray(payload.hiddenStoreIds) ? payload.hiddenStoreIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0) : emptyPreferences.hiddenStoreIds
    };
    setSelectedProducts(nextPreferences.hiddenProductIds.map((id) => savedOption('product', id)));
    setSelectedStores(nextPreferences.hiddenStoreIds.map((id) => savedOption('store', id)));
    setStatus('ready');
    setMessage('Hidden preferences loaded for this account. Saved ids are shown as chips and can be replaced with API-backed search results.');
  }

  async function saveHidden() {
    const session = sessionOrBlock();
    if (!session) return;
    const response = await fetch(`/api/settings/hidden?userId=${encodeURIComponent(session.userId)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Hidden preferences were rejected. Check that every selected product and store id exists.');
      return;
    }
    const payload = await response.json() as Partial<HiddenPreferences>;
    setSelectedProducts((Array.isArray(payload.hiddenProductIds) ? payload.hiddenProductIds : preferences.hiddenProductIds).filter((id): id is string => typeof id === 'string').map((id) => selectedProducts.find((option) => option.id === id) ?? savedOption('product', id)));
    setSelectedStores((Array.isArray(payload.hiddenStoreIds) ? payload.hiddenStoreIds : preferences.hiddenStoreIds).filter((id): id is string => typeof id === 'string').map((id) => selectedStores.find((option) => option.id === id) ?? savedOption('store', id)));
    setStatus('ready');
    setMessage('Hidden preferences saved. Comparisons and signed-in result lists now exclude these chips.');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <SearchPicker
          helper="Options load from /api/products so operators choose verified product ids instead of typing raw text."
          kind="product"
          loading={productLoading}
          onAdd={(option) => addOption('product', option)}
          onQueryChange={setProductQuery}
          options={productOptions}
          query={productQuery}
          title="Find products to hide"
        />
        <SearchPicker
          helper="Options load from /api/stores and are filtered client-side by store, chain, city, or slug."
          kind="store"
          loading={storeLoading}
          onAdd={(option) => addOption('store', option)}
          onQueryChange={setStoreQuery}
          options={storeOptions}
          query={storeQuery}
          title="Find stores to hide"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Hidden products</p>
          <div className="mt-3"><SelectedChips emptyLabel="No products hidden yet." kind="product" onRemove={(id) => setSelectedProducts((current) => withoutOption(current, id))} options={selectedProducts} /></div>
        </section>
        <section className="rounded-[1.5rem] border border-sky-100 bg-sky-50 p-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Hidden stores</p>
          <div className="mt-3"><SelectedChips emptyLabel="No stores hidden yet." kind="store" onRemove={(id) => setSelectedStores((current) => withoutOption(current, id))} options={selectedStores} /></div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900" onClick={saveHidden} type="button">
          Save hidden chips
        </button>
        <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-500" onClick={loadHidden} type="button">
          Load saved chips
        </button>
      </div>

      <p className="rounded-2xl bg-slate-950 p-4 text-sm font-bold text-white" data-status={status} role={status === 'error' || status === 'blocked' ? 'alert' : 'status'} aria-live="polite">{message}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Product chips</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{preferences.hiddenProductIds.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Store chips</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{preferences.hiddenStoreIds.length}</p>
        </div>
      </div>
    </div>
  );
}
