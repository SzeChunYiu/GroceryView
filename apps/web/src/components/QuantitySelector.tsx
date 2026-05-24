'use client';

type QuantitySelectorProps = {
  itemId: string;
  label: string;
  onChange: (itemId: string, quantity: number) => void;
  value: number;
};

function boundedQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.round(value)));
}

export function QuantitySelector({ itemId, label, onChange, value }: Readonly<QuantitySelectorProps>) {
  const quantity = boundedQuantity(value);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          aria-label={`Decrease ${label}`}
          className="h-10 w-10 rounded-full bg-white text-xl font-black text-emerald-900 shadow-sm disabled:text-slate-300"
          disabled={quantity <= 1}
          onClick={() => onChange(itemId, quantity - 1)}
          type="button"
        >
          −
        </button>
        <input
          aria-label={`${label} quantity`}
          className="h-10 w-16 rounded-xl border border-emerald-200 bg-white text-center text-sm font-black text-slate-950"
          min={1}
          onChange={(event) => onChange(itemId, boundedQuantity(Number.parseInt(event.target.value, 10)))}
          type="number"
          value={quantity}
        />
        <button
          aria-label={`Increase ${label}`}
          className="h-10 w-10 rounded-full bg-emerald-700 text-xl font-black text-white shadow-sm"
          onClick={() => onChange(itemId, quantity + 1)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}
