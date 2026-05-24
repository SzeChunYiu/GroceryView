const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK'
});

const kilogramFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'unit',
  unit: 'kilogram',
  unitDisplay: 'short'
});

export type ProductRowProps = {
  name: string;
  price: number;
  unitPrice: number;
};

export function formatUnitPriceCopy(unitPrice: number) {
  return `${currencyFormatter.format(unitPrice)} / ${kilogramFormatter.format(1)}`;
}

export function ProductRow({ name, price, unitPrice }: ProductRowProps) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <h3 className="text-base font-black text-slate-950">{name}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-700">{currencyFormatter.format(price)}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
        {formatUnitPriceCopy(unitPrice)}
      </p>
    </article>
  );
}
