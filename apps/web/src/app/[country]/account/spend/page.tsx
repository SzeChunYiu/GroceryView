import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatPct, formatSek } from '@/lib/verified-data';

type SpendPageParams = {
  country: string;
};

const purchase_history = [
  { month: '2025-05', category: 'Dairy', amount: 820 },
  { month: '2025-05', category: 'Produce', amount: 640 },
  { month: '2025-05', category: 'Pantry', amount: 710 },
  { month: '2026-04', category: 'Dairy', amount: 910 },
  { month: '2026-04', category: 'Produce', amount: 760 },
  { month: '2026-04', category: 'Pantry', amount: 840 },
  { month: '2026-05', category: 'Dairy', amount: 870 },
  { month: '2026-05', category: 'Produce', amount: 810 },
  { month: '2026-05', category: 'Pantry', amount: 790 }
];

function monthlyTotals() {
  const totals = new Map<string, number>();
  for (const row of purchase_history) totals.set(row.month, (totals.get(row.month) ?? 0) + row.amount);
  return [...totals.entries()].map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
}

function categoryBreakdown(month: string) {
  return purchase_history.filter((row) => row.month === month).sort((a, b) => b.amount - a.amount);
}

function changePercent(current: number, previous: number | undefined) {
  return previous && previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

export default async function SpendInsightsPage({ params }: { params: Promise<SpendPageParams> }) {
  const { country } = await params;
  const months = monthlyTotals();
  const current = months.at(-1)!;
  const previousMonth = months.at(-2);
  const previousYear = months.find((row) => row.month === current.month.replace('2026', '2025'));
  const maxAmount = Math.max(...months.map((row) => row.amount));
  const breakdown = categoryBreakdown(current.month);

  return (
    <PageShell>
      <Eyebrow>{country.toUpperCase()} account insights</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Spend insights dashboard</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Monthly spend, category mix, and MoM/YoY changes are computed from purchase_history rows so shoppers can spot grocery budget drift.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-slate-600">Current month</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(current.amount)}</p>
          <p className="mt-2 text-sm font-bold text-slate-600">{current.month}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-600">MoM comparison</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatPct(changePercent(current.amount, previousMonth?.amount))}</p>
          <p className="mt-2 text-sm font-bold text-slate-600">vs {previousMonth?.month ?? 'previous month'}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-600">YoY comparison</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatPct(changePercent(current.amount, previousYear?.amount))}</p>
          <p className="mt-2 text-sm font-bold text-slate-600">vs {previousYear?.month ?? 'previous year'}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black tracking-tight">Monthly spend chart</h2>
        <div className="mt-5 grid gap-3">
          {months.map((month) => (
            <div className="grid gap-3 md:grid-cols-[7rem_1fr_6rem] md:items-center" key={month.month}>
              <p className="font-black text-slate-950">{month.month}</p>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-700" style={{ width: `${(month.amount / maxAmount) * 100}%` }} />
              </div>
              <p className="font-black text-emerald-800">{formatSek(month.amount)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black tracking-tight">Category breakdown</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {breakdown.map((row) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.category}>
              <p className="text-sm font-black text-slate-950">{row.category}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(row.amount)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{formatPct((row.amount / current.amount) * 100)} of current month</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
