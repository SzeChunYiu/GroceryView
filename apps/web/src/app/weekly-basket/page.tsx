import Link from 'next/link';
import { compareBasketStrategies, summarizeStoreBasketCoverage } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { StockUpListActions } from '@/components/stock-up-list-actions';
import { budgetStretchKronaOptimizer, familyBulkUnitPriceComparison, loyaltyAdjustedBasketComparison, mealPrepBulkBuyOptimizer, multiWeekStockUpList, oneTapBasketOptimizer, savedBasketAutoReorderPlan, weeklyBasketOptimizerInput } from '@/lib/demo-data';
import { weeklyRecurringBasketPlan } from '@/lib/recurring-basket';
import { recurringBasketDigestContract, weeklyBasketChangeDigest } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/weekly-basket');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

const weeklyBasketConfidence = {
  level: 'medium' as const,
  caveat: 'The optimizer uses visible price rows for favorite stores only; missing store-product prices reduce coverage instead of being estimated.'
};

function WeeklyBasketEmptyState() {
  return (
    <PageShell>
      <Eyebrow>Basket optimizer</Eyebrow>
      <Card className="mt-6 text-center">
        <div className="text-5xl" aria-hidden="true">🧺</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">No weekly basket data yet</h1>
        <Link className="mt-3 inline-block font-black text-emerald-800 hover:text-emerald-950" href="/products">Browse products to start building a weekly basket.</Link>
      </Card>
    </PageShell>
  );
}

export default function WeeklyBasketPage() {
  if (weeklyBasketOptimizerInput.items.length === 0) {
    return <WeeklyBasketEmptyState />;
  }

  const comparison = compareBasketStrategies(weeklyBasketOptimizerInput);
  const coverage = summarizeStoreBasketCoverage(weeklyBasketOptimizerInput);

  if (comparison.cheapestByProduct.assignments.length === 0 || coverage.stores.length === 0) {
    return <WeeklyBasketEmptyState />;
  }

  const bestSingleStore = comparison.bestSingleStore;

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
          <p className="mt-3 font-semibold text-slate-700">Best full-coverage store: {bestSingleStore?.storeName ?? 'none with full coverage'}.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Coverage confidence</p>
          <div className="mt-3">
            <ConfidenceBadge level={weeklyBasketConfidence.level} label={`${weeklyBasketConfidence.level} confidence`} sampleSize={weeklyBasketOptimizerInput.items.length} />
          </div>
          <p className="mt-3 font-semibold text-slate-700">{weeklyBasketConfidence.caveat}</p>
        </Card>
      </div>

      <Card className="mt-6 border-emerald-200 bg-white">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <div>
            <Eyebrow>Single vs split shop</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Real basket strategy comparison</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              compareBasketStrategies prices the visible favorite-store rows as both one full-coverage shop and a cheapest split-shop plan. summarizeStoreBasketCoverage keeps missing product rows visible instead of filling gaps.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Best single shop</p>
              <p className="mt-2 text-lg font-black text-slate-950">{bestSingleStore?.storeName ?? 'No full-coverage store'}</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{bestSingleStore ? formatSek(bestSingleStore.total) : 'n/a'}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Cheapest split shop</p>
              <p className="mt-2 text-lg font-black text-slate-950">{comparison.splitStoreCount} stores</p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{formatSek(comparison.cheapestByProduct.total)}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">{oneTapBasketOptimizer.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">One-tap basket optimizer</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Busy shoppers can see the readyAction from compareBasketStrategies before any signed-in account mutation. The tap applies the reviewed cheapest plan to a saved basket; it is not a retailer checkout or automatic purchase.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">readyAction</span>
                <span className="mt-1 block text-lg font-black text-sky-900">{oneTapBasketOptimizer.readyAction.label}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Optimized total</span>
                <span className="mt-1 block text-2xl font-black text-sky-900">{formatSek(oneTapBasketOptimizer.readyAction.total)}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Coverage rows</span>
                <span className="mt-1 block text-2xl font-black text-slate-950">{oneTapBasketOptimizer.coverage.stores.length} stores</span>
              </p>
            </div>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
              {oneTapBasketOptimizer.quickestPath.map((line) => (
                <Link className="rounded-2xl bg-white p-3 hover:bg-sky-100" href={`/products/${line.productId}`} key={`${line.productId}-${line.storeName}`}>
                  <span className="block font-black text-slate-950">{line.productId}</span>
                  <span className="mt-1 block">{line.storeName} · {formatSek(line.lineTotal)} · {line.priceType}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">checkoutGuardrails</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">The public snapshot stays account-safe even when the plan is ready.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {oneTapBasketOptimizer.checkoutGuardrails.map((guardrail) => (
                <li className="rounded-2xl bg-sky-50 p-3" key={guardrail}>{guardrail}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-black text-sky-950">Signed-in saved baskets are required before GroceryView can prepare the one-tap mutation.</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">{savedBasketAutoReorderPlan.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Saved basket auto-reorder readiness</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Busy professionals can prepare the next {savedBasketAutoReorderPlan.readyAction.nextRunLabel} from a signed-in saved basket, but GroceryView only drafts the reviewed plan from compareBasketStrategies. No retailer checkout or payment is submitted automatically.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">autoReorderEligibleLines</span>
                <span className="mt-1 block text-2xl font-black text-cyan-900">{savedBasketAutoReorderPlan.autoReorderEligibleLines.length}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">manualReviewRequired</span>
                <span className="mt-1 block text-2xl font-black text-cyan-900">{savedBasketAutoReorderPlan.manualReviewRequired.length}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Draft total</span>
                <span className="mt-1 block text-2xl font-black text-slate-950">{formatSek(savedBasketAutoReorderPlan.readyAction.estimatedTotal)}</span>
              </p>
            </div>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
              {savedBasketAutoReorderPlan.autoReorderEligibleLines.map((line) => (
                <Link className="rounded-2xl bg-white p-3 hover:bg-cyan-100" href={`/products/${line.productId}`} key={`${line.productId}-${line.storeName}`}>
                  <span className="block font-black text-slate-950">{line.productId}</span>
                  <span className="mt-1 block">{line.quantity}× at {line.storeName} · {formatSek(line.lineTotal)} · {line.priceType}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-cyan-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">{savedBasketAutoReorderPlan.readyAction.label}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Account-bound reorder readiness is fail-closed: signed-in saved basket state is required before a shopper can approve any draft.
            </p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {savedBasketAutoReorderPlan.guardrails.map((guardrail) => (
                <li className="rounded-2xl bg-cyan-50 p-3" key={guardrail}>{guardrail}</li>
              ))}
            </ul>
            <div className="mt-4 space-y-2">
              {savedBasketAutoReorderPlan.manualReviewRequired.map((blocker) => (
                <Link className="block rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-950 hover:bg-cyan-50" href={`/products/${blocker.productId}`} key={blocker.productId}>
                  {blocker.productId}: {blocker.reason} {blocker.missingStoreCount} missing stores.
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-teal-200 bg-teal-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-800">Recurring weekly basket</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{weeklyRecurringBasketPlan.templateName}</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Reuse template {weeklyRecurringBasketPlan.reusableTemplateId} every {weeklyRecurringBasketPlan.cadence} cycle, then review the expected date window before saving a duplicated draft.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Next window</span>
                <span className="mt-1 block text-lg font-black text-teal-900">{weeklyRecurringBasketPlan.nextWindow.label}</span>
                <span className="mt-1 block text-sm font-semibold text-slate-700">{weeklyRecurringBasketPlan.nextWindow.startsOn} → {weeklyRecurringBasketPlan.nextWindow.endsOn}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Template lines</span>
                <span className="mt-1 block text-2xl font-black text-teal-900">{weeklyRecurringBasketPlan.lines.length}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Quick duplicates</span>
                <span className="mt-1 block text-2xl font-black text-slate-950">{weeklyRecurringBasketPlan.duplicateControls.length}</span>
              </p>
            </div>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-3">
              {weeklyRecurringBasketPlan.lines.map((line) => (
                <Link className="rounded-2xl bg-white p-3 hover:bg-teal-100" href={`/products/${line.productId}`} key={line.productId}>
                  <span className="block font-black text-slate-950">{line.productName}</span>
                  <span className="mt-1 block">Template quantity {line.templateQuantity}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-teal-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Quick duplication controls</h3>
            <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {weeklyRecurringBasketPlan.duplicateControls.map((control) => (
                <p className="rounded-2xl bg-teal-50 p-3" key={control.targetWindow.startsOn}>
                  <span className="block font-black text-teal-950">{control.label}</span>
                  <span className="mt-1 block">{control.targetWindow.startsOn} → {control.targetWindow.endsOn}; template reuse {control.preserveTemplate ? 'on' : 'off'}</span>
                </p>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {weeklyRecurringBasketPlan.guardrails.map((guardrail) => (
                <li className="rounded-2xl bg-slate-50 p-3" key={guardrail}>{guardrail}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

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

      <Card className="mt-6 border-violet-200 bg-violet-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">{loyaltyAdjustedBasketComparison.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Loyalty-adjusted basket comparison</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              The same compareBasketStrategies engine now includes eligible member prices only after the shopper enables that chain. Public shelf rows remain the baseline; member prices are only counted for enabled loyalty chains.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Member-adjusted split</span>
                <span className="mt-1 block text-2xl font-black text-violet-900">{formatSek(loyaltyAdjustedBasketComparison.comparison.cheapestByProduct.total)}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">memberSavingsTotal</span>
                <span className="mt-1 block text-2xl font-black text-violet-900">{formatSek(loyaltyAdjustedBasketComparison.memberSavingsTotal)}</span>
              </p>
              <p className="rounded-2xl bg-white p-4 shadow-sm">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">enabledMemberStoreIds</span>
                <span className="mt-1 block text-sm font-black text-slate-950">{loyaltyAdjustedBasketComparison.enabledMemberStoreIds.join(', ')}</span>
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-violet-950">{loyaltyAdjustedBasketComparison.guardrail}</p>
          </div>
          <div className="rounded-[1.5rem] border border-violet-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Excluded member price blockers</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              excludedMemberPriceProductIds are shown when a visible member row belongs to a chain the shopper has not enabled.
            </p>
            <div className="mt-3 space-y-2">
              {loyaltyAdjustedBasketComparison.excludedMemberPriceProductIds.map((blocker) => (
                <p className="rounded-2xl bg-violet-50 p-3 text-sm font-black text-violet-950" key={blocker}>{blocker}</p>
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
                    <p className="mt-1 text-sm text-slate-600">{assignment.quantity} × {formatSek(assignment.unitPrice)} at {assignment.storeName} · {assignment.priceType}</p>
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

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">{mealPrepBulkBuyOptimizer.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Meal-prepper bulk-buy optimizer</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Large-household shoppers can compare bulkUnitPrice against the standard package row, then decide whether freezerPortions and pantry space justify stocking up. The stockUpDecision is not a forecast; it is a visible unit-price and storage guardrail.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {mealPrepBulkBuyOptimizer.rows.map((row) => (
                <Link className="rounded-2xl border border-fuchsia-200 bg-white p-4 hover:border-fuchsia-700" href={`/products/${row.productId}`} key={row.productId}>
                  <p className="text-lg font-black text-slate-950">{row.productName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{row.familyPack} · {row.storeName}</p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    <p className="rounded-2xl bg-fuchsia-50 p-3 font-semibold">bulkUnitPrice {formatSek(row.bulkUnitPrice)} / {row.comparableUnit.replace('SEK/', '')}</p>
                    <p className="rounded-2xl bg-white p-3 font-semibold">freezerPortions {row.freezerPortions} · paybackMeals {row.paybackMeals}</p>
                    <p className="rounded-2xl bg-emerald-50 p-3 font-black text-emerald-900">{row.unitSavingsPercent}% unit savings</p>
                  </div>
                  <p className="mt-3 text-sm font-black text-fuchsia-950">stockUpDecision: {row.stockUpDecision}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{row.coverageEvidence}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-fuchsia-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">coverageGuardrails</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{mealPrepBulkBuyOptimizer.coverage.caveat}</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {mealPrepBulkBuyOptimizer.coverageGuardrails.map((guardrail) => (
                <li className="rounded-2xl bg-fuchsia-50 p-3" key={guardrail}>{guardrail}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-orange-200 bg-orange-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-800">{multiWeekStockUpList.persona}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Multi-week stock-up list</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              This planningWeeks view blocks price outlook claims. No price forecast is shown; low and typical prices are historical observed unit-price facts, while budget impact is today&apos;s stock-up cost spread across the plan.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[34rem]">
            <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-orange-950 shadow-sm">planningWeeks {multiWeekStockUpList.planningWeeks}</p>
            <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-orange-950 shadow-sm">upfront {formatSek(multiWeekStockUpList.totalUpfrontCost)}</p>
            <p className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-orange-950 shadow-sm">weekly impact {multiWeekStockUpList.weeklyBudgetSharePercent}%</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {multiWeekStockUpList.rows.map((row) => (
            <Link className="rounded-2xl border border-orange-200 bg-white p-4 hover:border-orange-700" href={`/products/${row.productId}`} key={row.productId}>
              <p className="text-lg font-black text-slate-950">{row.productName}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.storeName} · {row.planningWeeks} week plan</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p className="rounded-2xl bg-orange-50 p-3 font-semibold">observedHistoryWindow: {row.observationCount} rows · {row.historyWindowStart.slice(0, 10)} to {row.historyWindowEnd.slice(0, 10)} · {row.confidence}</p>
                <p className="rounded-2xl bg-white p-3 font-semibold">low {formatSek(row.historicalLowUnitPrice)} · typical {formatSek(row.typicalUnitPrice)} / {row.comparableUnit}</p>
                <p className="rounded-2xl bg-white p-3 font-semibold">planned {row.plannedUnits} {row.comparableUnit} · {row.packagesNeeded} packs · upfront {formatSek(row.upfrontCost)}</p>
                <p className="rounded-2xl bg-emerald-50 p-3 font-black text-emerald-900">{formatSek(row.currentUnitPrice)} current bulk unit · {row.currentVsTypicalPercent}% vs typical</p>
              </div>
              <p className="mt-3 text-sm font-black text-orange-950">reviewTrigger: {row.reviewTrigger}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{row.contextLabel} {row.seasonalityNote}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1fr]">
          <p className="rounded-2xl bg-white p-4 text-sm font-black text-orange-950">{multiWeekStockUpList.noForecastReason} Coverage: {multiWeekStockUpList.coverage.confidence} confidence across {multiWeekStockUpList.coverage.observedItemCount}/{multiWeekStockUpList.coverage.totalItemCount} items.</p>
          <ul className="grid gap-2 text-sm font-semibold text-slate-700 md:grid-cols-2">
            {multiWeekStockUpList.coverageGuardrails.map((guardrail) => (
              <li className="rounded-2xl bg-white p-3" key={guardrail}>{guardrail}</li>
            ))}
          </ul>
        </div>
        <StockUpListActions
          draftRows={multiWeekStockUpList.rows.map((row) => ({
            productId: row.productId,
            productName: row.productName,
            storeName: row.storeName,
            planningWeeks: row.planningWeeks,
            weeklyNeedUnits: row.plannedUnits / row.planningWeeks,
            packageUnits: Math.max(row.plannedUnits / row.packagesNeeded, 0.001),
            comparableUnit: row.comparableUnit,
            currentUnitPrice: row.currentUnitPrice,
            historicalLowUnitPrice: row.historicalLowUnitPrice,
            typicalUnitPrice: row.typicalUnitPrice,
            confidence: row.confidence,
            historyWindowStart: row.historyWindowStart,
            historyWindowEnd: row.historyWindowEnd,
            noForecastReason: multiWeekStockUpList.noForecastReason,
            reviewTrigger: row.reviewTrigger
          }))}
        />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
