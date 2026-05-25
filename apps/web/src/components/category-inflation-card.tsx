import { Card } from '@/components/data-ui';
import type { CategoryInflationTrend } from '@/lib/trends';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function CategoryInflationCard({ trend }: { trend: CategoryInflationTrend }) {
  return (
    <Card className={trend.fasterThanBasket ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-white'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">#{trend.rank} category trend</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{trend.categoryLabel}</h3>
        </div>
        <p className={trend.fasterThanBasket ? 'rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950' : 'rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-950'}>
          {formatPercent(trend.changePercent)}
        </p>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700">{trend.callout}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{trend.previousMonth}</p>
          <p className="mt-1 text-lg font-black text-slate-950">{formatSek(trend.previousAveragePrice)}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{trend.latestMonth}</p>
          <p className="mt-1 text-lg font-black text-slate-950">{formatSek(trend.latestAveragePrice)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-600">Basket average {formatPercent(trend.basketAverageChangePercent)} · {trend.productCount} products · {trend.observationCount} observations</p>
    </Card>
  );
}
