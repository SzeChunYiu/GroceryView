import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatSek, formatPct, productUniverse, topChainSpreads, freshestOpenPrices } from '@/lib/verified-data';

export default function ProductsPage() {
  return (
    <PageShell>
      <Eyebrow>Products</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Verified product catalogue</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Products are shown only when present in the Axfood chain snapshot or OpenPrices SEK observations. No synthetic prices or filler products are rendered.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {productUniverse.map((product) => {
          const isChain = 'lowestPrice' in product;
          return (
            <Link className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">{isChain ? 'Willys/Hemköp match' : 'OpenPrices observation'}</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{product.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{isChain ? product.brand : product.brands || 'Brand not reported'}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm font-black">
                <span>{isChain ? formatSek(product.lowestPrice) : formatSek(product.priceMedian)}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-900">{isChain ? formatPct(product.spreadPct) : `${product.observationCount} obs.`}</span>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-2xl font-black">Chain matches rendered</h2><p className="mt-2 text-slate-600">{topChainSpreads.length} high-spread matched rows are highlighted from the generated Axfood module.</p></Card>
        <Card><h2 className="text-2xl font-black">Fresh OpenPrices rows</h2><p className="mt-2 text-slate-600">{freshestOpenPrices.length} recent community SEK observations are included with their observation dates.</p></Card>
      </div>
    </PageShell>
  );
}
