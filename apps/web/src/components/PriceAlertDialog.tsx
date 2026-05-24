'use client';

import { useState } from 'react';

type AlertMode = 'target_price' | 'percentage_drop';

type PriceAlertDialogProps = {
  currentPrice?: number;
  onCreateAlert?: (alert: { mode: AlertMode; threshold: number }) => void;
  productName: string;
};

export function PriceAlertDialog({ currentPrice, onCreateAlert, productName }: PriceAlertDialogProps) {
  const [mode, setMode] = useState<AlertMode>('target_price');
  const [threshold, setThreshold] = useState('');
  const numericThreshold = Number(threshold);
  const canSubmit = Number.isFinite(numericThreshold) && numericThreshold > 0;

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Price alert</p>
      <h2 className="mt-2 text-xl font-black text-slate-950">Track {productName}</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button className={mode === 'target_price' ? activeButtonClass : idleButtonClass} onClick={() => setMode('target_price')} type="button">
          Target price
        </button>
        <button className={mode === 'percentage_drop' ? activeButtonClass : idleButtonClass} onClick={() => setMode('percentage_drop')} type="button">
          % cheaper
        </button>
      </div>
      <label className="mt-4 block text-sm font-black text-slate-800" htmlFor="price-alert-threshold">
        {mode === 'percentage_drop' ? 'Alert when price drops by' : 'Alert when price is at or below'}
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
        <input
          className="w-full bg-transparent text-lg font-black text-slate-950 outline-none"
          id="price-alert-threshold"
          min="0"
          onChange={(event) => setThreshold(event.target.value)}
          placeholder={mode === 'percentage_drop' ? '20' : currentPrice?.toFixed(2) ?? '49.90'}
          type="number"
          value={threshold}
        />
        <span className="text-sm font-black text-slate-500">{mode === 'percentage_drop' ? '%' : 'SEK'}</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {mode === 'percentage_drop' ? 'Example: 20 means alert me when this item is 20% cheaper.' : 'Absolute target alerts still use the selected SEK price.'}
      </p>
      <button
        className="mt-4 rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!canSubmit}
        onClick={() => canSubmit && onCreateAlert?.({ mode, threshold: numericThreshold })}
        type="button"
      >
        Create alert
      </button>
    </div>
  );
}

const activeButtonClass = 'rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white';
const idleButtonClass = 'rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700';
