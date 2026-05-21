import Link from 'next/link';
import { Card, Eyebrow, MetricGrid, PageShell, SourceCoverage, TopSpreads } from './data-ui';
import {
  categoryQualityMatrix,
  categorySummaries,
  featuredStores,
  formatPct,
  formatSek,
  freshestOpenPrices,
  snapshot,
  sourceCoverage,
  storeBrandLedger
} from '@/lib/verified-data';

export function MarketShell() {
  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <Eyebrow>Stockholm grocery snapshot</Eyebrow>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
            Readable prices, explicit sources, zero placeholder rows.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            GroceryView now renders only generated data from Axfood chain prices, OpenPrices observations, and OpenStreetMap store locations. Features without verified records fail closed instead of inventing account, coupon, or receipt data.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-emerald-950" href="/compare">Compare chain prices</Link>
            <Link className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white" href="/stores">Browse stores</Link>
          </div>
        </div>
        <Card className="flex flex-col justify-between bg-white">
          <div>
            <Eyebrow>Latest evidence</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tight">{snapshot.retrievedLabel}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">All visible figures trace to source modules generated from public endpoints or ODbL-compatible datasets. Per-branch prices are not inferred where the source does not provide them.</p>
          </div>
          <div className="mt-6 grid gap-3">
            {freshestOpenPrices.slice(0, 3).map((product) => (
              <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-600" href={`/products/${product.slug}`} key={product.slug}>
                <p className="font-black text-slate-950">{product.name}</p>
                <p className="text-sm text-slate-600">{product.brands || 'Brand not reported'} · observed {product.lastObservedAt}</p>
                <p className="mt-1 font-black text-emerald-800">Median {formatSek(product.priceMedian)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <div className="mt-6"><MetricGrid /></div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Freshness board</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Snapshot ages that gate every homepage claim</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
            Review source notes
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {sourceCoverage.map((source) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
              <p className="text-sm font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{source.freshness}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{source.coverage}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{source.caveat}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <TopSpreads limit={8} />
        <Card>
          <Eyebrow>Category coverage</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">What the current data can support</h2>
          <div className="mt-5 space-y-3">
            {categorySummaries.slice(0, 8).map((category) => (
              <Link className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/categories/${category.slug}`} key={category.slug}>
                <div>
                  <p className="font-black text-slate-950">{category.label}</p>
                  <p className="text-sm text-slate-600">{category.openPriceRows} OpenPrices rows · {category.chainRows} Axfood rows</p>
                </div>
                <div className="text-right text-sm font-black text-emerald-800">
                  <p>{formatSek(category.medianPrice)}</p>
                  <p>{formatPct(category.strongestSpread)} max spread</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category freshness strip</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Latest observed category dates from verified rows</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Each category shows its newest OpenPrices observation date beside verified category and chain row counts.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {categorySummaries.slice(0, 8).map((category) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/categories/${category.slug}`}
              key={category.slug}
            >
              <p className="text-sm font-black text-slate-950">{category.label}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{category.latestObservation || 'Not reported'}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {category.openPriceRows.toLocaleString('sv-SE')} OpenPrices rows
              </p>
              <p className="text-sm text-slate-600">{category.chainRows.toLocaleString('sv-SE')} chain rows</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category quality matrix</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Categories ranked by verified row depth</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            OpenPrices observations and Willys/Hemkop chain matches are scored together before a category appears as decision-ready.
          </p>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {categoryQualityMatrix.map((category) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto_auto]"
              href={`/categories/${category.slug}`}
              key={category.slug}
            >
              <div>
                <p className="font-black text-slate-950">{category.label}</p>
                <p className="text-sm text-slate-600">
                  {category.observedProducts.toLocaleString('sv-SE')} observed products · latest {category.latestOpenPrice || 'not reported'}
                </p>
              </div>
              <p className="font-black text-emerald-800">{category.verifiedRows.toLocaleString('sv-SE')} rows</p>
              <p className="font-semibold text-slate-700">{category.chainMatches.toLocaleString('sv-SE')} chain matches</p>
              <p className="text-sm font-semibold text-slate-600">{formatPct(category.spreadSignal)} max spread</p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1fr]">
        <Card>
          <Eyebrow>Store directory</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Stockholm stores from OSM</h2>
          <div className="mt-5 space-y-3">
            {featuredStores.slice(0, 7).map((store) => (
              <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}>
                <p className="font-black text-slate-950">{store.name}</p>
                <p className="text-sm text-slate-600">{store.brand} · {store.address || 'Address not reported by OSM'}</p>
              </Link>
            ))}
          </div>
        </Card>
        <SourceCoverage />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>OSM brand ledger</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Store brands with verified location coverage</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Counts, address coverage, formats, and retrieval dates are derived directly from the OpenStreetMap store extract.
          </p>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {storeBrandLedger.map((brand) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto_auto]"
              href={`/stores/${brand.sampleSlug}`}
              key={brand.brand}
            >
              <div>
                <p className="font-black text-slate-950">{brand.brand}</p>
                <p className="text-sm text-slate-600">
                  {brand.districts} districts · {brand.formats.join(', ') || 'format not reported'}
                </p>
              </div>
              <p className="font-black text-emerald-800">{brand.stores.toLocaleString('sv-SE')} stores</p>
              <p className="font-semibold text-slate-700">{formatPct(brand.addressCoverage * 100)} addressed</p>
              <p className="text-sm font-semibold text-slate-600">OSM {brand.latestRetrieved}</p>
            </Link>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
