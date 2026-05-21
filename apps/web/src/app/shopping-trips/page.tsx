import Link from 'next/link';
import { ArrowDownRight, MapPinned, Route, ShoppingBasket, Store } from 'lucide-react';
import {
  householdSavings,
  products,
  shoppingTripSwitchboard,
  storeComparisonBoard,
  stores
} from '@/lib/demo-data';

export const dynamic = 'force-static';

const storeSlugByName = new Map(stores.map((store) => [store.name, store.slug]));

function productForBasket(label: string) {
  const lower = label.toLowerCase();
  return products.find((product) => lower.includes(product.name.split(' ')[0].toLowerCase()));
}

export default function ShoppingTripsPage() {
  const totalSpend = shoppingTripSwitchboard.reduce((sum, trip) => {
    const value = Number(trip.spend.replace(/[^\d.-]/g, ''));
    return sum + value;
  }, 0);
  const bestSaving = shoppingTripSwitchboard.reduce((best, trip) => {
    const bestValue = Math.abs(Number(best.saving.replace(/[^\d.-]/g, '')));
    const tripValue = Math.abs(Number(trip.saving.replace(/[^\d.-]/g, '')));
    return tripValue > bestValue ? trip : best;
  }, shoppingTripSwitchboard[0]);

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
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Shopping trips</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Route-ready grocery trips from live basket signals.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Each trip card is backed by the same Stockholm product, store, category, spend, and savings rows already
            visible in the GroceryView market terminal.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<Route size={20} />} label="Trip options" value={String(shoppingTripSwitchboard.length)} />
          <Metric icon={<ShoppingBasket size={20} />} label="Visible spend" value={`${totalSpend.toFixed(2)} SEK`} />
          <Metric icon={<ArrowDownRight size={20} />} label="Best saving" value={bestSaving.saving} />
          <Metric icon={<MapPinned size={20} />} label="Weekly delta" value={householdSavings.vsLastWeek} />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Trip switchboard</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Store stops stay linked to their source route while basket contents expose concrete product rows.
            </p>
          </div>
          <span className="rounded-md bg-market-oat/45 p-3 text-sm font-black text-market-ink">
            {bestSaving.title}
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          {shoppingTripSwitchboard.map((trip) => {
            const storeSlug = storeSlugByName.get(trip.store);
            const product = productForBasket(trip.basket);

            return (
              <article key={trip.title} className="border-b border-market-ink/10 px-4 py-5 text-sm lg:border-r">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="block text-xs font-bold uppercase text-market-ink/50">{trip.area}</span>
                    <h2 className="mt-1 text-xl font-black">{trip.title}</h2>
                  </div>
                  <span className="rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black text-market-ink/70">
                    {trip.saving}
                  </span>
                </div>

                <dl className="mt-5 grid gap-3 text-xs font-semibold text-market-ink/60 sm:grid-cols-2">
                  <TripFact label="Store" value={trip.store} />
                  <TripFact label="Category" value={trip.category} />
                  <TripFact label="Basket" value={trip.basket} />
                  <TripFact label="Spend" value={trip.spend} />
                </dl>

                <p className="mt-4 leading-6 text-market-ink/65">{trip.decision}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={trip.href}
                    className="rounded-md bg-market-ink px-3 py-2 text-xs font-black uppercase text-white hover:bg-market-mint hover:text-market-ink"
                  >
                    Open route
                  </Link>
                  {storeSlug ? (
                    <Link
                      href={`/stores/${storeSlug}`}
                      className="rounded-md bg-market-oat px-3 py-2 text-xs font-black uppercase text-market-ink/70 hover:text-market-mint"
                    >
                      Store profile
                    </Link>
                  ) : null}
                  {product ? (
                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-md bg-market-oat px-3 py-2 text-xs font-black uppercase text-market-ink/70 hover:text-market-mint"
                    >
                      {product.ticker}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-market-mint" aria-hidden="true" />
            <h2 className="text-lg font-black">Comparison routes</h2>
          </div>
          <p className="mt-1 text-sm text-market-ink/60">
            Store comparisons give each trip a second-stop check before shoppers commit.
          </p>
        </div>
        <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3">
          {storeComparisonBoard.slice(0, 6).map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/stores/${comparison.primaryStoreSlug}`}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block text-xs font-bold uppercase text-market-ink/50">{comparison.area}</span>
              <span className="mt-1 block font-black">{comparison.basketFocus}</span>
              <span className="mt-2 block text-market-ink/60">{comparison.primaryStoreName}</span>
              <span className="mt-3 block font-black text-market-mint">{comparison.basketImpact}</span>
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
      <strong className="mt-4 block text-2xl font-black tabular-nums">{value}</strong>
    </div>
  );
}

function TripFact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-3">
      <dt className="text-market-ink/45">{label}</dt>
      <dd className="mt-1 font-black text-market-ink">{value}</dd>
    </div>
  );
}
