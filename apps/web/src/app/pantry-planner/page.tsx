import Link from 'next/link';
import { ClipboardCheck, PackageCheck, Route, ShieldCheck } from 'lucide-react';
import { planPantryReplenishment, type PantryDeal, type PantryInventoryItem, type PantryUsageEvent } from '@groceryview/core';
import { pantryPlanner } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function PantryPlannerPage() {
  const pantryPlan = planPantryReplenishment(buildPantryPlanInput());

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/meal-planner">Meals</Link>
          <Link href="/weekly-basket">Basket</Link>
          <Link href="/categories/pantry">Pantry</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Pantry planner</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {pantryPlanner.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Plan shelf-stable grocery top-ups without mixing low-confidence rows into the main weekly basket.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<PackageCheck size={20} />} label="Projected spend" value={pantryPlanner.projectedSpend} />
          <Metric icon={<ClipboardCheck size={20} />} label="Savings" value={pantryPlanner.projectedSavings} />
          <Metric icon={<Route size={20} />} label="Anchor store" value={pantryPlanner.anchorStore} />
          <Metric icon={<ShieldCheck size={20} />} label="Target" value={pantryPlanner.target} />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Decision rules</h2>
          <p className="mt-1 text-sm text-market-ink/60">{pantryPlanner.reviewRule}</p>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {pantryPlanner.decisions.map((decision) => (
            <div key={decision.label} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <span className="block text-xs font-bold uppercase text-market-ink/50">{decision.label}</span>
              <span className="mt-2 block font-black">{decision.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Replenishment plan</h2>
          <p className="mt-1 text-sm text-market-ink/60">
            Calculated with planPantryReplenishment from visible pantry rows, household usage, expiry state, and deal candidates.
          </p>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {pantryPlan.replenishment.map((item) => (
            <Link
              key={item.productId}
              href={`/products/${item.productId}`}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block text-lg font-black">{item.name}</span>
              <span className="mt-1 block text-market-ink/65">
                Buy {item.quantityToBuy} {item.unit} · {item.priority} priority · {item.reason}
              </span>
              {item.bestDeal ? (
                <span className="mt-3 block font-black text-market-mint">
                  Best deal: {item.bestDeal.price.toFixed(2)} SEK at {item.bestDeal.storeName}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
        {pantryPlan.expiringSoonProductIds.length > 0 ? (
          <p className="px-4 py-3 text-sm text-market-ink/65">
            Expiring soon: {pantryPlan.expiringSoonProductIds.join(', ')}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Staple</span>
          <span>Planned</span>
          <span className="text-right">Saving</span>
        </div>
        {pantryPlanner.staples.map((staple) => (
          <Link
            key={staple.slug}
            href={`/products/${staple.slug}`}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[1fr_auto_auto]"
          >
            <span>
              <span className="block font-black">{staple.product}</span>
              <span className="mt-1 block text-market-ink/60">
                {staple.quantity} · {staple.role} · {staple.store}
              </span>
            </span>
            <span className="font-black tabular-nums">{staple.planned}</span>
            <span className="text-right font-black tabular-nums text-market-mint">{staple.saving}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

function buildPantryPlanInput() {
  const pantry: PantryInventoryItem[] = pantryPlanner.staples.map((staple, index) => ({
    productId: staple.slug,
    name: staple.product,
    category: 'pantry',
    quantity: index === 0 ? 0.5 : 1,
    unit: staple.quantity.includes('bag') ? 'kg' : 'pack',
    minimumQuantity: 1,
    targetQuantity: parsePlannedQuantity(staple.quantity),
    expiresAt: index === 2 ? '2026-05-23T18:00:00.000Z' : undefined,
    lastPurchasedAt: '2026-05-14T09:00:00.000Z'
  }));
  const usage: PantryUsageEvent[] = pantryPlanner.staples.map((staple, index) => ({
    productId: staple.slug,
    quantityUsed: index === 0 ? 0.6 : 0.2,
    usedAt: '2026-05-21T08:00:00.000Z'
  }));
  const deals: PantryDeal[] = pantryPlanner.staples.map((staple) => ({
    productId: staple.slug,
    storeId: staple.store.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    storeName: staple.store,
    price: parseSek(staple.planned),
    dealScore: Math.max(1, Math.round(Math.abs(parseSek(staple.saving))))
  }));

  return {
    pantry,
    usage,
    deals,
    now: '2026-05-21T09:00:00.000Z',
    expiringSoonDays: 3
  };
}

function parsePlannedQuantity(value: string): number {
  const parsed = Number(value.match(/\d+(\.\d+)?/)?.[0] ?? '1');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseSek(value: string): number {
  const parsed = Number(value.replace(',', '.').match(/-?\d+(\.\d+)?/)?.[0] ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function Metric({ icon, label, value }: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-market-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3 text-market-mint">
        {icon}
        <span className="text-xs font-bold uppercase text-market-ink/45">{label}</span>
      </div>
      <strong className="mt-4 block text-2xl font-black">{value}</strong>
    </div>
  );
}
