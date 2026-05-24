import Link from 'next/link';

export type DealCardProps = {
  discountPercent: number;
  href: string;
  priceLabel: string;
  productName: string;
};

export function formatDealDiscountPercent(discountPercent: number, locale = 'sv-SE') {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(discountPercent);
}

export function DealCard({ discountPercent, href, priceLabel, productName }: DealCardProps) {
  return (
    <Link className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm" href={href}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Deal</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{productName}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-600">{priceLabel}</p>
      <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-2xl font-black text-emerald-950">
        {formatDealDiscountPercent(discountPercent)}% cheaper
      </p>
    </Link>
  );
}
