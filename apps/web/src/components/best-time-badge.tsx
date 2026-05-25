import type { BestTimeToBuyPrediction } from '@groceryview/core/src/lib/bestTimeToBuy';

const toneByStatus: Record<BestTimeToBuyPrediction['status'], string> = {
  likely_next_week: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  currently_discounted: 'border-lime-200 bg-lime-50 text-lime-950',
  watch_next_window: 'border-amber-200 bg-amber-50 text-amber-950',
  keep_watching: 'border-slate-200 bg-slate-50 text-slate-950',
  insufficient_history: 'border-slate-200 bg-white text-slate-700'
};

const confidenceTone: Record<BestTimeToBuyPrediction['confidence'], string> = {
  high: 'bg-emerald-900 text-white',
  medium: 'bg-amber-800 text-white',
  low: 'bg-slate-700 text-white'
};

export function BestTimeBadge({ prediction }: Readonly<{ prediction: BestTimeToBuyPrediction }>) {
  return (
    <aside className={`mt-6 rounded-[1.75rem] border p-5 shadow-sm ${toneByStatus[prediction.status]}`} data-best-time-to-buy-badge>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-75">Best-time-to-buy prediction</p>
          <h2 className="mt-2 text-2xl font-black">{prediction.headline}</h2>
          <p className="mt-2 text-sm font-semibold leading-6">{prediction.windowLabel}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${confidenceTone[prediction.confidence]}`}>
          {prediction.confidence} confidence · {Math.round(prediction.confidenceScore * 100)}%
        </span>
      </div>
      <p className="mt-4 rounded-2xl bg-white/70 p-3 text-sm font-bold leading-6">{prediction.evidenceLabel}</p>
      <p className="mt-3 text-xs font-semibold leading-5 opacity-80">{prediction.detail}</p>
    </aside>
  );
}
