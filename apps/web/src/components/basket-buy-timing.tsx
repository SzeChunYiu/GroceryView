import Link from 'next/link';
import { summarizeBasketBuyTiming, type BasketBuyTimingRecommendation } from '@/lib/price-intelligence';

const actionClasses: Record<BasketBuyTimingRecommendation['action'], string> = {
  buy_now: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  substitute: 'border-sky-200 bg-sky-50 text-sky-950',
  watch: 'border-amber-200 bg-amber-50 text-amber-950'
};

export function BasketBuyTiming({
  recommendations
}: Readonly<{
  recommendations: BasketBuyTimingRecommendation[];
}>) {
  const summary = summarizeBasketBuyTiming(recommendations);

  return (
    <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Basket best-time-to-buy</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Whole-trip timing recommendations</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Each selected basket line is classified as buy now, watch, or substitute from observed current chain rows and comparison prices. This is not a forecast and does not auto-rewrite the basket.
          </p>
        </div>
        <div className="grid min-w-[18rem] grid-cols-3 gap-2 text-center">
          <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-950">
            <span className="block text-2xl font-black">{summary.buyNow}</span>
            <span className="text-xs font-bold uppercase tracking-[0.14em]">buy now</span>
          </p>
          <p className="rounded-2xl bg-amber-50 p-3 text-amber-950">
            <span className="block text-2xl font-black">{summary.watch}</span>
            <span className="text-xs font-bold uppercase tracking-[0.14em]">watch</span>
          </p>
          <p className="rounded-2xl bg-sky-50 p-3 text-sky-950">
            <span className="block text-2xl font-black">{summary.substitute}</span>
            <span className="text-xs font-bold uppercase tracking-[0.14em]">substitute</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {recommendations.map((item) => (
          <article className={`rounded-2xl border p-4 shadow-sm ${actionClasses[item.action]}`} data-buy-timing-action={item.action} key={item.id}>
            <p className="text-xs font-black uppercase tracking-[0.18em]">{item.actionLabel} · {item.confidenceLabel}</p>
            <h3 className="mt-2 text-lg font-black">{item.productName}</h3>
            <p className="mt-1 text-sm font-semibold">{item.categoryLabel} · {item.currentStoreName} · {item.currentPriceLabel}</p>
            <p className="mt-3 rounded-xl bg-white/75 p-3 text-sm font-semibold leading-6">{item.rationale}</p>
            {item.substitute ? (
              <p className="mt-3 rounded-xl bg-white/75 p-3 text-xs font-bold leading-5">
                Suggested substitute: {item.substitute.productName} · {item.substitute.storeName} · {item.substitute.priceLabel}
              </p>
            ) : null}
            <Link className="mt-3 inline-flex text-sm font-black underline decoration-current underline-offset-4" href={`/products/${item.id}`}>
              Review product evidence
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
