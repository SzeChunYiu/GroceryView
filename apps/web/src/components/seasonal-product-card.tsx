import Link from 'next/link';
import type { SeasonalProduceDrilldownCard } from '@/lib/trends';

export function SeasonalProductCard({ card }: Readonly<{ card: SeasonalProduceDrilldownCard }>) {
  return (
    <article className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Best month · {card.bestBuyMonth}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{card.productName}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-600">{card.brand}</p>
      <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-950">{card.expectedPriceBehavior}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-700">
        {card.recommendedChains.map((chain) => <span className="rounded-full bg-slate-100 px-3 py-1" key={chain}>{chain}</span>)}
      </div>
      <div className="mt-4 grid gap-2">
        {card.monthlyDrilldown.slice(0, 4).map((month) => (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-700" key={month.monthLabel}>
            <div className="flex items-center justify-between gap-3">
              <span>{month.monthLabel}</span>
              <span>{month.averageLabel}</span>
            </div>
            <p className="mt-1 text-slate-500">{month.observationCount} observations · range {month.rangeLabel}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{card.savingsVsTypicalLabel} · {card.confidenceLabel}</p>
      <Link className="mt-3 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-xs font-black text-white" href={`/products/${card.slug}`}>
        Open product details
      </Link>
    </article>
  );
}
