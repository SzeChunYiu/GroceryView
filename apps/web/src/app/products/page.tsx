import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatSek, formatPct, immigrantFamiliarBrandSearch, productUniverse, topChainSpreads, freshestOpenPrices } from '@/lib/verified-data';

export default function ProductsPage() {
  return (
    <PageShell>
      <Eyebrow>Products</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Verified product catalogue</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Products are shown only when present in the Axfood chain snapshot or OpenPrices SEK observations. No synthetic prices or filler products are rendered.</p>
      <Card className="mt-8 border-sky-200 bg-sky-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Immigrant / familiar products</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Familiar-brand search</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Find reported brands exactly as they appear in verified product rows, then jump to the product page.
              Search tokens combine reportedBrand, product name, and category so non-native speakers can match familiar packaging without invented translations.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900 shadow-sm">{immigrantFamiliarBrandSearch.length} verified brand entries</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {immigrantFamiliarBrandSearch.map((brand) => (
            <Link className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-700" href={`/products/${brand.verifiedProductSlug}`} key={`${brand.reportedBrand}-${brand.verifiedProductSlug}`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{brand.reportedBrand}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{brand.productName}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{brand.categoryLabel}</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">searchTokens: {brand.searchTokens}</p>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs font-black text-slate-700">
                <span>{formatSek(brand.verifiedPrice)}</span>
                <span>{brand.evidenceLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
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
