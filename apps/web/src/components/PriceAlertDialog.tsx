'use client';

import { useState } from 'react';

type PriceAlertDialogProps = {
  productName?: string;
};

export function PriceAlertDialog({ productName = 'selected product' }: PriceAlertDialogProps) {
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitAlert = () => {
    const parsedPrice = Number(targetPrice.replace(',', '.'));

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Enter a target price above 0 kr before saving this alert.');
      return;
    }

    setError(null);
  };

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Price alert</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Create an alert for {productName}</h2>
      <div className="mt-4 grid gap-2">
        <label className="text-sm font-bold text-slate-700" htmlFor="price-alert-target">Target price</label>
        <input
          aria-describedby={error ? 'price-alert-target-error' : undefined}
          aria-invalid={error ? 'true' : undefined}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          id="price-alert-target"
          inputMode="decimal"
          onChange={(event) => setTargetPrice(event.target.value)}
          placeholder="25"
          type="text"
          value={targetPrice}
        />
        {error ? (
          <p aria-live="assertive" className="text-sm font-black text-rose-700" id="price-alert-target-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <button className="mt-4 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white" onClick={submitAlert} type="button">
        Save alert
      </button>
    </section>
  );
}
