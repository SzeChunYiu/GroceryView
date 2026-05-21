import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import {
  formatSek,
  freshestOpenPrices,
  openPriceObservationDepth,
  snapshot,
  sourceCoverage
} from '@/lib/verified-data';

export const dynamic = 'force-static';

const oneDecimal = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
const openPricesSource = sourceCoverage.find((source) => source.name === 'OpenPrices SEK observations');
const totalProducts = openPriceObservationDepth.reduce((sum, category) => sum + category.products, 0);
const totalObservations = openPriceObservationDepth.reduce((sum, category) => sum + category.observationTotal, 0);
const deepestCategory = openPriceObservationDepth[0];
const latestObservation = freshestOpenPrices[0]?.lastObservedAt ?? 'Not reported';
const deepestObservationTotal = Math.max(...openPriceObservationDepth.map((category) => category.observationTotal), 1);

export default function OpenPricesDepthPage() {
  return (
    <PageShell>
      <Eyebrow>OpenPrices depth</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Community SEK observation depth</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This route turns the generated OpenPrices SEK rows into a category depth board. It shows observation counts, category freshness, and top observed products from the verified snapshot without estimating chain prices or branch-level availability.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="OpenPrices rows" value={openPricesSource?.rows.toLocaleString('sv-SE') ?? 'Not reported'} />
        <Metric label="Depth products" value={totalProducts.toLocaleString('sv-SE')} />
        <Metric label="Depth observations" value={totalObservations.toLocaleString('sv-SE')} />
        <Metric label="Latest observation" value={latestObservation} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Category depth ledger</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Categories are ranked by the total community observation count behind their verified OpenPrices products.
              </p>
            </div>
            <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/categories">
              Browse categories
            </Link>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {openPriceObservationDepth.map((category) => (
              <Link
                className="grid gap-4 py-5 transition hover:bg-emerald-50/70 lg:grid-cols-[1fr_11rem_10rem]"
                href={`/categories/${category.slug}`}
                key={category.slug}
              >
                <div>
                  <p className="font-black text-slate-950">{category.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {category.products.toLocaleString('sv-SE')} products, latest observation {category.latestObservation || 'not reported'}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-700"
                      style={{ width: `${Math.max(8, (category.observationTotal / deepestObservationTotal) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Observations</p>
                  <p className="mt-2 text-2xl font-black text-emerald-800">{category.observationTotal.toLocaleString('sv-SE')}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {oneDecimal.format(category.averageObservations)} avg/product
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Top product</p>
                  <p className="mt-2 text-sm font-black text-slate-950">{category.topProductName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {category.topProductObservations.toLocaleString('sv-SE')} observations
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h2 className="text-2xl font-black tracking-tight">Depth leader</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The strongest OpenPrices signal in this snapshot is the category with the highest observation total, not an inferred basket or store-specific claim.
            </p>
            {deepestCategory ? (
              <Link className="mt-5 block rounded-2xl border border-emerald-100 bg-emerald-50 p-4" href={`/categories/${deepestCategory.slug}`}>
                <p className="text-sm font-black text-emerald-950">{deepestCategory.label}</p>
                <p className="mt-2 text-4xl font-black text-emerald-800">{deepestCategory.observationTotal.toLocaleString('sv-SE')}</p>
                <p className="mt-2 text-sm font-semibold text-emerald-950">
                  {deepestCategory.products.toLocaleString('sv-SE')} products, led by {deepestCategory.topProductName}
                </p>
              </Link>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-2xl font-black tracking-tight">Fresh observed products</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Recent OpenPrices rows retain their median SEK price, observation count, and latest observed date.
            </p>
            <div className="mt-5 divide-y divide-slate-200">
              {freshestOpenPrices.slice(0, 6).map((product) => (
                <Link
                  className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto]"
                  href={`/products/${product.slug}`}
                  key={product.slug}
                >
                  <div>
                    <p className="font-black text-slate-950">{product.name}</p>
                    <p className="text-sm text-slate-600">
                      {product.brands || 'Brand not reported'} - {product.lastObservedAt}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-black text-emerald-800">{formatSek(product.priceMedian)}</p>
                    <p className="text-sm font-semibold text-slate-600">{product.observationCount.toLocaleString('sv-SE')} observations</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Claim boundary</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-950">
          OpenPrices rows are community observations from {snapshot.openPricesSource}. This page can support category depth, product freshness, and observed SEK price ranges, but it does not claim live availability, store-specific prices, or household basket recommendations.
        </p>
      </Card>

      <div className="mt-6">
        <SourceCoverage />
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
