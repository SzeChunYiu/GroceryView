import { Card, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type BenchmarkRow = {
  category: string;
  yourSpend: number;
  cityMedianSpend: number;
};

const city = 'Stockholm';
const householdSize = 3;
const rows: BenchmarkRow[] = [
  { category: 'dairy', yourSpend: 313, cityMedianSpend: 279 },
  { category: 'produce', yourSpend: 401, cityMedianSpend: 438 },
  { category: 'pantry', yourSpend: 522, cityMedianSpend: 515 }
];

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
}

function benchmark(row: BenchmarkRow) {
  const deltaPercent = row.cityMedianSpend > 0 ? ((row.yourSpend - row.cityMedianSpend) / row.cityMedianSpend) * 100 : 0;
  const direction = deltaPercent > 1 ? 'above' : deltaPercent < -1 ? 'below' : 'at';
  const label = direction === 'at'
    ? `Your ${row.category} spend matches the ${city} median for households of size ${householdSize}.`
    : `Your ${row.category} spend is ${Math.abs(deltaPercent).toFixed(0)}% ${direction} median for ${city} households of size ${householdSize}.`;
  return { ...row, deltaPercent, direction, label };
}

export function generateMetadata() {
  return routeMetadata('/account');
}

export default function BasketBenchmarkPage() {
  const benchmarkRows = rows.map(benchmark);
  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Anonymous basket benchmark</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Your spend vs city median</h1>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        Aggregated household-size comparisons only; no individual basket or receipt is exposed.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {benchmarkRows.map((row) => (
          <Card className="border-emerald-100" key={row.category}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{row.category}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{row.label}</h2>
            <p className="mt-3 text-sm font-semibold text-slate-600">You: {formatSek(row.yourSpend)} · city median: {formatSek(row.cityMedianSpend)}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
