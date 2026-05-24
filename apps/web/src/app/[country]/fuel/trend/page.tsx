import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatFuelPrice, verifiedFuelPriceObservations, verifiedFuelPriceSource } from '@/lib/fuel-prices';

const weekday = new Intl.DateTimeFormat('en-SE', { weekday: 'long', timeZone: 'UTC' });

function dayRows(country: string) {
  const rows = country.toUpperCase() === 'SE' ? verifiedFuelPriceObservations : [];
  const byDay = new Map<string, { count: number; total: number; lastObservedAt: string }>();
  for (const row of rows) {
    const day = weekday.format(new Date(row.observedAt));
    const current = byDay.get(day) ?? { count: 0, total: 0, lastObservedAt: '' };
    current.count += 1;
    current.total += row.pricePerLitre;
    if (row.observedAt > current.lastObservedAt) current.lastObservedAt = row.observedAt;
    byDay.set(day, current);
  }
  return [...byDay.entries()]
    .map(([day, value]) => ({ day, count: value.count, average: value.total / value.count, lastObservedAt: value.lastObservedAt }))
    .sort((left, right) => left.average - right.average);
}

export default async function FuelTrendPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const rows = dayRows(country);
  const tuesday = rows.find((row) => row.day === 'Tuesday');
  const cheapest = rows[0];
  const verdict = tuesday
    ? cheapest?.day === 'Tuesday'
      ? 'Tuesday is the cheapest day in the current verified sample.'
      : `Tuesday is not cheapest in the current verified sample; ${cheapest?.day ?? 'another day'} is lower.`
    : 'No Tuesday-morning observation exists in the checked-in operator data, so the folk-wisdom claim is not proven.';

  return (
    <PageShell>
      <Eyebrow>Fuel weekly trend</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Does Tuesday morning look cheaper?</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Real operator fuel observations only. The current checked-in source is {verifiedFuelPriceSource.name}; missing weekdays are withheld instead of inferred.
      </p>

      <Card className="mt-6 border-amber-200 bg-amber-50/70">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Verdict</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{verdict}</h2>
        <p className="mt-2 text-sm font-semibold text-slate-700">Country route: {country.toUpperCase()} · source captured {verifiedFuelPriceSource.capturedAt}</p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Observed weekday averages</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.length > 0 ? rows.map((row) => (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.day}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{row.day}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatFuelPrice(row.average)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{row.count} observed grade row(s) · last {row.lastObservedAt}</p>
            </section>
          )) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">No verified fuel rows for {country.toUpperCase()}.</p>
          )}
        </div>
      </Card>

      <Link className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white" href="/fuel">Back to fuel data</Link>
    </PageShell>
  );
}
