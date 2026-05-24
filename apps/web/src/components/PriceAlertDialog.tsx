'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type AlertMode = 'target_price' | 'percentage_drop';

type PriceAlertDialogProps = {
  defaultTargetPrice?: number;
  productId: string;
  productName: string;
  userEmail: string;
};

export function PriceAlertDialog({ defaultTargetPrice, productId, productName, userEmail }: PriceAlertDialogProps) {
  const [alertMode, setAlertMode] = useState<AlertMode>('target_price');
  const [threshold, setThreshold] = useState(defaultTargetPrice?.toString() ?? '');
  const [message, setMessage] = useState('Choose a target price or percentage drop threshold.');

  async function saveAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericThreshold = Number(threshold);

    if (!Number.isFinite(numericThreshold) || numericThreshold <= 0) {
      setMessage('Enter a positive alert threshold.');
      return;
    }

    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        userEmail,
        ...(alertMode === 'percentage_drop'
          ? { percentageDrop: numericThreshold, thresholdMode: 'percentage_drop' }
          : { targetPrice: numericThreshold, thresholdMode: 'target_price' })
      })
    });

    setMessage(response.ok ? 'Price alert saved.' : 'Could not save this price alert.');
  }

  return (
    <form className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" onSubmit={saveAlert}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Price alert</p>
      <h2 className="mt-2 text-xl font-black text-slate-950">Alert for {productName}</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Alert threshold type">
        <label className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
          <input className="mr-2" checked={alertMode === 'target_price'} name="alertMode" onChange={() => setAlertMode('target_price')} type="radio" />
          Target price
        </label>
        <label className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
          <input className="mr-2" checked={alertMode === 'percentage_drop'} name="alertMode" onChange={() => setAlertMode('percentage_drop')} type="radio" />
          Percentage drop
        </label>
      </div>
      <label className="mt-4 block text-sm font-black text-slate-700" htmlFor="price-alert-threshold">
        {alertMode === 'percentage_drop' ? 'Alert me when cheaper by (%)' : 'Alert me below price (SEK)'}
      </label>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
        id="price-alert-threshold"
        inputMode="decimal"
        min="0"
        onChange={(event) => setThreshold(event.target.value)}
        placeholder={alertMode === 'percentage_drop' ? '20' : '29.90'}
        step="0.01"
        type="number"
        value={threshold}
      />
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {alertMode === 'percentage_drop' ? 'Example: 20 means notify when the item is at least 20% cheaper.' : 'Absolute price alerts still use the saved SEK target.'}
      </p>
      <button className="mt-4 rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" type="submit">Save alert</button>
      <p className="mt-3 text-sm font-semibold text-slate-600" role="status">{message}</p>
    </form>
  );
}
