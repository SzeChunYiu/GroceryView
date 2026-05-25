'use client';

import { FormEvent, useState } from 'react';

type DraftStockUpRow = {
  productId: string;
  productName: string;
  storeName: string;
  planningWeeks: number;
  weeklyNeedUnits: number;
  packageUnits: number;
  comparableUnit: string;
  currentUnitPrice: number;
  historicalLowUnitPrice: number;
  typicalUnitPrice: number;
  confidence: 'high' | 'medium' | 'low';
  historyWindowStart: string;
  historyWindowEnd: string;
  storageLimitWeeks?: number;
  noForecastReason: string;
  reviewTrigger: string;
};

type BrowserSession = { accessToken: string; userId: string };
type SaveStatus = 'idle' | 'blocked' | 'saving' | 'saved' | 'error';

type StockUpListActionsProps = {
  draftRows: DraftStockUpRow[];
};

function readSession(): BrowserSession {
  if (typeof window === 'undefined') return { accessToken: '', userId: '' };
  return {
    accessToken: sessionStorage.getItem('groceryview:accessToken') || '',
    userId: sessionStorage.getItem('groceryview:userId') || ''
  };
}

export function StockUpListActions({ draftRows }: StockUpListActionsProps) {
  const [selectedProductId, setSelectedProductId] = useState(draftRows[0]?.productId ?? '');
  const [planningWeeks, setPlanningWeeks] = useState(String(draftRows[0]?.planningWeeks ?? 3));
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState('Sign in to save these observed-price stock-up rows as an editable account-owned plan.');

  const selectedDraft = draftRows.find((row) => row.productId === selectedProductId) ?? draftRows[0];

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No stock-up row is saved anonymously or to local storage.');
      return null;
    }
    setStatus('saving');
    setMessage('Saving stock-up plan row to the signed-in account…');
    return session;
  }

  async function saveDraftRow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session || !selectedDraft) return;

    const weeks = Number(planningWeeks);
    const payload = {
      ...selectedDraft,
      rowId: selectedDraft.productId,
      planningWeeks: Number.isFinite(weeks) && weeks > 0 ? Math.min(26, Math.round(weeks)) : selectedDraft.planningWeeks
    };

    try {
      const response = await fetch(`/users/${encodeURIComponent(session.userId)}/basket/stock-up-list/rows`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        setStatus('error');
        setMessage('The protected stock-up list API rejected the signed-in save.');
        return;
      }
      setStatus('saved');
      setMessage(`Saved ${payload.productName} as an editable ${payload.planningWeeks}-week stock-up row. Historical low and typical prices remain labelled as observed facts, not forecasts.`);
    } catch {
      setStatus('error');
      setMessage('The stock-up row could not be saved before the signed-in API request completed.');
    }
  }

  async function loadSavedRows() {
    const session = requireSession();
    if (!session) return;
    try {
      const response = await fetch(`/users/${encodeURIComponent(session.userId)}/basket/stock-up-list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (!response.ok) {
        setStatus('error');
        setMessage('The protected stock-up list API rejected the signed-in load.');
        return;
      }
      const payload = await response.json() as { itemCount?: number; guardrails?: string[] };
      setStatus('saved');
      setMessage(`Loaded ${payload.itemCount ?? 0} signed-in stock-up rows. ${payload.guardrails?.[1] ?? 'No forecast is stored.'}`);
    } catch {
      setStatus('error');
      setMessage('The stock-up rows could not be loaded from the signed-in API.');
    }
  }

  return (
    <section className="mt-4 rounded-3xl border border-orange-200 bg-white p-5 shadow-sm" aria-label="Signed-in stock-up list controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-800">Signed-in editable plan</p>
      <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Save observed stock-up rows to my account</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
        These controls write to protected account-owned stock-up rows. Planning weeks are editable, but historical low, typical price, confidence, and dated history windows stay visible as observed facts with no price forecast.
      </p>
      <form className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end" onSubmit={saveDraftRow}>
        <label className="text-sm font-black text-slate-950" htmlFor="stock-up-product">
          Draft row
          <select
            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="stock-up-product"
            onChange={(event) => {
              const row = draftRows.find((draft) => draft.productId === event.target.value);
              setSelectedProductId(event.target.value);
              if (row) setPlanningWeeks(String(row.planningWeeks));
            }}
            value={selectedProductId}
          >
            {draftRows.map((row) => <option key={row.productId} value={row.productId}>{row.productName}</option>)}
          </select>
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="stock-up-weeks">
          Planning weeks
          <input
            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="stock-up-weeks"
            max="26"
            min="1"
            onChange={(event) => setPlanningWeeks(event.target.value)}
            type="number"
            value={planningWeeks}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-orange-700 px-4 py-3 text-sm font-black text-white" disabled={!selectedDraft} type="submit">Save row</button>
          <button className="rounded-full border border-orange-300 px-4 py-3 text-sm font-black text-orange-900" onClick={loadSavedRows} type="button">Load my rows</button>
        </div>
      </form>
      <p className="mt-4 rounded-2xl bg-orange-50 p-3 text-sm font-bold text-orange-950" data-status={status}>{message}</p>
    </section>
  );
}
