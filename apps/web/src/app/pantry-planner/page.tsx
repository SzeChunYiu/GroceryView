import Link from 'next/link';
import { planPantryReplenishment } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { pantryReplenishmentInput, pantryReplenishmentPlan } from '@/lib/demo-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/pantry-planner');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

const priorityClasses = {
  high: 'bg-rose-100 text-rose-900',
  medium: 'bg-amber-100 text-amber-900',
  low: 'bg-slate-100 text-slate-700'
} as const;

export default function PantryPlannerPage() {
  const plan = planPantryReplenishment(pantryReplenishmentInput);
  const { coverage } = pantryReplenishmentPlan;
  const { householdId, replenishment, expiringSoonProductIds } = plan;
  const coverageConfidence = coverage.confidence as 'high' | 'medium' | 'low';
  const alreadyInBasketCount = replenishment.filter((item) => item.alreadyInBasket).length;
  const dealBackedRestocks = replenishment.filter((item) => item.bestDeal).length;

  return (
    <PageShell>
      <Eyebrow>Pantry replenishment</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Restock before the shelf runs out</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Low-stock pantry rows are matched against the household basket and current visible deals, so the queue can separate urgent restocks from items already planned for checkout.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Restock actions</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{replenishment.length}</p>
          <p className="mt-3 font-semibold text-slate-700">generated from {coverage.visiblePantryItems} visible pantry rows.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Basket blockers</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{alreadyInBasketCount}</p>
          <p className="mt-3 font-semibold text-slate-700">{householdId ?? 'Household'} already has these restocks queued.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Deal-backed</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{dealBackedRestocks}</p>
          <p className="mt-3 font-semibold text-slate-700">restocks have a visible deal out of {coverage.dealBackedItems} deal rows.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Confidence</p>
          <div className="mt-4">
            <ConfidenceBadge level={coverageConfidence} label={`${coverage.confidence} confidence`} sampleSize={coverage.visiblePantryItems} />
          </div>
          <p className="mt-3 font-semibold text-slate-700">{coverage.caveat}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Replenishment queue</h2>
            <ConfidenceBadge level={coverageConfidence} label="visible pantry input" sampleSize={coverage.visiblePantryItems} />
          </div>
          <div className="mt-4 space-y-3">
            {replenishment.map((item) => (
              <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${item.productId}`} key={item.productId}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">Buy {item.quantityToBuy} {item.unit} · priority {item.priority}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <p className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${priorityClasses[item.priority]}`}>{item.priority}</p>
                      <p className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${item.alreadyInBasket ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                        {item.alreadyInBasket ? 'Already in basket' : 'Add to basket'}
                      </p>
                    </div>
                  </div>
                  {item.bestDeal ? (
                    <div className="rounded-2xl bg-emerald-50 p-4 text-right">
                      <p className="text-2xl font-black text-emerald-800">{formatSek(item.bestDeal.price)}</p>
                      <p className="text-sm font-semibold text-emerald-950">{item.bestDeal.storeName}</p>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">deal score {item.bestDeal.dealScore ?? 'n/a'}</p>
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Pantry status</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">{expiringSoonProductIds.length} products are expiring soon and held out of the restock queue until the shopper reviews them.</p>
          <div className="mt-4 space-y-3">
            {plan.statuses.map((item) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={item.productId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">Remaining {item.remainingQuantity} {item.unit} · min {item.minimumQuantity}</p>
                  </div>
                  <p className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-700">{item.status}</p>
                </div>
                {typeof item.daysUntilExpiry === 'number' ? <p className="mt-2 text-sm text-slate-600">{item.daysUntilExpiry} days until expiry</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
