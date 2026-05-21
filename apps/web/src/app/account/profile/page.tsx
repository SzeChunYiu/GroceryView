import Link from 'next/link';
import { CheckCircle2, Home, ShieldCheck, Store, UserRound } from 'lucide-react';
import { accountProfile } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function AccountProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/account">Account</Link>
          <Link href="/weekly-basket">Basket</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Account profile</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {accountProfile.shopperName}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Saved grocery preferences connect budget, substitution rules, privacy settings, and the default store for
            weekly planning.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<UserRound size={20} />} label="Complete" value={accountProfile.profileCompleteness} />
          <Metric icon={<Home size={20} />} label="Home area" value={accountProfile.homeDistrict} />
          <Metric icon={<Store size={20} />} label="Default store" value={accountProfile.preferredStore} />
          <Metric icon={<ShieldCheck size={20} />} label="Weekly budget" value={accountProfile.weeklyBudget} />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Shopping preferences</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {accountProfile.preferences.map((preference) => (
            <div key={preference.label} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <div className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-xs font-bold uppercase text-market-ink/50">{preference.label}</span>
                  <span className="mt-2 block font-black">{preference.value}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black text-market-ink/70">
                  <CheckCircle2 size={14} />
                  {preference.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Connected routes</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {accountProfile.routeLinks.map((route) => (
            <Link
              key={route.label}
              href={route.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block font-black">{route.label}</span>
              <span className="mt-2 block leading-6 text-market-ink/60">{route.detail}</span>
            </Link>
          ))}
        </div>
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
