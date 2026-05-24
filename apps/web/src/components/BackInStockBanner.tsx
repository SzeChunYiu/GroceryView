import type { BackInStockNotice } from '@groceryview/db';

type BackInStockBannerProps = Readonly<{
  notice: BackInStockNotice | null;
}>;

export function BackInStockBanner({ notice }: BackInStockBannerProps) {
  if (!notice) return null;

  return (
    <aside className="mx-auto mt-4 max-w-6xl rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-950 shadow-sm" role="status">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Availability update</p>
      <p className="mt-1 text-xl font-black">Back in stock at {notice.store}</p>
      <p className="mt-1 text-sm font-semibold text-emerald-900">
        This item was recently marked out of stock and is now available again. Latest availability: {notice.observedAt.slice(0, 10)}.
      </p>
    </aside>
  );
}
