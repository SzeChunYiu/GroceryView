import Link from 'next/link';
import { BadgePercent, ClipboardCheck, ReceiptText, ShoppingBasket } from 'lucide-react';
import { couponStackCenter } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function CouponStacksPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/weekly-basket">Basket</Link>
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/price-reports">Reports</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Coupon stacks</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {couponStackCenter.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">{couponStackCenter.headline}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<BadgePercent size={20} />} label="Stacks" value={String(couponStackCenter.stacks.length)} />
          <Metric icon={<ClipboardCheck size={20} />} label="Ready" value={String(couponStackCenter.readyStacks)} />
          <Metric icon={<ReceiptText size={20} />} label="Watch" value={String(couponStackCenter.watchStacks)} />
          <Metric icon={<ShoppingBasket size={20} />} label="Freshness" value={couponStackCenter.freshnessWindow} />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">{couponStackCenter.rulesTitle}</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {couponStackCenter.rules.map((rule) => (
            <div key={rule.label} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <span className="block text-xs font-bold uppercase text-market-ink/50">{rule.label}</span>
              <span className="mt-2 block leading-6 text-market-ink/65">{rule.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Stack</span>
          <span>State</span>
          <span className="text-right">Final</span>
        </div>
        {couponStackCenter.stacks.map((stack) => (
          <article
            key={stack.title}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_auto_auto]"
          >
            <div>
              <Link href={`/products/${stack.productSlug}`} className="block font-black hover:text-market-mint">
                {stack.productName}
              </Link>
              <Link href={`/stores/${stack.storeSlug}`} className="mt-1 block text-xs font-bold text-market-ink/55">
                {stack.storeName} · {stack.basePrice}
              </Link>
              <p className="mt-2 leading-5 text-market-ink/65">{stack.nextAction}</p>
              <p className="mt-2 text-xs font-bold uppercase text-market-ink/45">
                {stack.coupon} · {stack.memberPrice}
              </p>
            </div>
            <span className="font-black uppercase text-market-ink/65">{stack.stackState}</span>
            <span className="text-right">
              <span className="block font-black tabular-nums">{stack.finalPrice}</span>
              <span className="mt-1 block text-xs font-bold text-market-mint">{stack.basketImpact}</span>
            </span>
          </article>
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
