import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { chainPriceRows, chainSavingsLedger, formatPct, formatSek, matchedChainProducts } from '@/lib/verified-data';

export default function ComparePage() {
  return (
    <PageShell>
      <Eyebrow>Willys vs Hemköp</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Comparable chain prices</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Rows appear only when the same Axfood product code is present in both chain catalogues. Savings are not shown across unmatched products.</p>
      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Catalogue savings ledger</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Listed savings are aggregated only from matched Willys/Hemkop catalogue rows that expose a numeric saving.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
            Check source caveats
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {chainSavingsLedger.map((chain) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/products/${chain.topProductSlug}`}
              key={chain.chain}
            >
              <p className="text-sm font-black capitalize text-slate-950">{chain.chain}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(chain.totalSavings)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {chain.products.toLocaleString('sv-SE')} rows with listed savings · avg {formatSek(chain.averageSaving)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Top listed saving: {formatSek(chain.topSaving)} on {chain.topProductName}
              </p>
            </Link>
          ))}
        </div>
      </Card>
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
