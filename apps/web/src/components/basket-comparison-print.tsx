'use client';

import type { ChainCompareProductRow, CompareChainId } from '@/lib/chain-compare';

type BasketComparisonPrintProps = {
  products: ChainCompareProductRow[];
  chains: readonly { id: CompareChainId; label: string }[];
  sourceLabel: string;
};

function formatSek(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value)
    : '—';
}

export function BasketComparisonPrint({ chains, products, sourceLabel }: Readonly<BasketComparisonPrintProps>) {
  const rows = products.map((product) => {
    const pricedCells = product.cells.filter((cell) => cell.price !== null);
    const bestCell = pricedCells.slice().sort((left, right) => (left.price ?? Infinity) - (right.price ?? Infinity))[0] ?? null;

    return {
      product,
      bestCell,
      substitution: bestCell?.productName && bestCell.productName !== product.productName ? bestCell.productName : 'Exact/requested row',
      confidence: product.confidenceLabel
    };
  });

  const totals = chains.map((chain) => {
    const cells = products.map((product) => product.cells.find((cell) => cell.chainId === chain.id));
    const priced = cells.filter((cell) => typeof cell?.price === 'number');
    const total = priced.reduce((sum, cell) => sum + (cell?.price ?? 0), 0);
    return {
      ...chain,
      total,
      missing: products.length - priced.length,
      complete: products.length > 0 && priced.length === products.length
    };
  });
  const bestComplete = totals.filter((total) => total.complete).slice().sort((left, right) => left.total - right.total)[0] ?? null;

  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm print:mt-0 print:border-slate-400 print:shadow-none" data-basket-comparison-print>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:block">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Printable basket plan</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Side-by-side basket comparison</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Print this table for selected chains with totals, possible substitutions, savings versus the cheapest complete basket, and confidence notes.
          </p>
        </div>
        <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white print:hidden" onClick={() => window.print()} type="button">
          Print basket
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3 print:grid-cols-3">
        {totals.map((total) => {
          const savings = bestComplete && total.complete ? total.total - bestComplete.total : null;
          return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" key={total.id}>
              <p className="text-sm font-black text-slate-950">{total.label}</p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{total.complete ? formatSek(total.total) : `${formatSek(total.total)} known`}</p>
              <p className="mt-1 text-xs font-bold text-slate-600">{total.complete ? 'Complete basket coverage' : `${total.missing} missing selected row${total.missing === 1 ? '' : 's'}`}</p>
              {savings !== null ? <p className="mt-1 text-xs font-bold text-slate-600">{savings === 0 ? 'Cheapest complete basket' : `${formatSek(savings)} above cheapest`}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm print:text-xs">
          <caption className="sr-only">Printable basket comparison across selected chains</caption>
          <thead>
            <tr className="bg-slate-950 text-white print:bg-white print:text-slate-950">
              <th className="border border-slate-200 px-3 py-2 font-black">Product</th>
              {chains.map((chain) => <th className="border border-slate-200 px-3 py-2 font-black" key={chain.id}>{chain.label}</th>)}
              <th className="border border-slate-200 px-3 py-2 font-black">Substitution / confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ bestCell, confidence, product, substitution }) => (
              <tr key={product.productSlug}>
                <th className="border border-slate-200 px-3 py-2 align-top font-black text-slate-950">{product.productName}</th>
                {chains.map((chain) => {
                  const cell = product.cells.find((candidate) => candidate.chainId === chain.id);
                  return (
                    <td className="border border-slate-200 px-3 py-2 align-top" key={`${product.productSlug}-${chain.id}`}>
                      <p className={cell?.status === 'priced' ? 'font-black text-slate-950' : 'font-bold text-slate-500'}>{cell?.priceText ?? 'Missing'}</p>
                      <p className="text-xs font-semibold text-slate-500">{cell?.unitLabel ?? 'Not found for this chain'}</p>
                    </td>
                  );
                })}
                <td className="border border-slate-200 px-3 py-2 align-top">
                  <p className="font-black text-slate-950">Best: {bestCell?.chainName ?? 'No priced chain'}</p>
                  <p className="mt-1 font-semibold text-slate-600">{substitution}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{confidence}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">Source: {sourceLabel}. Missing rows are not estimated for print totals.</p>
    </section>
  );
}
