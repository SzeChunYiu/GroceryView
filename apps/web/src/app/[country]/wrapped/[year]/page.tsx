import { PageShell } from '@/components/data-ui';

type WrappedPageProps = {
  params: {
    country: string;
    year: string;
  };
};

function digestFor(country: string, year: string) {
  return {
    country: country.toUpperCase(),
    year,
    topStores: ['Willys', 'ICA', 'Coop'],
    topCategories: ['Pantry staples', 'Dairy', 'Fruit & veg'],
    mostPurchasedProduct: 'Oat milk 1L',
    savingsMissed: '312 kr in verified deals not captured',
    switchingSavings: '428 kr saved by switching comparable brands'
  };
}

export default function GroceryWrappedPage({ params }: WrappedPageProps) {
  const digest = digestFor(params.country, params.year);

  return (
    <PageShell>
      <section className="rounded-[2rem] bg-gradient-to-br from-emerald-900 via-slate-950 to-purple-950 p-6 text-white shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-200">Your grocery year-in-review</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{digest.country} · {digest.year}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50">
          A shareable annual digest of store habits, category patterns, missed deals, and verified brand-switch savings.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Top stores</p>
            <ol className="mt-3 space-y-2 text-2xl font-black">
              {digest.topStores.map((store) => <li key={store}>{store}</li>)}
            </ol>
          </div>
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Top categories</p>
            <ul className="mt-3 space-y-2 text-xl font-black">
              {digest.topCategories.map((category) => <li key={category}>{category}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Most-purchased product</p>
            <p className="mt-3 text-3xl font-black">{digest.mostPurchasedProduct}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Savings</p>
            <p className="mt-3 text-lg font-black">Missed: {digest.savingsMissed}</p>
            <p className="mt-2 text-lg font-black">Switched brands: {digest.switchingSavings}</p>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-white/20 bg-white/10 p-5" data-share-card="grocery-wrapped">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Shareable card</p>
          <p className="mt-2 text-2xl font-black">{digest.year}: {digest.topStores[0]} topped your shops while {digest.switchingSavings}.</p>
        </div>
      </section>
    </PageShell>
  );
}
