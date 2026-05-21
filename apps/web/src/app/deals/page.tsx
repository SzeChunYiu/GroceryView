import Link from 'next/link';
import { AlertTriangle, BadgePercent, Clock, Store } from 'lucide-react';
import { buildExpiryDealRadar } from '@groceryview/core';
import { expiryDealReports } from '@/lib/demo-data';

export const dynamic = 'force-static';

const RADAR_NOW = '2026-05-21T09:00:00.000Z';

export default function DealsPage() {
  const radar = buildExpiryDealRadar({
    reports: expiryDealReports,
    now: RADAR_NOW,
    maxDistanceKm: 4
  });
  const itemCount = radar.stores.reduce((sum, store) => sum + store.items.length, 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/weekly-basket">Basket</Link>
          <Link href="/map">Map</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Expiry deal radar</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Verified markdowns before shelf life runs out.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Built with buildExpiryDealRadar from visible report rows: expiry time, markdown depth,
            distance, photo/verification counts, and stale evidence are all kept explicit.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<Store size={20} />} label="Stores" value={String(radar.stores.length)} />
          <Metric icon={<BadgePercent size={20} />} label="Active markdowns" value={String(itemCount)} />
          <Metric icon={<AlertTriangle size={20} />} label="Alerts" value={String(radar.alerts.length)} />
          <Metric icon={<Clock size={20} />} label="Stale reports" value={String(radar.staleReportIds.length)} />
        </div>
      </section>

      {radar.alerts.length > 0 ? (
        <section className="rounded-lg border border-market-mint/30 bg-market-mint/10 p-4">
          <h2 className="text-lg font-black">Radar alerts</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {radar.alerts.map((alert) => (
              <Link key={alert.reportId} href={`/products/${alert.productId}`} className="rounded-md bg-white p-3 text-sm font-semibold hover:bg-market-oat/45">
                {alert.message}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        {radar.stores.map((store) => (
          <article key={store.storeId} className="rounded-lg border border-market-ink/10 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 px-4 py-3">
              <div>
                <h2 className="text-xl font-black">{store.storeName}</h2>
                <p className="text-sm text-market-ink/60">Top markdown {store.topMarkdownPercent}%</p>
              </div>
              <Link href={`/stores/${store.storeId}`} className="rounded-md bg-market-oat px-3 py-2 text-sm font-black hover:bg-market-mint">
                Store page
              </Link>
            </div>
            <div className="divide-y divide-market-ink/10">
              {store.items.map((item) => (
                <Link key={item.id} href={`/products/${item.productId}`} className="grid gap-3 px-4 py-4 text-sm hover:bg-market-oat/45 md:grid-cols-[1fr_auto_auto_auto]">
                  <span>
                    <span className="block font-black">{item.productName}</span>
                    <span className="mt-1 block text-market-ink/60">
                      {item.urgency.replace('_', ' ')} · {item.verification.replace('_', ' ')} · expires in {item.hoursUntilExpiry}h
                    </span>
                  </span>
                  <span className="font-black tabular-nums text-market-mint">{item.markdownPercent}% off</span>
                  <span className="tabular-nums text-market-ink/65">Save {item.savings.toFixed(2)} kr</span>
                  <span className="text-right font-black tabular-nums">Score {item.radarScore}</span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      {radar.staleReportIds.length > 0 ? (
        <section className="rounded-lg border border-market-ink/10 bg-white p-4 text-sm text-market-ink/65">
          <strong className="text-market-ink">Stale evidence held back:</strong> {radar.staleReportIds.join(', ')}.
        </section>
      ) : null}
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
