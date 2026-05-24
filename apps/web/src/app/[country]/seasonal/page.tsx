import { nordicSeasonalProduce, seasonalProduceFor } from '@groceryview/core';

type SeasonalPageProps = { params: Promise<{ country: string }> };

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function SeasonalPage({ params }: SeasonalPageProps) {
  const { country } = await params;
  const countryCode = country.toLocaleLowerCase('sv-SE');
  const currentMonth = new Date().getMonth() + 1;
  const currentRows = seasonalProduceFor(countryCode, currentMonth);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Seasonal produce</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Nordic seasonal calendar</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Educational guide to produce that is typically in season and locally cheap in {countryCode.toUpperCase()}.
      </p>

      <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-2xl font-black text-emerald-950">This month</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(currentRows.length ? currentRows : seasonalProduceFor(countryCode, 10)).map((row) => <ProduceCard key={`${row.month}-${row.produce}`} row={row} />)}
        </div>
      </section>

      <section className="mt-8 grid gap-3 md:grid-cols-2">
        {nordicSeasonalProduce
          .filter((row) => row.countries.includes(countryCode))
          .map((row) => <ProduceCard key={`${row.month}-${row.produce}`} row={row} />)}
      </section>
    </main>
  );
}

function ProduceCard({ row }: { row: { month: number; produce: string; locallyCheap: boolean; note: string } }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{monthNames[row.month - 1]}</p>
      <h3 className="mt-2 text-xl font-black capitalize text-slate-950">{row.produce}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-600">{row.note}</p>
      <p className="mt-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">{row.locallyCheap ? 'Locally cheap' : 'Seasonal premium'}</p>
    </article>
  );
}
