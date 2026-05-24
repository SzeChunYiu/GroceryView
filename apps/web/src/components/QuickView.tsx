import { memo } from 'react';

export type QuickViewStoreRow = {
  id: string;
  label: string;
  priceLabel: string;
  inStock?: boolean | null;
};

type QuickViewSparklinePoint = {
  date: string;
  price: number;
  priceLabel: string;
};

export type QuickViewData = {
  title: string;
  points: readonly QuickViewSparklinePoint[];
  sparklineLabel: string;
  stores: readonly QuickViewStoreRow[];
};

function sparklinePath(points: QuickViewData['points'], width = 236, height = 60) {
  if (points.length < 2) return null;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export const QuickView = memo(function QuickView({ title, points, sparklineLabel, stores }: QuickViewData) {
  const path = sparklinePath(points);
  const latest = points.at(-1);

  return (
    <div className="w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-slate-900/5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Quick view</p>
      <h4 className="mt-1 text-sm font-black text-slate-950">{title}</h4>
      <p className="mt-2 rounded-xl bg-slate-50 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-700">Price history · {sparklineLabel}</p>
      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
        {path ? (
          <svg
            aria-hidden="true"
            className="h-[72px] w-full"
            role="img"
            viewBox="0 0 236 72"
            preserveAspectRatio="none"
          >
            <title>{`${title} price history sparkline`}</title>
            <path d="M 0 72 L 236 72" fill="none" stroke="#e2e8f0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d={path} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        ) : (
          <p className="rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-600">Price history waiting for at least 2 data points.</p>
        )}
        <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">{latest ? `Latest: ${latest.priceLabel} (${latest.date})` : 'No verified price point yet'}</p>
      </div>
      <div className="mt-2">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">Store list</p>
        <ul className="mt-1 space-y-1">
          {stores.length > 0 ? stores.map((store) => (
            <li className="rounded-lg bg-slate-50 px-2 py-1 text-xs" key={store.id}>
              <p className="font-black text-slate-800">{store.label}</p>
              <p className="text-slate-600">{store.priceLabel}{typeof store.inStock === 'boolean' ? ` · ${store.inStock ? 'In stock' : 'Out of stock'}` : ''}</p>
            </li>
          )) : (
            <li className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600">No verified store rows available yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
});
