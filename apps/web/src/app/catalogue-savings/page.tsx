import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import {
  chainPriceRows,
  chainSavingsLedger,
  formatPct,
  formatSek,
  matchedChainProducts,
  sourceCoverage
} from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/catalogue-savings');
}

export const dynamic = 'force-static';

const chainSource = sourceCoverage.find((source) => source.name === 'Axfood chain price snapshot');
const savingsRows = matchedChainProducts
  .map((product) => {
    const savingRows = chainPriceRows(product).filter((row) => typeof row.savings === 'number' && row.savings > 0);
    const bestSaving = savingRows.sort((a, b) => (b.savings ?? 0) - (a.savings ?? 0))[0];

    return bestSaving
      ? {
          ...product,
          bestSavingChain: bestSaving.chain,
          bestSaving: bestSaving.savings ?? 0
        }
      : null;
  })
  .filter((product): product is NonNullable<typeof product> => product !== null)
  .sort((a, b) => b.bestSaving - a.bestSaving)
  .slice(0, 16);

const totalListedSavings = chainSavingsLedger.reduce((sum, chain) => sum + chain.totalSavings, 0);
const rowsWithSavings = chainSavingsLedger.reduce((sum, chain) => sum + chain.products, 0);
const topSaving = savingsRows[0];

export default function CatalogueSavingsPage() {
  return (
    <PageShell>
      <Eyebrow>Catalogue savings</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Matched catalogue savings ledger</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This route expands the verified Willys and Hemkop savings signals from the Axfood catalogue snapshot. It only renders listed savings from matched product codes and avoids household basket estimates, live shelf claims, or unmatched substitutions.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Source rows" value={chainSource?.rows.toLocaleString('sv-SE') ?? 'Not reported'} />
        <Metric label="Rows with savings" value={rowsWithSavings.toLocaleString('sv-SE')} />
        <Metric label="Listed savings total" value={formatSek(totalListedSavings)} />
        <Metric label="Top saving" value={topSaving ? formatSek(topSaving.bestSaving) : 'Not reported'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1fr]">
        <Card>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Chain savings rollup</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Totals are grouped by the chain row that exposed a positive listed saving in the matched catalogue data.
              </p>
            </div>
            <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/compare">
              Open comparisons
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {chainSavingsLedger.map((chain) => (
              <Link
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-700"
                href={`/products/${chain.topProductSlug}`}
                key={chain.chain}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-black capitalize text-slate-950">{chain.chain}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {chain.products.toLocaleString('sv-SE')} matched rows with savings, led by {chain.topProductName}.
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-3xl font-black text-emerald-800">{formatSek(chain.totalSavings)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">avg {formatSek(chain.averageSaving)}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-emerald-700"
                    style={{ width: `${Math.max(10, totalListedSavings ? (chain.totalSavings / totalListedSavings) * 100 : 0)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-tight">Largest listed savings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Product rows below keep the original matched product, lowest chain, spread, and strongest listed saving together.
          </p>
          <div className="mt-5 divide-y divide-slate-200">
            {savingsRows.map((product) => (
              <Link
                className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
                href={`/products/${product.slug}`}
                key={product.slug}
              >
                <div>
                  <p className="font-black text-slate-950">{product.name}</p>
                  <p className="text-sm text-slate-600">
                    {product.brand || 'Brand not reported'} - listed saving at {product.bestSavingChain}
                  </p>
                </div>
                <p className="font-black text-emerald-800">{formatSek(product.bestSaving)}</p>
                <p className="text-sm font-semibold text-slate-700">{formatPct(product.spreadPct)} spread</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Claim boundary</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-950">
          Catalogue savings are not basket savings. This page can show listed savings present in the chain-wide Axfood catalogue snapshot, but it does not claim live discounts, store-specific availability, loyalty eligibility, or savings on unmatched products.
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
