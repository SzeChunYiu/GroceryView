'use client';

import { useState } from 'react';

type PriceAlertDialogProps = {
  productName?: string;
};

export function PriceAlertDialog({ productName = 'this product' }: PriceAlertDialogProps) {
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateTargetPrice = () => {
    const parsed = Number(targetPrice.replace(',', '.'));
    if (!targetPrice.trim()) {
      setError('Enter a target price before saving this price alert.');
      return false;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Target price must be a positive number.');
      return false;
    }
    setError(null);
    return true;
  };

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        validateTargetPrice();
      }}
    >
      <h2 className="text-xl font-black text-slate-950">Create a price alert for {productName}</h2>
      <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="price-alert-target">
        Target price
      </label>
      <input
        aria-describedby={error ? 'price-alert-target-error' : undefined}
        aria-invalid={error ? 'true' : undefined}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        id="price-alert-target"
        inputMode="decimal"
        onChange={(event) => setTargetPrice(event.target.value)}
        value={targetPrice}
      />
      {error ? (
        <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800" id="price-alert-target-error" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      <button className="mt-4 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white" type="submit">
        Save alert
      </button>
    </form>
  );
}
