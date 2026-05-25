'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ChainPriceComparisonMode, ChainPriceModeQuote } from '@/lib/chain-compare';

const chainPriceMatrixModes: Array<{ id: ChainPriceComparisonMode; label: string; guardrail: string }> = [
  { id: 'regular', label: 'Regular', guardrail: 'Public shelf/catalogue price.' },
  { id: 'member', label: 'Member', guardrail: 'Requires signed-in loyalty eligibility before a member price can be counted.' },
  { id: 'coupon', label: 'Coupon', guardrail: 'Requires an account-bound clipped coupon before savings can be counted.' },
  { id: 'stacked', label: 'Stacked', guardrail: 'Requires both eligible member price and clipped coupon evidence.' }
];

export type StorePriceMatrixChain = {
  id: string;
  label: string;
};

type StorePriceMatrixCell = {
  chainId: string;
  priceText?: string;
  priceModes?: ChainPriceModeQuote[];
  productName?: string | null;
  productSlug?: string | null;
  status: string;
  unitLabel?: string | null;
};

export type StorePriceMatrixProduct = {
  brand?: string | null;
  cells: ReadonlyArray<StorePriceMatrixCell>;
  packageLabel?: string | null;
  productName: string;
  productSlug: string;
};

type StorePriceMatrixProps = {
  chains: ReadonlyArray<StorePriceMatrixChain>;
  products: ReadonlyArray<StorePriceMatrixProduct>;
};

function formatStoreUnit(cell: StorePriceMatrixCell | undefined) {
  if (!cell || cell.status !== 'priced') {
    return 'Not available';
  }

  return cell.unitLabel || 'Unit not reported';
}

function selectedQuote(cell: StorePriceMatrixCell | undefined, mode: ChainPriceComparisonMode) {
  return cell?.priceModes?.find((quote) => quote.mode === mode) ?? null;
}

export function StorePriceMatrix({ chains, products }: StorePriceMatrixProps) {
  const [comparisonMode, setComparisonMode] = useState<ChainPriceComparisonMode>('regular');
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-white px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Store price matrix</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Selected products across stores</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Prices are shown side by side with the comparable unit label so shoppers can compare normalized store prices without opening each store detail page.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Chain price comparison mode">
          {chainPriceMatrixModes.map((mode) => (
            <button
              aria-pressed={comparisonMode === mode.id}
              className={`rounded-full px-3 py-2 text-xs font-black ${comparisonMode === mode.id ? 'bg-emerald-900 text-white' : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'}`}
              key={mode.id}
              onClick={() => setComparisonMode(mode.id)}
              title={mode.guardrail}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">Selected product prices across stores with comparable per-unit labels</caption>
          <thead className="bg-emerald-950 text-white">
            <tr>
              <th className="px-4 py-3 font-black">Product</th>
              {chains.map((chain) => (
                <th className="px-4 py-3 font-black" key={chain.id}>{chain.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className="border-t border-slate-100 align-top" key={product.productSlug}>
                <th className="min-w-64 px-4 py-4 font-black text-slate-950">
                  <Link className="underline decoration-emerald-300 underline-offset-4" href={`/products/${product.productSlug}`}>{product.productName}</Link>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{product.brand || 'Brand not reported'} · {product.packageLabel || 'Package not reported'}</span>
                </th>
                {chains.map((chain) => {
                  const cell = product.cells.find((item) => item.chainId === chain.id);
                  const quote = selectedQuote(cell, comparisonMode);
                  const cellStatus = quote?.status ?? cell?.status;
                  return (
                    <td className="min-w-48 px-4 py-4" key={`${product.productSlug}-${chain.id}`}>
                      <p className={cellStatus === 'priced' ? 'font-black text-emerald-900' : cellStatus === 'account_required' ? 'font-black text-amber-900' : 'font-black text-slate-400'}>{quote?.priceText ?? cell?.priceText ?? 'Missing'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{formatStoreUnit(cell)}</p>
                      {quote?.guardrail ? (
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{quote.guardrail}</p>
                      ) : null}
                      {cell?.productSlug ? (
                        <Link className="mt-2 block text-xs font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={`/products/${cell.productSlug}`}>
                          {cell.productName ?? cell.productSlug}
                        </Link>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
