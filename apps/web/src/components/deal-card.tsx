import Link from 'next/link';

export type DealCardProps = {
  currentPrice: number;
  discountPercent?: number;
  href?: string;
  originalPrice?: number;
  title: string;
};

export function formatDiscountPercent(value: number, locale = 'sv-SE') {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(value);
}

export function DealCard({ currentPrice, discountPercent, href, originalPrice, title }: DealCardProps) {
  const computedDiscount = discountPercent ?? (originalPrice ? ((originalPrice - currentPrice) / originalPrice) * 100 : 0);
  const content = (
    <article className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Deal</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{title}</h3>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-black text-emerald-800">{currentPrice.toFixed(2)} SEK</p>
        {computedDiscount > 0 ? <p className="rounded-full bg-rose-100 px-3 py-1 text-sm font-black text-rose-900">-{formatDiscountPercent(computedDiscount)}%</p> : null}
      </div>
      {originalPrice ? <p className="mt-2 text-sm font-semibold text-slate-500">Was {originalPrice.toFixed(2)} SEK</p> : null}
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
