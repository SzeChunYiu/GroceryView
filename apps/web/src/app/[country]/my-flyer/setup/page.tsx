import type { Metadata } from 'next';

type MyFlyerSetupPageProps = Readonly<{ params: Promise<{ country: string }> }>;

type StoreOption = {
  id: string;
  name: string;
  region: string;
  badge: string;
};

type AlgorithmOption = {
  id: string;
  name: string;
  description: string;
  signal: string;
};

const countryDefaults: Record<string, { label: string; currency: string; stores: StoreOption[] }> = {
  se: {
    label: 'Sweden',
    currency: 'SEK',
    stores: [
      { id: 'willys', name: 'Willys', region: 'Nationwide', badge: 'price-led' },
      { id: 'hemkop', name: 'Hemköp', region: 'Urban', badge: 'fresh picks' },
      { id: 'ica', name: 'ICA', region: 'Local stores', badge: 'broad range' },
      { id: 'citygross', name: 'City Gross', region: 'Big-box', badge: 'bulk value' }
    ]
  },
  no: {
    label: 'Norway',
    currency: 'NOK',
    stores: [
      { id: 'coop-extra-no', name: 'Coop Extra', region: 'Nationwide', badge: 'Extra-kupp' },
      { id: 'rema-1000-no', name: 'REMA 1000', region: 'Neighborhood', badge: 'low price' },
      { id: 'kiwi-no', name: 'KIWI', region: 'Everyday', badge: 'green deals' },
      { id: 'meny-no', name: 'MENY', region: 'Premium', badge: 'quality' }
    ]
  },
  dk: {
    label: 'Denmark',
    currency: 'DKK',
    stores: [
      { id: 'netto-dk', name: 'Netto', region: 'Everyday', badge: 'discount' },
      { id: 'foetex-dk', name: 'føtex', region: 'Supermarket', badge: 'weekly' },
      { id: 'bilka-dk', name: 'Bilka', region: 'Hypermarket', badge: 'bulk' },
      { id: 'rema-1000-dk', name: 'REMA 1000', region: 'Neighborhood', badge: 'simple' }
    ]
  }
};

const algorithms: AlgorithmOption[] = [
  {
    id: 'balanced-savings',
    name: 'Balanced savings',
    description: 'Mixes lowest observed prices with enough variety for a realistic weekly flyer.',
    signal: 'price + variety'
  },
  {
    id: 'max-discount',
    name: 'Maximum discount',
    description: 'Prioritizes the strongest markdowns first, even when the basket gets more promotional.',
    signal: 'savings first'
  },
  {
    id: 'nearby-stores',
    name: 'Nearby stores',
    description: 'Keeps the flyer focused on favorite stores and avoids deals that require long detours.',
    signal: 'store fit'
  }
];

function titleCaseSegment(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveCountry(country: string) {
  const key = (country || 'se').toLowerCase();
  return { key, ...(countryDefaults[key] ?? { ...countryDefaults.se, label: titleCaseSegment(key) || 'Sweden' }) };
}

export async function generateMetadata({ params }: MyFlyerSetupPageProps): Promise<Metadata> {
  const { country } = await params;
  const market = resolveCountry(country);
  return {
    title: `${market.label} MyFlyer setup | GroceryView`,
    description: 'First-time MyFlyer setup for country, favorite stores, and the flyer ranking algorithm.'
  };
}

export default async function MyFlyerSetupPage({ params }: MyFlyerSetupPageProps) {
  const { country } = await params;
  const market = resolveCountry(country);
  const defaultStores = market.stores.slice(0, 2).map((store) => store.id);
  const userPreferencesPayload = {
    country: market.key,
    currency: market.currency,
    preferredStores: defaultStores,
    myFlyerAlgorithm: algorithms[0].id,
    skipped: false
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#10140f] px-4 py-8 text-cream-50 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl rounded-[2.25rem] border border-lime-200/20 bg-[#f8f1df] p-4 text-slate-950 shadow-2xl shadow-black/40 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative overflow-hidden rounded-[1.75rem] bg-[#d9ff66] p-7">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[28px] border-slate-950/10" />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-700">First-time setup</p>
            <h1 className="mt-4 max-w-sm text-5xl font-black tracking-[-0.07em] sm:text-6xl">
              Tune your {market.label} MyFlyer before the first print.
            </h1>
            <p className="mt-5 max-w-md text-base font-semibold leading-7 text-slate-800">
              Three quick choices fill <code className="rounded bg-white/60 px-1 py-0.5">user_preferences</code> so GroceryView can rank weekly flyer cards by market, favorite stores, and shopping strategy.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs font-black uppercase tracking-[0.14em]">
              <span className="rounded-full bg-slate-950 px-3 py-2 text-[#d9ff66]">Country</span>
              <span className="rounded-full bg-white/70 px-3 py-2">Stores</span>
              <span className="rounded-full bg-white/70 px-3 py-2">Algorithm</span>
            </div>
          </aside>

          <form action="/api/settings" className="rounded-[1.75rem] border border-stone-300 bg-[#fffdf7] p-5 sm:p-7" method="post">
            <input name="user_preferences" type="hidden" value={JSON.stringify(userPreferencesPayload)} />
            <input name="country" type="hidden" value={market.key} />
            <input name="currency" type="hidden" value={market.currency} />

            <ol className="space-y-5">
              <li className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">1</span>
                  <div>
                    <h2 className="text-2xl font-black tracking-[-0.04em]">Pick country</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Prefilled from the route, but visible so the saved preference is auditable.</p>
                    <div className="mt-4 rounded-2xl border-2 border-slate-950 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Selected market</p>
                      <p className="mt-1 text-3xl font-black">{market.label}</p>
                      <p className="text-sm font-bold text-slate-600">Currency saved as {market.currency}</p>
                    </div>
                  </div>
                </div>
              </li>

              <li className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">2</span>
                  <div className="w-full">
                    <h2 className="text-2xl font-black tracking-[-0.04em]">Pick favorite stores</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Defaults select two stores; shoppers can refine the favorite_stores rows before saving.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {market.stores.map((store) => (
                        <label className="group rounded-2xl border-2 border-stone-200 bg-white p-4 font-bold transition hover:-translate-y-0.5 hover:border-slate-950" key={store.id}>
                          <input className="mr-2 accent-lime-500" defaultChecked={defaultStores.includes(store.id)} name="preferredStores" type="checkbox" value={store.id} />
                          <span className="text-lg font-black">{store.name}</span>
                          <span className="mt-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{store.region} · {store.badge}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </li>

              <li className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">3</span>
                  <div className="w-full">
                    <h2 className="text-2xl font-black tracking-[-0.04em]">Pick algorithm</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Controls how MyFlyer ranks deals once preferences are saved.</p>
                    <div className="mt-4 space-y-3">
                      {algorithms.map((algorithm, index) => (
                        <label className="block rounded-2xl border-2 border-stone-200 bg-white p-4 font-bold hover:border-lime-500" key={algorithm.id}>
                          <input className="mr-2 accent-lime-500" defaultChecked={index === 0} name="myFlyerAlgorithm" type="radio" value={algorithm.id} />
                          <span className="text-lg font-black">{algorithm.name}</span>
                          <span className="ml-2 rounded-full bg-lime-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-lime-900">{algorithm.signal}</span>
                          <span className="mt-2 block text-sm leading-6 text-slate-600">{algorithm.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            </ol>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-full bg-slate-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-950/20" type="submit">
                Save setup
              </button>
              <button className="rounded-full border-2 border-slate-300 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700" formAction="/api/settings?skip=my-flyer" name="skipped" type="submit" value="true">
                Skip for now
              </button>
              <a className="rounded-full px-6 py-3 text-center text-sm font-black uppercase tracking-[0.16em] text-slate-600" href={`/${market.key}/my-flyer`}>
                Preview flyer
              </a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
