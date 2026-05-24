import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';
import type { WatchlistAlert } from '@/lib/watchlist-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

type WatchlistRowProps = {
  alert: WatchlistAlert;
  sourceConfidence: 'high' | 'medium' | 'low';
  sourceSampleSize: number;
  sourceLabel: string;
  targetPrice?: number;
};

export function WatchlistRow({ alert, sourceConfidence, sourceSampleSize, sourceLabel, targetPrice }: WatchlistRowProps) {
  return (
    <Link
      aria-label={`Open ${alert.productName} watchlist alert`}
      className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700"
      href={`/products/${alert.productId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xl font-black text-slate-950">{alert.productName}</p>
          <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConfidenceBadge level={sourceConfidence} label={`${sourceConfidence} source confidence`} sampleSize={sourceSampleSize} />
            <span className="text-sm font-semibold text-slate-700">{sourceLabel}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${alert.severity === 'urgent' ? 'text-rose-700' : 'text-emerald-800'}`}>{alert.severity}</p>
          <p className="text-sm font-semibold capitalize text-slate-600">{alert.type.replaceAll('_', ' ')}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-4">
        <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Metric: {alert.trigger.metric}</p>
        <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Store: {alert.trigger.storeName}</p>
        <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Value: {String(alert.trigger.value)}</p>
        <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Target: {targetPrice ? formatSek(targetPrice) : 'No target'}</p>
      </div>
    </Link>
  );
}
