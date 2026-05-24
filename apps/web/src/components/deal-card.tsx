const discountPercentFormatter = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 });

export interface DealCardProps {
  title: string;
  storeName: string;
  priceText: string;
  href: string;
  discountPercent?: number;
  savingsText?: string;
}

export function formatDealDiscountText(discountPercent: number) {
  return `${discountPercentFormatter.format(discountPercent)}% off`;
}

export function DealCard({ title, storeName, priceText, href, discountPercent, savingsText }: DealCardProps) {
  const discountText = discountPercent === undefined ? savingsText : formatDealDiscountText(discountPercent);

  return (
    <a className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={href}>
      <p className="text-sm font-semibold text-slate-600">{storeName}</p>
      <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-2xl font-black text-emerald-800">{priceText}</p>
      {discountText ? <p className="mt-1 text-sm font-semibold text-slate-600">{discountText}</p> : null}
    </a>
  );
}
