import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { chainPriceRows, formatPct, formatSek, matchedChainProducts } from '@/lib/verified-data';

export const dynamic = 'force-static';

const alertRows = [...matchedChainProducts]
  .sort((a, b) => b.spreadPct - a.spreadPct)
  .slice(0, 18);

export default function UnitPriceAlertsPage() {
  const wideSpreadRows = alertRows.filter((product) => product.spreadPct >= 25).length;
  const willysLowest = alertRows.filter((product) => product.lowestChain === 'willys').length;
  const hemkopLowest = alertRows.filter((product) => product.lowestChain === 'hemkop').length;

  return (
    <PageShell>
      <Eyebrow>Unit price alerts</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Package-aware price gaps from verified chain matches</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        The alert desk uses only products present under the same Axfood code in both Willys and Hemkop catalogues. Package labels, chain prices, and spread percentages come from the generated verified data module; no private baskets or branch shelf prices are invented.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Matched rows" value={matchedChainProducts.length.toLocaleString('sv-SE')} />
        <Metric label="Displayed alerts" value={alertRows.length.toLocaleString('sv-SE')} />
        <Metric label="25%+ spreads" value={wideSpreadRows.toLocaleString('sv-SE')} />
        <Metric label="Lowest chain split" value={`W ${willysLowest} / H ${hemkopLowest}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Package review queue</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Products with the widest same-code chain spreads are surfaced for unit/package review before shoppers compare baskets.
              </p>
            </div>
            <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/compare">
              Compare all matches
            </Link>
          </div>

          <div className="mt-5 divide-y divide-slate-200">
            {alertRows.map((product) => (
              <Link
                className="grid gap-4 py-4 transition hover:bg-emerald-50/60 lg:grid-cols-[1fr_auto_auto] lg:items-center"
                href={`/products/${product.slug}`}
                key={product.slug}
              >
                <div>
                  <p className="text-lg font-black text-slate-950">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{product.brand || 'Brand not reported'} · {product.subline || 'Package not reported'}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Lowest {product.lowestChain}: {formatSek(product.lowestPrice)} · highest: {formatSek(product.highestPrice)}
                  </p>
                </div>
                <div className="grid gap-2 text-sm font-black sm:grid-cols-2">
                  {chainPriceRows(product).map((row) => (
                    <span className="rounded-2xl bg-slate-50 px-4 py-3 capitalize" key={row.chain}>
                      {row.chain}: {formatSek(row.price)}
                    </span>
                  ))}
                </div>
                <p className="rounded-full bg-amber-100 px-4 py-2 text-center font-black text-amber-950">
                  {formatPct(product.spreadPct)} spread
                </p>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-black tracking-tight">What qualifies</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p className="rounded-2xl bg-slate-50 p-4 font-semibold">Same Axfood product code must be present in both chain catalogues.</p>
              <p className="rounded-2xl bg-slate-50 p-4 font-semibold">Package text is rendered directly from the verified row so shoppers can review size context.</p>
              <p className="rounded-2xl bg-slate-50 p-4 font-semibold">Spread percent is calculated from the generated chain-wide catalogue prices only.</p>
            </div>
          </Card>
          <Card>
            <h2 className="text-2xl font-black tracking-tight">No inferred shelf prices</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Store-location and branch-level pages remain separated from these alerts because the current verified snapshot does not contain per-branch shelf observations for these products.
            </p>
            <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/products">
              Browse products
            </Link>
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
      <p className="mt-2 text-4xl font-black text-emerald-800">{value}</p>
    </Card>
  );
}
