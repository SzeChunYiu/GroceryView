'use client';

import type { BasketCalculatorProduct } from './basket-calculator';
import { formatSek } from './basket-formatting';

type BasketRowProps = {
  checked: boolean;
  onToggle: (productId: string) => void;
  product: BasketCalculatorProduct;
};

export function BasketRow({ checked, onToggle, product }: Readonly<BasketRowProps>) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition ${checked ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-400'}`}
    >
      <input
        checked={checked}
        className="mt-1 h-5 w-5 accent-emerald-800"
        onChange={() => onToggle(product.id)}
        type="checkbox"
      />
      {product.image ? (
        <img
          alt=""
          className="h-14 w-14 rounded-xl object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={product.image}
        />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">No img</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-black text-slate-950">{product.name}</span>
        <span className="mt-1 block text-sm font-semibold text-slate-600">{product.brand || 'Brand not reported'} · {product.packageLabel}</span>
        <span className="mt-2 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {product.prices.map((price) => (
            <span className="rounded-full bg-slate-100 px-2 py-1" key={`${product.id}-${price.chainId}`}>
              {price.chainName}: {formatSek(price.price)}
            </span>
          ))}
        </span>
      </span>
    </label>
  );
}
