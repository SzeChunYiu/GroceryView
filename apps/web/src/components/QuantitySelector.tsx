'use client';

import { Minus, Plus } from 'lucide-react';

type QuantitySelectorProps = {
  disabled?: boolean;
  itemName: string;
  min?: number;
  onChange: (nextQuantity: number) => void;
  value: number;
};

function normalizeQuantity(value: number, min: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.round(value));
}

export function QuantitySelector({
  disabled = false,
  itemName,
  min = 1,
  onChange,
  value
}: Readonly<QuantitySelectorProps>) {
  const safeValue = normalizeQuantity(value, min);

  function setQuantity(nextValue: number) {
    onChange(normalizeQuantity(nextValue, min));
  }

  return (
    <div className="inline-flex h-11 items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm" aria-label={`Quantity for ${itemName}`}>
      <button
        aria-label={`Decrease quantity for ${itemName}`}
        className="inline-flex size-11 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        disabled={disabled || safeValue <= min}
        onClick={() => setQuantity(safeValue - 1)}
        title="Decrease quantity"
        type="button"
      >
        <Minus aria-hidden="true" size={16} strokeWidth={3} />
      </button>
      <input
        aria-label={`Quantity amount for ${itemName}`}
        className="h-11 w-14 border-x border-slate-200 text-center text-sm font-black tabular-nums text-slate-950 outline-none"
        disabled={disabled}
        inputMode="numeric"
        min={min}
        onChange={(event) => setQuantity(Number(event.target.value))}
        type="number"
        value={safeValue}
      />
      <button
        aria-label={`Increase quantity for ${itemName}`}
        className="inline-flex size-11 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        disabled={disabled}
        onClick={() => setQuantity(safeValue + 1)}
        title="Increase quantity"
        type="button"
      >
        <Plus aria-hidden="true" size={16} strokeWidth={3} />
      </button>
    </div>
  );
}
