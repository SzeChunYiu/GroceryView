import Link from 'next/link';
import { type WeeklyDeal } from '@/lib/demo-data';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK'
  }).format(value).replace(/\s/g, ' ');

const formatDiscount = (value: number) => `${Math.round(value)}%`;

type DealsCarouselProps = Readonly<{
  deals: readonly WeeklyDeal[];
}>;

export function DealsCarousel({ deals }: DealsCarouselProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-3 border-b border-slate-200 px-4 py-3 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-lg font-black">What&apos;s on sale this week</h2>
          <p className="mt-1 text-sm text-slate-600">
            Current weekly top discounts ranked by discount depth and refreshed from the weekly deals feed.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-500">{deals.length} active deals</p>
      </div>
      <div className="overflow-x-auto px-4 py-4">
        <div className="flex gap-4 pb-2">
          {deals.map((deal) => (
            <article
              key={deal.id}
              className="min-w-[15rem] rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
            >
              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                {formatDiscount(deal.discountPercent)} off
              </span>
              <h3 className="mt-3 line-clamp-2 text-base font-black">{deal.productName}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {deal.store} · {deal.category}
              </p>
              <div className="mt-3 grid gap-1 text-sm">
                <span className="font-black text-xl">{formatCurrency(deal.currentPrice)}</span>
                <span className="text-xs text-slate-500">Regular {formatCurrency(deal.regularPrice)}</span>
                <span className="text-xs font-semibold text-slate-700">
                  Save {formatCurrency(deal.discountAmount)} before {new Date(deal.expiresAt).toLocaleDateString('sv-SE')}
                </span>
              </div>
              <Link
                href={`/products/${deal.slug}`}
                className="mt-4 inline-block text-sm font-black text-slate-900 underline-offset-2 hover:underline"
              >
                Open product
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
