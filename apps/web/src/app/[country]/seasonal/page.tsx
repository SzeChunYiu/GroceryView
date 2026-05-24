import { countrySeasonalProduce, seasonalProduceFor, type NordicCountry } from '@groceryview/core';

const countries = new Set<NordicCountry>(['SE', 'NO', 'IS']);
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function countryFromParam(value: string): NordicCountry {
  const normalized = value.toUpperCase() as NordicCountry;
  return countries.has(normalized) ? normalized : 'SE';
}

function currentMonth() {
  return new Date().getUTCMonth() + 1;
}

export default async function SeasonalProducePage({ params }: { params: Promise<{ country: string }> }) {
  const { country: countryParam } = await params;
  const country = countryFromParam(countryParam);
  const month = currentMonth();
  const current = seasonalProduceFor(country, month);
  const all = countrySeasonalProduce(country);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{country} seasonal produce</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Nordic seasonal-produce calendar</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Educational guide to produce that is in season and often locally cheaper. No live prices are estimated here.</p>

      <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-2xl font-black text-emerald-950">In season for {monthNames[month - 1]}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(current.length ? current : all.slice(0, 3)).map((item) => (
            <article className="rounded-2xl bg-white p-4 shadow-sm" key={`${item.country}-${item.name}`}>
              <p className="text-xl font-black text-slate-950">{item.name}</p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-emerald-800">{item.cheapSignal.replaceAll('_', ' ')}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3" aria-label="Full seasonal calendar">
        {all.map((item) => (
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={`${item.country}-${item.name}-all`}>
            <h2 className="text-xl font-black text-slate-950">{item.name}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Months: {item.months.map((value) => monthNames[value - 1]).join(', ')}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{item.note}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
