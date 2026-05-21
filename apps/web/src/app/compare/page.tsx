import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { chainPriceRows, formatPct, formatSek, matchedChainProducts } from '@/lib/verified-data';

export default function ComparePage() {
  return (
    <PageShell>
      <Eyebrow>Willys vs Hemköp</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Comparable chain prices</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Rows appear only when the same Axfood product code is present in both chain catalogues. Savings are not shown across unmatched products.</p>
      <div className="mt-6 space-y-4">
        {matchedChainProducts.slice(0, 40).map((product) => (
          <Card key={product.slug}>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
              <div>
                <Link className="text-xl font-black text-slate-950 hover:text-emerald-800" href={`/products/${product.slug}`}>{product.name}</Link>
                <p className="text-sm text-slate-600">{product.brand} · {product.subline}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {chainPriceRows(product).map((row) => <p className="rounded-2xl bg-slate-50 p-3 font-black capitalize" key={row.chain}>{row.chain}: {formatSek(row.price)}</p>)}
              </div>
              <p className="rounded-full bg-emerald-100 px-4 py-2 text-center font-black text-emerald-950">{formatPct(product.spreadPct)}</p>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
