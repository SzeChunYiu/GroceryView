type RetailerCoverageRow = {
  retailer_type: string;
  chains: string[];
  freshestPriceAt: string;
};

const retailerCoverageByCountry: Record<string, RetailerCoverageRow[]> = {
  se: [
    { retailer_type: 'supermarket', chains: ['ICA', 'Coop', 'Hemköp', 'City Gross'], freshestPriceAt: '2026-05-23T20:00:00.000Z' },
    { retailer_type: 'discount', chains: ['Willys', 'Lidl', 'ÖoB'], freshestPriceAt: '2026-05-23T18:30:00.000Z' },
    { retailer_type: 'convenience', chains: ['Pressbyrån', '7-Eleven', 'Tempo'], freshestPriceAt: '2026-05-22T17:15:00.000Z' },
    { retailer_type: 'online', chains: ['Matsmart', 'Mathem', 'Goodstore'], freshestPriceAt: '2026-05-24T07:00:00.000Z' },
    { retailer_type: 'wholesale', chains: ['Snabbgross', 'Martin & Servera'], freshestPriceAt: '2026-05-21T09:20:00.000Z' },
    { retailer_type: 'pharmacy', chains: ['Apoteket', 'Apotea'], freshestPriceAt: '2026-05-20T12:00:00.000Z' },
    { retailer_type: 'fuel', chains: ['Circle K', 'OKQ8', 'Preem'], freshestPriceAt: '2026-05-23T11:45:00.000Z' },
    { retailer_type: 'specialty', chains: ['Goodstore', 'Asian Market'], freshestPriceAt: '2026-05-24T08:30:00.000Z' },
  ],
  is: [
    { retailer_type: 'supermarket', chains: ['Krónan', 'Hagkaup'], freshestPriceAt: '2026-05-22T16:00:00.000Z' },
    { retailer_type: 'discount', chains: ['Bónus'], freshestPriceAt: '2026-05-24T06:00:00.000Z' },
    { retailer_type: 'convenience', chains: ['10-11'], freshestPriceAt: '2026-05-19T13:00:00.000Z' },
    { retailer_type: 'online', chains: ['Heimkaup'], freshestPriceAt: '2026-05-20T10:00:00.000Z' },
  ],
};

function formatFreshness(value: string) {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function CountryCoveragePage({ params }: { params: { country: string } }) {
  const country = params.country.toLowerCase();
  const groups = retailerCoverageByCountry[country] ?? retailerCoverageByCountry.se;
  const totalChains = groups.reduce((sum, group) => sum + group.chains.length, 0);
  const freshestAt = groups.map((group) => group.freshestPriceAt).sort().at(-1) ?? '';

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{country.toUpperCase()} coverage</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Retailer type coverage</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Chains are grouped by retailer_type so shoppers can verify GroceryView tracks supermarkets, discounters, convenience stores, online grocers, wholesale, pharmacies, fuel, and specialty shops.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">retailer_type groups</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{groups.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">displayed chains</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{totalChains}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">freshest group</p>
          <p className="mt-2 text-sm font-black text-slate-950">{freshestAt ? formatFreshness(freshestAt) : 'No rows'}</p>
        </div>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Retailer type groups">
        {groups.map((group) => (
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={group.retailer_type}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">retailer_type</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{group.retailer_type}</h2>
              </div>
              <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900">{group.chains.length} chains</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">Freshest price row: {formatFreshness(group.freshestPriceAt)}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.chains.map((chain) => (
                <li className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700" key={chain}>{chain}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
