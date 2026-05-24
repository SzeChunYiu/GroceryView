import { Card } from '@/components/data-ui';

export type ProductPriceTableRow = {
  chain: string;
  priceLabel: string;
  priceUnit?: string | null;
  savingsLabel?: string | null;
};

export type ProductPriceTableProps = {
  rows: ProductPriceTableRow[];
};

export function ProductPriceTable({ rows }: ProductPriceTableProps) {
  if (rows.length === 0) return null;

  return (
    <Card className="mt-6">
      <h2 className="text-2xl font-black">Chain price rows</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <div className="rounded-2xl border border-slate-200 p-4" key={row.chain}>
            <p className="text-lg font-black capitalize">{row.chain}</p>
            <p className="mt-1 text-3xl font-black text-emerald-800">{row.priceLabel}</p>
            <p className="text-sm text-slate-600">{row.priceUnit || 'Unit not reported'}{row.savingsLabel ? ` · listed saving ${row.savingsLabel}` : ''}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
