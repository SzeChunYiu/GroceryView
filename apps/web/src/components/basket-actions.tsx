'use client';

import type { BasketCalculatorProduct } from './basket-calculator';
import { BasketRow } from './basket-row';

type BasketActionsProps = {
  products: BasketCalculatorProduct[];
  selectedProductIds: Set<string>;
  selectedProductCount: number;
  onToggleProduct: (productId: string) => void;
};

export function BasketActions({ products, selectedProductIds, selectedProductCount, onToggleProduct }: Readonly<BasketActionsProps>) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Add products</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Build a basket from current chain rows</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Tick products to add or remove them. No state persistence is used for v1; the selection stays in memory only for this tab render.
          </p>
        </div>
        <p className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-950">
          {selectedProductCount} selected
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {products.map((product) => (
          <BasketRow
            checked={selectedProductIds.has(product.id)}
            key={product.id}
            onToggle={onToggleProduct}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
