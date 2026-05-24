import { buildBasketBenchmark } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const benchmark = buildBasketBenchmark({
  city: 'Stockholm',
  householdSize: 3,
  minSampleSize: 40,
  spend: [
    { category: 'dairy', monthlySpend: 896 },
    { category: 'produce', monthlySpend: 760 },
    { category: 'pantry staples', monthlySpend: 540 },
    { category: 'baby care', monthlySpend: 410 }
  ],
  medians: [
    { city: 'Stockholm', householdSize: 3, category: 'dairy', medianMonthlySpend: 800, sampleSize: 248 },
    { city: 'Stockholm', householdSize: 3, category: 'produce', medianMonthlySpend: 830, sampleSize: 248 },
    { city: 'Stockholm', householdSize: 3, category: 'pantry staples', medianMonthlySpend: 540, sampleSize: 248 },
    { city: 'Stockholm', householdSize: 3, category: 'baby care', medianMonthlySpend: 380, sampleSize: 18 }
  ]
});

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 0, style: 'currency' }).format(value);
}

export default async function BasketBenchmarkPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} account benchmark</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Basket benchmark</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Anonymous comparison of your monthly category spend against city medians for households with the same size. Individual households are never shown.
      </p>

      <Card className="mt-8 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Stockholm households of size 3</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Your spend vs city median</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{benchmark.privacyCopy}</p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm">Aggregated benchmark only</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {benchmark.comparisons.map((comparison) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={comparison.category}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{comparison.category}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{Math.round(Math.abs(comparison.deltaPercent))}% {comparison.direction === 'at_median' ? 'at median' : comparison.direction}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{comparison.summary}</p>
              <p className="mt-3 text-xs font-bold text-slate-500">You: {formatSek(comparison.monthlySpend)} · median: {formatSek(comparison.medianMonthlySpend)} · n={comparison.sampleSize}</p>
            </div>
          ))}
        </div>
        {benchmark.withheld.length > 0 ? (
          <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold text-amber-950 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Withheld for privacy</p>
            {benchmark.withheld.map((row) => <p className="mt-2" key={row.category}>{row.category}: {row.reason}</p>)}
          </div>
        ) : null}
      </Card>
    </PageShell>
  );
}
