import Link from 'next/link';
import { ClipboardCheck, PackageCheck, Route, ShieldCheck } from 'lucide-react';
import { pantryPlanner } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function PantryPlannerPage() {
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
