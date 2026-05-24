'use client';

import Link from 'next/link';
import { formatSek } from './basket-formatting';

type BasketTotalsChain = {
  complete: boolean;
  id: string;
  missingCount: number;
  name: string;
  total: number;
};

type BasketTotalsAssignment = {
  lineTotal: number;
  productId: string;
  productName: string;
  productSlug: string | null;
  storeId: string;
  storeName: string;
  unitPrice: number;
};

type BasketTotalsProps = {
  assignments: BasketTotalsAssignment[];
  bestFullChain: { storeName: string; total: number } | null;
  chainTotals: BasketTotalsChain[];
  selectedProductCount: number;
  sourceLabel: string;
  splitStoreCount: number;
  splitTotal: number;
};

export function BasketTotals({
  assignments,
  bestFullChain,
  chainTotals,
  selectedProductCount,
  sourceLabel,
  splitStoreCount,
  splitTotal
}: Readonly<BasketTotalsProps>) {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Best full-chain total</p>
        <p className="mt-2 text-5xl font-black tracking-tight text-emerald-950">
          {bestFullChain ? formatSek(bestFullChain.total) : selectedProductCount ? 'No full chain' : 'Select products'}
        </p>
        <p className="mt-3 text-lg font-black text-slate-950">
          {bestFullChain ? bestFullChain.storeName : 'Every chain is missing at least one selected product.'}
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
          The full-chain winner only appears when a single chain has every selected product priced. Missing DB rows stay visible and never get estimated.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Cheapest split basket</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <p className="text-4xl font-black tracking-tight text-slate-950">{formatSek(splitTotal)}</p>
          <p className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">
            {splitStoreCount} chains
          </p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          compareBasketStrategies picks the cheapest observed chain for each selected line, then shows savings against the best complete one-chain shop when one exists.
        </p>
        <div className="mt-4 space-y-2">
          {assignments.length > 0 ? assignments.map((assignment) => (
            <Link
              className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm hover:bg-emerald-50 sm:grid-cols-[1fr_auto]"
              href={`/products/${assignment.productSlug ?? assignment.productId}`}
              key={`${assignment.productId}-${assignment.storeId}`}
            >
              <span>
                <span className="block font-black text-slate-950">{assignment.productName}</span>
                <span className="mt-1 block font-semibold text-slate-600">{assignment.storeName} · {formatSek(assignment.unitPrice)} each</span>
              </span>
              <span className="font-black text-emerald-800">{formatSek(assignment.lineTotal)}</span>
            </Link>
          )) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">Select at least one product to calculate the split basket.</p>
          )}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Chain totals and missing rows</p>
        <div className="mt-4 space-y-2">
          {chainTotals.map((chain) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" key={chain.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-black text-slate-950">{chain.name}</p>
                <p className="font-black text-slate-950">{formatSek(chain.total)}</p>
              </div>
              <p className={`mt-1 text-sm font-bold ${chain.complete ? 'text-emerald-800' : 'text-amber-800'}`}>
                {chain.complete ? 'Full selected-basket coverage' : `${chain.missingCount} selected product${chain.missingCount === 1 ? '' : 's'} missing`}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
          Source: {sourceLabel}. No state persistence, shopper profile, or retailer checkout handoff is performed on this calculator.
        </p>
      </div>
    </div>
  );
}
