import Link from 'next/link';
import { ArrowDownRight, CircleDollarSign, MapPinned, ShoppingBasket } from 'lucide-react';
import { savingsDashboard } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function SavingsDashboardPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/weekly-basket">Basket</Link>
          <Link href="/products">Products</Link>
          <Link href="/stores">Stores</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Savings dashboard</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Household savings by basket, district, and watchpoint.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            The page translates grocery observations into month-to-date avoided spend and next shopping moves.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<CircleDollarSign size={20} />} label="Avoided spend" value={savingsDashboard.monthToDate.avoidedSpend} />
          <Metric icon={<ShoppingBasket size={20} />} label="Baskets tracked" value={String(savingsDashboard.monthToDate.basketCount)} />
          <Metric icon={<ArrowDownRight size={20} />} label="Planned spend" value={savingsDashboard.monthToDate.plannedSpend} />
          <Metric icon={<MapPinned size={20} />} label="Best district" value={savingsDashboard.monthToDate.bestDistrict} />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Priority watchpoints</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {savingsDashboard.watchpoints.map((point) => (
            <Link
              key={point.label}
              href={point.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block text-xs font-bold uppercase text-market-ink/50">{point.label}</span>
              <span className="mt-2 block text-xl font-black">{point.product}</span>
              <span className="mt-1 block font-semibold text-market-ink/60">{point.store}</span>
              <span className="mt-3 block font-black text-market-mint">{point.signal}</span>
              <span className="mt-3 block leading-6 text-market-ink/65">{point.action}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>District</span>
          <span>Planned</span>
          <span>Avoided</span>
        </div>
        {savingsDashboard.districtSavings.map((row) => (
          <div key={row.district} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0">
            <span>
              <span className="block font-black">{row.district}</span>
              <span className="mt-1 block text-market-ink/60">{row.driver}</span>
            </span>
            <span className="font-bold tabular-nums">{row.planned}</span>
            <span className="font-black tabular-nums text-market-mint">{row.avoided}</span>
          </div>
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
