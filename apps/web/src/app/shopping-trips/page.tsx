import { BorderTripCalc } from '@/components/border-trip-calc';
import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { basketTripCostContract, budgetCheapestStoreRoutingPlanner, deliveryVsInStoreComparison, elderlyNearestDeliveryPlanner, formatSek, fulfillmentSlotsContract } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { activeShoppingTripEstimates } from '@/lib/trip-planner';

export function generateMetadata() {
  return routeMetadata('/shopping-trips');
}

const titles: Record<string, string> = {
  'weekly-basket': 'Weekly basket planner',
  watchlist: 'Watchlist alerts',
  scanner: 'Receipt scanner',
  household: 'Household profile',
  account: 'Account and alerts',
  'basket-ideas': 'Basket ideas',
  'coupon-stacks': 'Coupon stacks',
  deals: 'Deal radar',
  'meal-planner': 'Meal planner',
  'nutrition-value': 'Nutrition value',
  'pantry-planner': 'Pantry planner',
  'price-reports': 'Price reports',
  'savings-dashboard': 'Savings dashboard',
  'shopping-trips': 'Shopping trips',
  privacy: 'Privacy controls'
};

export default function FeaturePage() {
  const route = 'shopping-trips';
  return (
    <PageShell>
      <NoVerifiedData route={route} title={`${titles[route]} has no private production records in this static snapshot`} />
      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">Time-to-complete estimator</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Active-list aisle traversal and completion time</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Each active list uses its selected route mode to estimate remaining pick time, walking time, checkout time, and the aisle order a shopper should follow. Picked items are ignored so the time-to-complete stays focused on the current trip.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {activeShoppingTripEstimates.map((estimate) => (
            <div className="rounded-2xl bg-white p-4" key={estimate.listId}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{estimate.routeModeLabel}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{estimate.listName}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{estimate.routeModeDescription}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-slate-600">remaining items</dt>
                  <dd className="font-black text-slate-950">{estimate.remainingItemCount}/{estimate.totalItemCount}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-slate-600">aisle traversal</dt>
                  <dd className="font-black text-slate-950">{estimate.aisleTraversal.join(' → ')}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-slate-600">walking + picking</dt>
                  <dd className="font-black text-slate-950">{estimate.walkingMinutes + estimate.pickingMinutes} min</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-indigo-100 pt-2">
                  <dt className="font-black text-slate-950">time to complete</dt>
                  <dd className="font-black text-indigo-900">{estimate.timeToCompleteMinutes} min</dd>
                </div>
              </dl>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs font-semibold text-slate-600">
                {estimate.aisleStops.map((stop) => (
                  <li key={stop.aisle}>Aisle {stop.aisle}: {stop.items.join(', ')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
      <BorderTripCalc />
      <Card className="mt-6 border-sky-200 bg-sky-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Travel-cost optimizer</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Basket + trip cost optimizer: {basketTripCostContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The travel-cost optimizer account API now exposes <code className="rounded bg-white/80 px-1 py-0.5 text-sky-900">{basketTripCostContract.endpoint}</code> so a signed-in basket can be ranked by verified shelf totals plus explicit travel, time, delivery, and split-shop costs.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketTripCostContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketTripCostContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Static snapshot remains closed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketTripCostContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">{deliveryVsInStoreComparison.status}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Online delivery vs in-store total</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          GroceryView now runs a public Mathem online basket scenario and a matched-chain in-store trip scenario through the same trip-cost engine. The board shows <code className="rounded bg-white/80 px-1 py-0.5 text-cyan-900">pricedBasketTotal</code>, explicit <code className="rounded bg-white/80 px-1 py-0.5 text-cyan-900">deliveryFee</code> inputs, travel cost, and <code className="rounded bg-white/80 px-1 py-0.5 text-cyan-900">effectiveTotal</code> separately; it is not a retailer reservation, checkout, stock promise, or delivery booking.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Source evidence</p>
            <p className="mt-2 font-black text-slate-950">{deliveryVsInStoreComparison.sourceLabel}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {deliveryVsInStoreComparison.onlineRowCount.toLocaleString('sv-SE')} online rows · retrieved {deliveryVsInStoreComparison.retrievedAt}
            </p>
            <p className="mt-2 text-sm text-slate-600">{deliveryVsInStoreComparison.basketLabel}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Best online delivery option</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">pricedBasketTotal</dt>
                <dd className="font-black text-slate-950">{formatSek(deliveryVsInStoreComparison.bestDeliveryOption?.pricedBasketTotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">deliveryFee</dt>
                <dd className="font-black text-slate-950">{formatSek(deliveryVsInStoreComparison.bestDeliveryOption?.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">travelCost</dt>
                <dd className="font-black text-slate-950">{formatSek(deliveryVsInStoreComparison.bestDeliveryOption?.travelCost)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-cyan-100 pt-2">
                <dt className="font-black text-slate-950">effectiveTotal</dt>
                <dd className="font-black text-cyan-900">{formatSek(deliveryVsInStoreComparison.bestDeliveryOption?.effectiveTotal)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Best in-store trip option</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">pricedBasketTotal</dt>
                <dd className="font-black text-slate-950">{formatSek(deliveryVsInStoreComparison.bestInStoreOption?.pricedBasketTotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">travelCost</dt>
                <dd className="font-black text-slate-950">{formatSek(deliveryVsInStoreComparison.bestInStoreOption?.travelCost)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-cyan-100 pt-2">
                <dt className="font-black text-slate-950">effectiveTotal</dt>
                <dd className="font-black text-cyan-900">{formatSek(deliveryVsInStoreComparison.bestInStoreOption?.effectiveTotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">online minus in-store</dt>
                <dd className="font-black text-slate-950">{formatSek(deliveryVsInStoreComparison.effectiveTotalDelta)}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl bg-white">
          <div className="grid grid-cols-[1.1fr_1fr_1fr_0.7fr] gap-3 bg-cyan-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-900">
            <span>Matched token</span>
            <span>Online row</span>
            <span>In-store row</span>
            <span>Delta</span>
          </div>
          <div className="divide-y divide-cyan-100">
            {deliveryVsInStoreComparison.matchedBasketRows.map((row) => (
              <div className="grid grid-cols-[1.1fr_1fr_1fr_0.7fr] gap-3 px-4 py-3 text-sm" key={row.matchedToken}>
                <div>
                  <p className="font-black text-slate-950">{row.matchedToken}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{row.matchEvidence}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{row.onlineName}</p>
                  <p className="mt-1 text-xs text-slate-600">{row.onlineBrand} · {row.onlinePackageText} · {row.onlinePriceText}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{row.inStoreName}</p>
                  <p className="mt-1 text-xs text-slate-600">{row.inStoreBrand} · {row.inStorePackageText} · {row.inStoreLowestChain} {row.inStoreLowestPriceText}</p>
                </div>
                <p className="font-black text-slate-950">{formatSek(row.productPriceDelta)}</p>
              </div>
            ))}
          </div>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
          {deliveryVsInStoreComparison.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
        </ul>
      </Card>
      <Card className="mt-6 border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">{elderlyNearestDeliveryPlanner.persona}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Nearest-store + delivery options</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          This senior trip planner keeps no private home location in the static snapshot. It pairs verified store records with delivery and pickup evidence so mobilitySupport options stay explicit until a signed-in shopper consents.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {elderlyNearestDeliveryPlanner.mobilitySupport.map((option) => (
            <div className="rounded-2xl bg-white p-4" key={option.label}>
              <p className="font-black text-slate-950">{option.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{option.evidence}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
          {elderlyNearestDeliveryPlanner.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
        </ul>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">{budgetCheapestStoreRoutingPlanner.persona}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Cheapest-store-for-my-list routing</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          This budget routing surface explains when GroceryView can rank a signed-in shopper&apos;s list by basket plus trip cost. It stays closed on the public page because cheapest route needs private list, reachability, and consented location context.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4">
            <p className="font-black text-slate-950">routeRankInputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {budgetCheapestStoreRoutingPlanner.routeRankInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="font-black text-slate-950">storeListGuardrails</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {budgetCheapestStoreRoutingPlanner.storeListGuardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{budgetCheapestStoreRoutingPlanner.nextStep}</p>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Fulfillment evidence</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Delivery and pickup slot evidence: {fulfillmentSlotsContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The fulfillment slot account API now exposes <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">{fulfillmentSlotsContract.endpoint}</code> for signed-in baskets, but the report is explicitly not retailer reservations and must be re-confirmed inside the retailer checkout before delivery or pickup is booked.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {fulfillmentSlotsContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {fulfillmentSlotsContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Static snapshot remains closed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {fulfillmentSlotsContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
