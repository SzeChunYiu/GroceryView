import { routeMetadata } from '@/lib/seo';
import { buildIcelandStarterBasketReadiness, icelandStarterBasketItems } from '@/lib/iceland-starter-basket';

export const metadata = routeMetadata({
  path: '/iceland/starter-basket',
  noIndex: true,
  noIndexFollow: true,
  title: 'Iceland starter basket preview | GroceryView',
  description: 'Reykjavik starter basket coverage targets for Iceland grocery price comparison. Preview taxonomy only; no live ISK prices or nationwide coverage claims.'
});

const categoryLabels = {
  dairy: 'Dairy',
  bread: 'Bread',
  produce: 'Produce',
  'meat-fish': 'Meat and fish',
  pantry: 'Pantry',
  hygiene: 'Hygiene'
} as const;

export default function IcelandStarterBasketPage() {
  const readiness = buildIcelandStarterBasketReadiness();
  const groupedItems = Object.entries(readiness.categoryCounts).map(([category, count]) => ({
    category: category as keyof typeof categoryLabels,
    count,
    items: icelandStarterBasketItems.filter((item) => item.category === category)
  }));

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Iceland preview</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Reykjavik starter basket</h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
          {readiness.benchmarkLabel} for dairy, bread, produce, meat/fish, pantry, and household hygiene. {readiness.guardrail}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <p className="rounded-2xl bg-slate-950 p-4 text-sm font-black text-white">Items <span className="block text-3xl">{readiness.itemCount}</span></p>
          <p className="rounded-2xl bg-slate-100 p-4 text-sm font-black text-slate-800">Live ISK prices <span className="block text-3xl">{readiness.livePriceObservationCount}</span></p>
          <p className="rounded-2xl bg-slate-100 p-4 text-sm font-black text-slate-800">Scope <span className="block text-lg">{readiness.cityScope}</span></p>
          <p className="rounded-2xl bg-amber-100 p-4 text-sm font-black text-amber-950">Index status <span className="block text-lg">{readiness.chainIndexStatus.replaceAll('_', ' ')}</span></p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {groupedItems.map((group) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={group.category}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{group.count} targets</p>
                <h2 className="mt-2 text-2xl font-black">{categoryLabels[group.category]}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">no prices</span>
            </div>
            <ul className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
              {group.items.map((item) => (
                <li className="rounded-xl bg-slate-50 px-3 py-2" key={item.id}>{item.name}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black">Chain benchmark targets</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {readiness.chainTargets.map((chain) => (
            <p className="rounded-xl bg-slate-50 p-4 text-sm font-black text-slate-800" key={chain.chainId}>
              {chain.label}
              <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-slate-500">{chain.role}</span>
            </p>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{readiness.confidenceLabel}</p>
      </section>
    </main>
  );
}

