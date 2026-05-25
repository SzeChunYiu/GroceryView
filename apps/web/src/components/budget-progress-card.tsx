import type { MonthlyBudgetCategoryProgress } from '@/lib/meal-budgets';

type BudgetProgressCardProps = {
  row: MonthlyBudgetCategoryProgress;
};

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0, style: 'percent' }).format(value);
}

function statusClass(status: MonthlyBudgetCategoryProgress['status']) {
  if (status === 'over') return 'bg-rose-100 text-rose-900';
  if (status === 'watch') return 'bg-amber-100 text-amber-950';
  return 'bg-emerald-100 text-emerald-950';
}

export function BudgetProgressCard({ row }: Readonly<BudgetProgressCardProps>) {
  const progressWidth = `${Math.min(100, Math.max(0, row.percentUsed * 100))}%`;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{row.category}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{row.basis} spend</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(row.status)}`}>{row.status}</span>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{formatPercent(row.percentUsed)}</p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-700" style={{ width: progressWidth }} />
      </div>
      <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
        <p>Used: {formatSek(row.comparedSpend)}</p>
        <p>Monthly limit: {formatSek(row.monthlyLimit)}</p>
        <p>Remaining: {formatSek(row.remaining)}</p>
      </div>
    </section>
  );
}
