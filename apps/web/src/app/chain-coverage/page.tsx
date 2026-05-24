import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import {
  chainCategoryCoverage,
  freshLagClassReport,
  freshLagSummary,
  formatPct,
  formatSek,
  matchedChainProducts,
  sourceCoverage,
  topChainSpreads
} from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/chain-coverage');
}

export const dynamic = 'force-static';

const oneDecimal = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
const chainSource = sourceCoverage.find((source) => source.name === 'Axfood chain price snapshot');
const averageMatchedSpread = matchedChainProducts.length
  ? matchedChainProducts.reduce((sum, product) => sum + product.spreadPct, 0) / matchedChainProducts.length
  : 0;
const willysLowest = matchedChainProducts.filter((product) => product.lowestChain === 'willys').length;
const hemkopLowest = matchedChainProducts.filter((product) => product.lowestChain === 'hemkop').length;
const maxCoverageScore = Math.max(...chainCategoryCoverage.map((category) => category.coverageScore), 1);

export default function ChainCoveragePage() {
  return (
    <PageShell>
      <Eyebrow>Chain coverage</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Willys/Hemkop category coverage</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This route groups matched Axfood products by category so cross-chain coverage is visible before browsing individual products. Every row is backed by the same product code appearing in both Willys and Hemkop catalogues.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Matched products" value={matchedChainProducts.length.toLocaleString('sv-SE')} />
        <Metric label="Chain source rows" value={chainSource?.rows.toLocaleString('sv-SE') ?? 'Not reported'} />
        <Metric label="Average spread" value={formatPct(averageMatchedSpread)} />
        <Metric label="Lowest-price wins" value={`W ${willysLowest} / H ${hemkopLowest}`} />
      </div>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Fresh lag QA</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Per-class observations younger than 7 days</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Fresh meat, fish, produce, and dairy rows expire fast: observations older than {freshLagSummary.staleAfterDays} days are marked stale as of {freshLagSummary.asOf}. This report drives ingest cadence tuning instead of implying stale perishable prices are current.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-right shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Fresh share</p>
            <p className="mt-1 text-4xl font-black text-sky-900">{formatPct(freshLagSummary.freshPercent)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{freshLagSummary.freshObservations}/{freshLagSummary.totalObservations} observations</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {freshLagClassReport.map((row) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={row.slug}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-950">{row.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{row.productCount} products · latest {row.latestObservation || 'none'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${row.status === 'healthy' ? 'bg-emerald-100 text-emerald-900' : row.status === 'watch' ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-900'}`}>
                  {row.status}
                </span>
              </div>
              <p className="mt-4 text-3xl font-black text-sky-900">{formatPct(row.freshPercent)}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-sky-700" style={{ width: `${Math.max(4, row.freshPercent)}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">{row.freshObservations} fresh · {row.staleObservations} stale · {row.observationCount} total</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-sky-950">{freshLagSummary.caveat}</p>
        <Link className="mt-4 inline-block text-sm font-black text-sky-900 underline decoration-sky-300 underline-offset-4" href="/data-sources">
          Audit source freshness
        </Link>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Category match ledger</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Categories are ranked by matched-product depth and strongest observed Willys/Hemkop spread.
              </p>
            </div>
            <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/compare">
              Compare products
            </Link>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {chainCategoryCoverage.map((category) => (
              <Link
                className="grid gap-4 py-5 transition hover:bg-emerald-50/70 lg:grid-cols-[1fr_10rem_10rem]"
                href={`/categories/${category.slug}`}
                key={category.slug}
              >
                <div>
                  <p className="font-black text-slate-950">{category.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {category.matchedProducts.toLocaleString('sv-SE')} matched products, {category.leadingLowestChain} leads the lowest-price count.
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-700"
                      style={{ width: `${Math.max(8, (category.coverageScore / maxCoverageScore) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Average spread</p>
                  <p className="mt-2 text-2xl font-black text-emerald-800">{formatPct(category.averageSpread)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{category.chainRows.toLocaleString('sv-SE')} chain rows</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Top spread</p>
                  <p className="mt-2 text-2xl font-black text-amber-800">{formatPct(category.topSpread)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Coverage score {oneDecimal.format(category.coverageScore)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h2 className="text-2xl font-black tracking-tight">Largest matched spreads</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The products below are the strongest verified spread signals in the current Axfood chain snapshot.
            </p>
            <div className="mt-5 divide-y divide-slate-200">
              {topChainSpreads.slice(0, 8).map((product) => (
                <Link
                  className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto]"
                  href={`/products/${product.slug}`}
                  key={product.slug}
                >
                  <div>
                    <p className="font-black text-slate-950">{product.name}</p>
                    <p className="text-sm text-slate-600">
                      {product.brand || 'Brand not reported'} - lowest {product.lowestChain}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-black text-emerald-800">{formatSek(product.lowestPrice)}</p>
                    <p className="text-sm font-semibold text-slate-600">{formatPct(product.spreadPct)} spread</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <h2 className="text-2xl font-black tracking-tight text-amber-950">Claim boundary</h2>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              Chain coverage is computed from chain-wide catalogue rows only. It can compare matched product codes and category spread depth, but it does not claim live shelf prices, per-store availability, or substitutions for unmatched products.
            </p>
          </Card>
        </div>
      </div>

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
