import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import {
  categoryQualityMatrix,
  formatPct,
  snapshot,
  sourceCoverage,
  sourceReadinessMatrix,
  sourceRouteMap,
  storeBrandLedger
} from '@/lib/verified-data';

export const dynamic = 'force-static';

export default function DataSourcesPage() {
  return (
    <PageShell>
      <Eyebrow>Data sources</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Verified snapshot provenance</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page exposes the current generated source coverage behind GroceryView. Counts, caveats, freshness labels, store brand coverage, and category quality signals are rendered from the same verified data module as the product, store, and comparison routes.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Snapshot window" value={snapshot.retrievedLabel} />
        <Metric label="Source groups" value={sourceCoverage.length.toLocaleString('sv-SE')} />
        <Metric label="Brand ledgers" value={storeBrandLedger.length.toLocaleString('sv-SE')} />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Coverage ledger</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Every visible source names its upstream endpoint family, current row count, freshness signal, and caveat.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/products">
            Browse rendered products
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {sourceCoverage.map((source) => (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
              <p className="text-sm font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-4xl font-black text-emerald-800">{source.rows.toLocaleString('sv-SE')}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{source.coverage}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Source: {source.source}.</p>
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                Freshness: {source.freshness}. {source.caveat}
              </p>
            </section>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Source readiness matrix</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Row share, freshness, caveat, and the primary public route are shown together for each verified source group.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/">
            Back to homepage
          </Link>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {sourceReadinessMatrix.map((source) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
              href={source.primaryRoute}
              key={source.name}
            >
              <div>
                <p className="font-black text-slate-950">{source.name}</p>
                <p className="text-sm text-slate-600">{source.coverage}</p>
              </div>
              <p className="font-black text-emerald-800">{formatPct(source.rowShare * 100)} of rows</p>
              <p className="text-sm font-semibold text-slate-700">
                {source.rows.toLocaleString('sv-SE')} rows · {source.freshness}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Source route map</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each source group lists the public routes that render its verified rows, keeping provenance tied to the browsing surface.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/compare">
            Open comparisons
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {sourceRouteMap.map((source) => (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
              <p className="font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {source.routeCount.toLocaleString('sv-SE')} public routes · {source.freshness}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {source.supportingRoutes.map((route) => (
                  <Link
                    className="rounded-full bg-white px-3 py-1 text-sm font-black text-emerald-900 ring-1 ring-emerald-100"
                    href={route}
                    key={`${source.name}-${route}`}
                  >
                    {route}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-tight">Store brand coverage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            OpenStreetMap rows are grouped by brand so location coverage can be inspected without implying branch-level prices.
          </p>
          <div className="mt-5 divide-y divide-slate-200">
            {storeBrandLedger.map((brand) => (
              <Link
                className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
                href={`/stores/${brand.sampleSlug}`}
                key={brand.brand}
              >
                <div>
                  <p className="font-black text-slate-950">{brand.brand}</p>
                  <p className="text-sm text-slate-600">
                    {brand.districts.toLocaleString('sv-SE')} districts · {brand.formats.join(', ') || 'format not reported'}
                  </p>
                </div>
                <p className="font-black text-emerald-800">{brand.stores.toLocaleString('sv-SE')} stores</p>
                <p className="text-sm font-semibold text-slate-700">{formatPct(brand.addressCoverage * 100)} addressed</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-tight">Category quality signals</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Categories are ranked by verified row depth, observed products, and same-code Willys/Hemkop matches.
          </p>
          <div className="mt-5 divide-y divide-slate-200">
            {categoryQualityMatrix.map((category) => (
              <Link
                className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
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
                <p className="text-sm font-semibold text-slate-700">{category.chainMatches.toLocaleString('sv-SE')} matches</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card className="p-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-800">{value}</p>
    </Card>
  );
}
