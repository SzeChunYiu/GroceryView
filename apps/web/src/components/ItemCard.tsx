import { Sparkline } from '../../../../packages/ui/src/Sparkline';
import { last30DaysPriceHistory, priceHistoryTrendLabel, type PriceHistoryPoint } from '@/lib/priceHistory';

export type ItemCardPriceTrendProps = {
  name: string;
  points: readonly PriceHistoryPoint[];
};

export function ItemCardPriceTrend({ name, points }: Readonly<ItemCardPriceTrendProps>) {
  const history = last30DaysPriceHistory(points);
  const latest = history.at(-1);

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">30-day price history</p>
        <p className="text-xs font-bold text-slate-700">{latest?.priceLabel ?? 'No line yet'}</p>
      </div>
      {history.length >= 2 ? (
        <Sparkline
          ariaLabel={`${name} 30-day price history sparkline`}
          className="mt-2 h-11 w-full overflow-visible motion-reduce:transition-none"
          points={history.map((point) => point.price)}
          title={`${name} 30-day price history`}
        />
      ) : (
        <p className="mt-2 rounded-xl bg-slate-50 p-2 text-xs font-semibold text-slate-600">Needs at least two observed price-history points.</p>
      )}
      <p className="mt-2 text-xs font-semibold text-slate-600">{priceHistoryTrendLabel(history)}</p>
    </div>
  );
}
