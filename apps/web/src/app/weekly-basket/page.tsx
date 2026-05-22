import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { familyBulkUnitPriceComparison, weeklyBasketOptimizer } from '@/lib/demo-data';
import { recurringBasketDigestContract } from '@/lib/verified-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export default function WeeklyBasketPage() {
  const { comparison, coverage } = weeklyBasketOptimizer;
  return (
    <PageShell>
      <Eyebrow>Basket optimizer</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Cheapest route for this weekly basket</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page calls compareBasketStrategies and summarizeStoreBasketCoverage with visible favorite-store price rows, showing split-shop savings and store coverage without estimating missing prices.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Split-shop total</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{formatSek(comparison.cheapestByProduct.total)}</p>
          <p className="mt-3 font-semibold text-slate-700">{comparison.splitStoreCount} stores across {comparison.cheapestByProduct.assignments.length} priced basket lines.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Savings vs best single store</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(comparison.savingsVsBestSingleStore)}</p>
          <p className="mt-3 font-semibold text-slate-700">Best full-coverage store: {comparison.bestSingleStore?.storeName ?? 'none with full coverage'}.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Coverage confidence</p>
          <p className="mt-2 text-5xl font-black capitalize text-slate-950">{weeklyBasketOptimizer.confidence.level}</p>
          <p className="mt-3 font-semibold text-slate-700">{weeklyBasketOptimizer.confidence.caveat}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <h2 className="text-2xl font-black">Cheapest assignment by product</h2>
          <div className="mt-4 space-y-3">
            {comparison.cheapestByProduct.assignments.map((assignment) => (
              <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${assignment.productId}`} key={`${assignment.productId}-${assignment.storeId}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-950">{assignment.productId}</p>
                    <p className="mt-1 text-sm text-slate-600">{assignment.quantity} × {formatSek(assignment.unitPrice)} at {assignment.storeName}</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-800">{formatSek(assignment.lineTotal)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Store basket coverage</h2>
          <div className="mt-4 space-y-3">
            {coverage.stores.map((store) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={store.storeId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{store.storeName}</p>
                    <p className="text-sm text-slate-600">{store.availableProductIds.length} available · {store.missingProductIds.length} missing</p>
                  </div>
                  <p className="font-black text-slate-950">{store.coveragePercent}%</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">Known total: {formatSek(store.knownTotal)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <Eyebrow>Changed since last shop</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-950">Recurring basket digest: {recurringBasketDigestContract.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-950">
          The account API exposes <code className="rounded bg-white/80 px-1 py-0.5 font-bold">{recurringBasketDigestContract.endpoint}</code> for recurring weekly baskets; it still guards private user-owned rows while this public optimizer uses visible fixture prices.
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-900">Shipped behaviours include missing-price blockers, substitutes, and price-up/down classifications.</p>
      </Card>

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-800">{familyBulkUnitPriceComparison.persona}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Family-pack unit prices</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          This family board compares standard package rows against visible family-sized bundles using comparable units, so bulkUnitPrice wins only when the package math is present.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {familyBulkUnitPriceComparison.rows.map((row) => (
            <Link className="rounded-2xl border border-blue-200 bg-white p-4 hover:border-blue-700" href={`/products/${row.productId}`} key={row.productId}>
              <p className="text-lg font-black text-slate-950">{row.productName}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.familyPack} at {row.storeName}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p className="rounded-2xl bg-blue-50 p-3 font-semibold">Bulk {formatSek(row.bulkUnitPrice)} / {row.comparableUnit.replace('SEK/', '')}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Standard {formatSek(row.standardUnitPrice)} / {row.comparableUnit.replace('SEK/', '')}</p>
                <p className="rounded-2xl bg-emerald-50 p-3 font-black text-emerald-900">{row.unitSavingsPercent}% unit savings</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-600">{row.source}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{familyBulkUnitPriceComparison.coverage.caveat}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
