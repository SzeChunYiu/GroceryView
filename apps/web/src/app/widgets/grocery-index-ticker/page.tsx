import Link from 'next/link';
import { calculateChainPriceIndex } from '@groceryview/core';
import { buildChainPriceObservations, buildMatchedBasketChainPriceObservations } from '@/lib/chain-index-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/widgets/grocery-index-ticker');
}

const groceryIndex = calculateChainPriceIndex([
  ...buildChainPriceObservations(),
  ...buildMatchedBasketChainPriceObservations()
]);

const sourceConfidence = groceryIndex.chains.reduce(
  (summary, chain) => ({
    ...summary,
    [chain.confidence]: summary[chain.confidence] + 1
  }),
  { high: 0, medium: 0, low: 0 } as Record<'high' | 'medium' | 'low', number>
);

function indexTone(index: number) {
  if (index < 98) return 'bg-emerald-100 text-emerald-950';
  if (index > 102) return 'bg-amber-100 text-amber-950';
  return 'bg-slate-100 text-slate-950';
}

function confidenceTone(confidence: 'high' | 'medium' | 'low') {
  if (confidence === 'high') return 'bg-emerald-700 text-white';
  if (confidence === 'medium') return 'bg-blue-700 text-white';
  return 'bg-slate-700 text-white';
}

export default function GroceryIndexTickerWidget() {
  const cheapest = groceryIndex.chains[0];
  const priciest = groceryIndex.chains[groceryIndex.chains.length - 1];

  return (
    <main className="min-h-screen bg-emerald-950 p-3 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/20 bg-white p-4 text-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Grocery Index ticker</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Swedish chain price pulse</h1>
            <p className="mt-1 max-w-xl text-sm font-semibold text-slate-600">
              Live embeddable 100-centred chain index built from verified normalized unit-price observations plus matched-basket Axfood rows.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Observations</p>
            <p className="text-3xl font-black text-emerald-950">{groceryIndex.generatedFrom}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {groceryIndex.chains.slice(0, 4).map((chain) => (
            <article className={`rounded-2xl p-4 ${indexTone(chain.overallIndex)}`} key={chain.chainId}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-black">{chain.chainId}</h2>
                <span className={`rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] ${confidenceTone(chain.confidence)}`}>{chain.confidence}</span>
              </div>
              <p className="mt-3 text-4xl font-black">{chain.overallIndex.toFixed(1)}</p>
              <p className="mt-1 text-xs font-bold opacity-80">{chain.categoriesCovered} categories · {chain.observations} rows</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Cheapest</p>
            <p className="mt-1 text-lg font-black text-emerald-950">{cheapest ? `${cheapest.chainId} ${cheapest.overallIndex.toFixed(1)}` : 'No index yet'}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Highest index</p>
            <p className="mt-1 text-lg font-black text-amber-950">{priciest ? `${priciest.chainId} ${priciest.overallIndex.toFixed(1)}` : 'No index yet'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">sourceConfidence</p>
            <p className="mt-1 text-sm font-black text-slate-950">High {sourceConfidence.high} · Medium {sourceConfidence.medium} · Low {sourceConfidence.low}</p>
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
          100 is the market-median basket. Lower scores are cheaper. The ticker avoids store-level price claims and links back to the{' '}
          <Link className="font-black text-emerald-800 underline" href="/chain-index" target="_top">full GroceryView chain index</Link>{' '}
          for source boundaries.
        </p>
      </section>
    </main>
  );
}
