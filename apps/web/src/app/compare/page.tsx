import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { budgetLowestPriceRadar, chainPriceRows, chainSavingsLedger, formatPct, formatSek, matchedChainProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/compare');
}

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
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Budget-conscious / cross-chain</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Lowest price anywhere radar</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Highlights the cheapestChain for each exact matched product code and shows the priceGap to the priciest matched chain.
              No branch-level discounts are inferred; every row links to the verifiedProductSlug evidence.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm">{budgetLowestPriceRadar.length} matched products</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {budgetLowestPriceRadar.map((item) => (
            <Link className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700" href={`/products/${item.verifiedProductSlug}`} key={item.verifiedProductSlug}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{item.cheapestChain}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{item.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.reportedBrand}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-xl bg-emerald-50 p-3 font-black text-emerald-950">Cheapest {formatSek(item.cheapestPrice)}</p>
                <p className="rounded-xl bg-rose-50 p-3 font-black text-rose-950">Gap {formatSek(item.priceGap)}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">{item.evidenceLabel} · {formatPct(item.spreadPct)}</p>
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
