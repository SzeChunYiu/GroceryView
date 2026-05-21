import Link from 'next/link';
import { BellRing, CheckCircle2, Clock, Target, WalletCards } from 'lucide-react';
import {
  buildWatchlistAlerts,
  planNotifications,
  type NotificationChannel,
  type NotificationEvent,
  type WatchlistPriceType
} from '@groceryview/core';
import { products, stores, watchlistAlerts } from '@/lib/demo-data';

export const dynamic = 'force-static';

const productBySlug = new Map(products.map((product) => [product.slug, product]));
const storeBySlug = new Map(stores.map((store) => [store.slug, store]));

function formatSek(value: number) {
  return `SEK ${value.toFixed(2)}`;
}

function statusTone(targetMet: boolean) {
  return targetMet ? 'bg-market-mint/15 text-market-ink/75' : 'bg-market-oat text-market-ink/60';
}

export default function WatchlistPage() {
  const watchlistCoreInput = buildWatchlistCoreInput();
  const coreAlerts = buildWatchlistAlerts(watchlistCoreInput);
  const plannedNotifications = planNotifications({
    now: '2026-05-21T09:00:00.000Z',
    preferences: {
      channels: notificationChannelsFromWatchlist(),
      enabledTypes: ['target_price'],
      quietHours: { startHour: 22, endHour: 7, timezone: 'Europe/Stockholm' }
    },
    events: coreAlerts.map(notificationEventFromAlert)
  });
  const targetMetCount = coreAlerts.filter((alert) => alert.type === 'target_price').length;
  const visibleUpside = watchlistAlerts.reduce(
    (sum, alert) => sum + Math.max(0, alert.usualPrice - alert.currentPrice),
    0
  );
  const bestAlert = watchlistAlerts.reduce((best, alert) => {
    const bestSaving = best.usualPrice - best.currentPrice;
    const alertSaving = alert.usualPrice - alert.currentPrice;
    return alertSaving > bestSaving ? alert : best;
  }, watchlistAlerts[0]);
  const bestProduct = productBySlug.get(bestAlert.productSlug);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/products/zoegas-coffee-450g">Products</Link>
          <Link href="/stores/willys-odenplan">Stores</Link>
          <Link href="/weekly-basket">Basket</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Price watchlist</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Target-price alerts tied to real Stockholm product rows.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Watchlist rules reuse the same observed products and store profiles as the market terminal, so shoppers can
            see current price, target price, allowed price types, confidence, and next action before an alert fires.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-1">
          <Metric icon={BellRing} label="Tracked rules" value={String(watchlistAlerts.length)} />
          <Metric icon={CheckCircle2} label="Targets met" value={String(targetMetCount)} />
          <Metric icon={WalletCards} label="Visible upside" value={formatSek(visibleUpside)} />
          <Metric icon={Clock} label="Planned sends" value={String(plannedNotifications.length)} />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Alert queue</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Each row links back to the product and store evidence that drives its watchlist decision.
            </p>
          </div>
          <div className="rounded-md bg-market-oat/45 p-3">
            <strong className="block text-2xl">{bestProduct?.name ?? bestAlert.productSlug}</strong>
            <span className="text-xs font-semibold text-market-ink/55">Best savings signal</span>
          </div>
        </div>
        <div className="hidden grid-cols-[1.2fr_0.85fr_0.65fr_0.65fr_0.9fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
          <span>Product</span>
          <span>Store</span>
          <span>Current</span>
          <span>Target</span>
          <span className="text-right">Status</span>
        </div>
        {watchlistAlerts.map((alert) => {
          const product = productBySlug.get(alert.productSlug);
          const store = storeBySlug.get(alert.storeSlug);
          const targetMet = alert.currentPrice <= alert.targetPrice;

          return (
            <article
              className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[1.2fr_0.85fr_0.65fr_0.65fr_0.9fr]"
              key={`${alert.productSlug}-${alert.storeSlug}`}
            >
              <div className="min-w-0">
                <Link href={`/products/${alert.productSlug}`} className="block truncate font-black hover:text-market-mint">
                  {product?.name ?? alert.productSlug}
                </Link>
                <p className="mt-2 leading-5 text-market-ink/65">{alert.nextAction}</p>
                <p className="mt-2 text-xs font-bold uppercase text-market-ink/45">
                  {alert.allowedPriceTypes.join(', ')} / {alert.confidence} confidence
                </p>
              </div>
              <Link href={`/stores/${alert.storeSlug}`} className="font-semibold text-market-ink/70 hover:text-market-mint">
                {store?.name ?? alert.storeSlug}
              </Link>
              <span className="font-black tabular-nums">{formatSek(alert.currentPrice)}</span>
              <span className="font-black tabular-nums">{formatSek(alert.targetPrice)}</span>
              <div className="md:text-right">
                <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-black uppercase ${statusTone(targetMet)}`}>
                  {targetMet ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Clock className="h-4 w-4" aria-hidden="true" />
                  )}
                  {alert.trigger}
                </span>
                <span className="mt-2 block text-xs font-bold uppercase text-market-ink/50">
                  {alert.channel} alert
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Notification plan</h2>
          <p className="mt-1 text-sm text-market-ink/60">
            Core watchlist alerts are routed through planNotifications before any push or email copy is shown.
          </p>
        </div>
        <div className="divide-y divide-market-ink/10">
          {plannedNotifications.map((notification) => (
            <article key={`${notification.title}-${notification.channel}`} className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1fr_auto_auto]">
              <span>
                <span className="block font-black">{notification.title}</span>
                <span className="mt-1 block text-market-ink/60">{notification.body}</span>
              </span>
              <span className="font-black uppercase text-market-mint">{notification.channel}</span>
              <span className="text-right tabular-nums text-market-ink/65">{notification.sendAt}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Guardrail icon={Target} label="Target price" detail="Only current prices at or below target can move into ready state." />
        <Guardrail icon={CheckCircle2} label="Confidence floor" detail="Medium and high confidence rows stay visible before household notifications." />
        <Guardrail icon={BellRing} label="Channel routing" detail="Push, email, and digest channels are shown before delivery rules are connected." />
      </section>
    </main>
  );
}

function buildWatchlistCoreInput() {
  return {
    watchlist: watchlistAlerts.map((alert) => ({
      productId: alert.productSlug,
      targetPrice: alert.targetPrice,
      favoriteStoresOnly: false,
      allowedPriceTypes: alert.allowedPriceTypes.map(toWatchlistPriceType)
    })),
    products: watchlistAlerts.map((alert) => {
      const product = productBySlug.get(alert.productSlug);
      const priceType = toWatchlistPriceType(alert.allowedPriceTypes[0] ?? 'shelf');
      const discountPercent = alert.usualPrice > 0
        ? Math.max(0, ((alert.usualPrice - alert.currentPrice) / alert.usualPrice) * 100)
        : 0;

      return {
        productId: alert.productSlug,
        productName: product?.name ?? alert.productSlug,
        bestPrice: alert.currentPrice,
        bestStoreId: alert.storeSlug,
        bestPriceType: priceType,
        prices: [{
          storeId: alert.storeSlug,
          storeName: storeBySlug.get(alert.storeSlug)?.name ?? alert.storeSlug,
          price: alert.currentPrice,
          priceType
        }],
        dealScore: Math.round(discountPercent),
        isNew52WeekLow: false
      };
    }),
    favoriteStoreIds: []
  };
}

function toWatchlistPriceType(value: string): WatchlistPriceType {
  const normalized = value.toLowerCase();
  if (normalized.includes('member')) return 'member';
  if (normalized.includes('promo') || normalized.includes('deal') || normalized.includes('clearance')) return 'promotion';
  if (normalized.includes('estimated')) return 'estimated';
  return 'shelf';
}

function notificationChannelsFromWatchlist(): NotificationChannel[] {
  const channels = new Set<NotificationChannel>();
  for (const alert of watchlistAlerts) {
    channels.add(alert.channel === 'push' ? 'push' : 'email');
  }
  return [...channels].sort();
}

function notificationEventFromAlert(alert: ReturnType<typeof buildWatchlistAlerts>[number]): NotificationEvent {
  return {
    type: 'target_price',
    title: `${alert.productName} watchlist alert`,
    body: alert.message,
    priority: alert.severity === 'urgent' ? 'high' : 'normal'
  };
}

function Metric({
  icon: Icon,
  label,
  value
}: Readonly<{ icon: typeof BellRing; label: string; value: string }>) {
  return (
    <article className="rounded-lg border border-market-ink/10 bg-white p-4">
      <Icon className="h-5 w-5 text-market-mint" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-market-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-market-ink">{value}</p>
    </article>
  );
}

function Guardrail({
  icon: Icon,
  label,
  detail
}: Readonly<{ icon: typeof Target; label: string; detail: string }>) {
  return (
    <article className="rounded-lg border border-market-ink/10 bg-white p-4">
      <Icon className="h-5 w-5 text-market-mint" aria-hidden="true" />
      <p className="mt-3 font-black text-market-ink">{label}</p>
      <p className="mt-1 text-sm leading-6 text-market-ink/60">{detail}</p>
    </article>
  );
}
