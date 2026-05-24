import { buildDealHistoryContext, formatDealStreak, type DealPricePoint } from '@/lib/deal-context';

export type DealCardDeal = {
  id: string;
  name: string;
  chain: string;
  currentPrice: number;
  originalPrice: number;
  history: DealPricePoint[];
};

type DealCardProps = {
  deal: DealCardDeal;
};

const sekFormatter = new Intl.NumberFormat('sv-SE', {
  currency: 'SEK',
  maximumFractionDigits: 2,
  style: 'currency'
});

export function DealCard({ deal }: DealCardProps) {
  const context = buildDealHistoryContext(deal.history, deal.currentPrice);
  const savings = Math.max(0, deal.originalPrice - deal.currentPrice);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">{deal.chain}</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{deal.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-emerald-800">{sekFormatter.format(deal.currentPrice)}</p>
          <p className="text-sm text-slate-500">Save {sekFormatter.format(savings)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
          {formatDealStreak(context.discountStreakDays)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
          Previous low:{' '}
          {context.previousLowestPrice === null ? 'not tracked' : sekFormatter.format(context.previousLowestPrice)}
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
          {context.urgency === 'new-low' ? 'Best seen price' : context.urgency === 'steady-deal' ? 'Steady deal' : 'Compare before buying'}
        </span>
      </div>
    </article>
  );
}
