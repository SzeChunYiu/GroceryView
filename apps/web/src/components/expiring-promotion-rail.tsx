import Link from 'next/link';
import type { ExpiringPromotionRailItem } from '@/lib/deal-context';

export function ExpiringPromotionRail({
  items,
  snapshotLabel
}: Readonly<{
  items: ExpiringPromotionRailItem[];
  snapshotLabel: string;
}>) {
  if (items.length === 0) return null;

  return (
    <section className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">Expiring basket promotions</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Use these weekly basket deals before they disappear</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-950">
            Only promotions that overlap the saved weekly basket and expire inside the visible deal window are shown. Expired rows and non-basket deals stay out of this rail.
          </p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-xs font-black text-amber-900 shadow-sm">{snapshotLabel}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <Link className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:border-amber-400 hover:bg-amber-50" href={`/products/${item.productId}`} key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{item.storeName}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{item.productName}</h3>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-900">{item.urgencyLabel}</span>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-800">{item.currentPriceLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              was {item.originalPriceLabel} · {item.markdownPercent}% markdown
            </p>
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-700">{item.evidenceLabel}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
