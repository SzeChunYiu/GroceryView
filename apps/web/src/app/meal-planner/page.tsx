import Link from 'next/link';
import { CalendarDays, CheckCircle2, CircleDollarSign, ShoppingBasket, Store } from 'lucide-react';
import { mealPlanner } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function MealPlannerPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/weekly-basket">Basket</Link>
          <Link href="/savings-dashboard">Savings</Link>
          <Link href="/stores">Stores</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Meal planner</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {mealPlanner.weekLabel}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Dinner planning reuses visible grocery rows so route choices stay tied to observed products, stores, and
            confidence rules.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<CalendarDays size={20} />} label="Meals" value={String(mealPlanner.plannedMeals)} />
          <Metric icon={<CircleDollarSign size={20} />} label="Target spend" value={mealPlanner.targetSpend} />
          <Metric icon={<ShoppingBasket size={20} />} label="Projected" value={mealPlanner.projectedSavings} />
          <Metric icon={<Store size={20} />} label="Stops" value="2+" />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Planning constraints</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {mealPlanner.constraints.map((constraint) => (
            <div key={constraint.label} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <span className="inline-flex items-center gap-1 rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black text-market-ink/70">
                <CheckCircle2 size={14} />
                {constraint.label}
              </span>
              <p className="mt-3 leading-6 text-market-ink/65">{constraint.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[0.7fr_1fr_1fr_auto] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Day</span>
          <span>Meal</span>
          <span>Store route</span>
          <span className="text-right">Total</span>
        </div>
        {mealPlanner.days.map((day) => (
          <Link
            key={day.day}
            href={day.href}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[0.7fr_1fr_1fr_auto]"
          >
            <span className="font-black">{day.day}</span>
            <span>
              <span className="block font-black">{day.meal}</span>
              <span className="mt-1 block text-market-ink/60">{day.basket}</span>
            </span>
            <span className="text-market-ink/65">{day.store}</span>
            <span className="text-right">
              <span className="block font-black tabular-nums">{day.total}</span>
              <span className="mt-1 block text-xs font-bold text-market-mint">{day.savings}</span>
            </span>
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
