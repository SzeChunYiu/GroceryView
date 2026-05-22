import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { budgetStretchKronaOptimizer, familyBulkUnitPriceComparison, weeklyBasketOptimizer } from '@/lib/demo-data';
import { recurringBasketDigestContract, weeklyBasketChangeDigest } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/weekly-basket');
}

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

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">{budgetStretchKronaOptimizer.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Stretch your krona optimizer</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Uses compareBasketStrategies on the visible weekly basket to decide whether a split shop is worth it for low-income shoppers. The headline metric divides verified savings by extra stores, so the UI does not hide the effort cost.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Split total</span>
                <span className="mt-1 block text-2xl font-black text-emerald-900">{formatSek(budgetStretchKronaOptimizer.comparison.cheapestByProduct.total)}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Saved per extra store</span>
                <span className="mt-1 block text-2xl font-black text-emerald-900">{formatSek(budgetStretchKronaOptimizer.kronaSavedPerExtraStore)}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Extra stops</span>
                <span className="mt-1 block text-2xl font-black text-slate-950">{Math.max(0, budgetStretchKronaOptimizer.comparison.splitStoreCount - 1)}</span>
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-emerald-950">{budgetStretchKronaOptimizer.guardrail}</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Missing price blockers</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">The optimizer withholds full certainty where a favorite store is missing a visible price row.</p>
            <div className="mt-3 space-y-2">
              {budgetStretchKronaOptimizer.missingPriceBlockers.map((blocker) => (
                <Link className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm font-black hover:bg-emerald-50" href={`/products/${blocker.productId}`} key={blocker.productId}>
                  <span>{blocker.productId}</span>
                  <span>{blocker.missingStoreCount} missing stores</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

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
        <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-950">Changed-since-last-shop digest: Recurring basket digest {recurringBasketDigestContract.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-950">
          The account API exposes <code className="rounded bg-white/80 px-1 py-0.5 font-bold">{recurringBasketDigestContract.endpoint}</code> for recurring weekly baskets; this public preview calls the same weeklyBasketChangeDigest engine from visible verified rows and keeps private user-owned rows out of the static build.
        </p>
        <p className="mt-3 rounded-2xl bg-white p-4 text-lg font-black text-emerald-950">{weeklyBasketChangeDigest.headline}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <p className="rounded-2xl bg-white p-4 shadow-sm"><span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current comparable</span><span className="mt-1 block text-2xl font-black text-emerald-900">{formatSek(weeklyBasketChangeDigest.comparableCurrentTotal)}</span></p>
          <p className="rounded-2xl bg-white p-4 shadow-sm"><span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Previous comparable</span><span className="mt-1 block text-2xl font-black text-slate-950">{formatSek(weeklyBasketChangeDigest.comparablePreviousTotal)}</span></p>
          <p className="rounded-2xl bg-white p-4 shadow-sm"><span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Delta</span><span className="mt-1 block text-2xl font-black text-emerald-900">{formatSek(weeklyBasketChangeDigest.comparableDelta)}</span></p>
        </div>
        <div className="mt-4 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-5">
          <p className="rounded-2xl bg-white p-3">changeSummary price_up: {weeklyBasketChangeDigest.changeSummary.priceUp}</p>
          <p className="rounded-2xl bg-white p-3">price_down: {weeklyBasketChangeDigest.changeSummary.priceDown}</p>
          <p className="rounded-2xl bg-white p-3">substitutes: {weeklyBasketChangeDigest.changeSummary.substituteAvailable}</p>
          <p className="rounded-2xl bg-white p-3">new: {weeklyBasketChangeDigest.changeSummary.newItem}</p>
          <p className="rounded-2xl bg-white p-3">missing: {weeklyBasketChangeDigest.changeSummary.missingCurrentPrice}</p>
        </div>
        <div className="mt-4 space-y-3">
          {weeklyBasketChangeDigest.lines.map((line) => (
            <Link className="block rounded-2xl border border-emerald-200 bg-white p-4 hover:border-emerald-700" href={line.productId === 'missing-current-price-example' ? '/weekly-basket' : `/products/${line.productId}`} key={line.productId}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">{line.productName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{line.quantity} × current {line.currentUnitPrice === null ? 'missing' : formatSek(line.currentUnitPrice)} · previous {line.previousUnitPrice === null ? 'new item' : formatSek(line.previousUnitPrice)}</p>
                </div>
                <p className="text-right text-sm font-black text-emerald-900">{line.changeType}<br />lineDelta {line.lineDelta === null ? 'n/a' : formatSek(line.lineDelta)}</p>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">recommendedAction: {line.recommendedAction}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-black text-emerald-950">Missing current prices block automatic checkout handoff; missing-price blockers remain visible in the digest.</p>
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
