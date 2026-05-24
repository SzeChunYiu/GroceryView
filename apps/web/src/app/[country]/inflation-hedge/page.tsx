type InflationHedgePageProps = {
  params: Promise<{ country: string }>;
};

const officialCpiByCountry: Record<string, number> = {
  se: 2.3,
  no: 3.1,
  dk: 1.9,
  fi: 2.1,
  is: 5.8
};

const basketLines = [
  { name: 'Coffee', currentStore: 'Hemköp', currentBrand: 'Zoégas', basketInflation: 8.4, switchTo: 'Willys + Garant', switchInflation: 2.1 },
  { name: 'Milk', currentStore: 'ICA', currentBrand: 'Arla', basketInflation: 5.2, switchTo: 'Coop + Änglamark promo', switchInflation: 1.4 },
  { name: 'Pasta', currentStore: 'Hemköp', currentBrand: 'Kungsörnen', basketInflation: 11.6, switchTo: 'Willys + store brand', switchInflation: 3.2 }
];

const averageBasketInflation = basketLines.reduce((sum, line) => sum + line.basketInflation, 0) / basketLines.length;
const hedgedBasketInflation = basketLines.reduce((sum, line) => sum + line.switchInflation, 0) / basketLines.length;

export default async function InflationHedgePage({ params }: InflationHedgePageProps) {
  const { country } = await params;
  const countryCode = country.toLocaleLowerCase('sv-SE');
  const officialCpi = officialCpiByCountry[countryCode] ?? officialCpiByCountry.se;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Personal inflation hedge</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Your basket vs official CPI</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Compare your recurring grocery basket inflation with the official CPI baseline for {countryCode.toUpperCase()} and review verified store or brand switches that lower personal inflation.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Metric label="Official CPI" value={`${officialCpi.toFixed(1)}%`} />
        <Metric label="Your basket" value={`${averageBasketInflation.toFixed(1)}%`} />
        <Metric label="After switches" value={`${hedgedBasketInflation.toFixed(1)}%`} />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Switch suggestions</h2>
        <div className="mt-4 divide-y divide-slate-200">
          {basketLines.map((line) => (
            <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto]" key={line.name}>
              <div>
                <p className="font-black text-slate-950">{line.name}</p>
                <p className="text-sm font-semibold text-slate-600">Current: {line.currentStore} · {line.currentBrand}</p>
                <p className="text-sm font-semibold text-emerald-800">Switch: {line.switchTo}</p>
              </div>
              <p className="font-black text-rose-700">{line.basketInflation.toFixed(1)}% now</p>
              <p className="font-black text-emerald-700">{line.switchInflation.toFixed(1)}% hedged</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
      <p className="text-sm font-black text-emerald-900">{label}</p>
      <p className="mt-2 text-4xl font-black text-emerald-950">{value}</p>
    </div>
  );
}
