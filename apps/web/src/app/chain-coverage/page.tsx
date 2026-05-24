import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import {
  chainCategoryCoverage,
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
const trackedRetailerTypes = [
  'grocery',
  'pharmacy',
  'fuel',
  'convenience',
  'variety',
  'cosmetics',
  'household',
  'online_marketplace'
];

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
        <h2 className="text-2xl font-black tracking-tight text-sky-950">Tracked retailer types</h2>
        <p className="mt-2 text-sm leading-6 text-sky-900">Coverage now distinguishes every chain by retailer_type so grocery, pharmacy, fuel, convenience, variety, cosmetics, household, and online marketplace coverage can be audited separately.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {trackedRetailerTypes.map((type) => (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-sky-900 shadow-sm" key={type}>{type.replace(/_/g, ' ')}</span>
          ))}
        </div>
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
