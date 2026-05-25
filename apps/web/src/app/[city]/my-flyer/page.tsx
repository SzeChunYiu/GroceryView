import type { Metadata } from 'next';
import { AlgorithmPicker } from '@/components/algorithm-picker';
import { MyFlyerPushActions } from '@/components/my-flyer-push-actions';
import { axfoodProducts } from '@/lib/axfood-products';
import { MyFlyerPreferences } from './my-flyer-preferences';
import { MyFlyerOffers } from './my-flyer-offers';
import './print-import.css';

type MyFlyerPageProps = Readonly<{ params: Promise<{ city: string }> }>;

const visibleChains = ['willys', 'hemkop'] as const;
const generatedAt = '2026-05-24';
const notificationVapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function titleCaseSegment(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function printablePrice(product: (typeof axfoodProducts)[number]) {
  const chain = visibleChains.find((candidate) => product.chains[candidate]);
  const price = chain ? product.chains[chain] : Object.values(product.chains)[0];
  return {
    chain: chain ? chain.charAt(0).toUpperCase() + chain.slice(1) : product.lowestChain,
    priceText: price?.priceText || `${product.lowestPrice.toFixed(2)} kr`,
    unit: price?.priceUnit || 'kr/st',
    savings: price?.savings ?? null
  };
}

const flyerProducts = axfoodProducts
  .filter((product) => product.image && product.lowestPrice > 0)
  .slice(0, 8)
  .map((product) => ({ product, offer: printablePrice(product) }));

export async function generateMetadata({ params }: MyFlyerPageProps): Promise<Metadata> {
  const { city } = await params;
  const marketName = titleCaseSegment(city || 'se');
  return {
    title: `${marketName} MyFlyer | GroceryView`,
    description: 'A printable two-column GroceryView flyer with expanded product images and print-only offer cards.'
  };
}

export default async function MyFlyerPage({ params }: MyFlyerPageProps) {
  const { city } = await params;
  const marketName = titleCaseSegment(city || 'se');
  const totalSavings = flyerProducts.reduce((sum, row) => sum + (row.offer.savings ?? 0), 0);

  return (
    <main className="my-flyer-page min-h-screen bg-[#f4efe5] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="my-flyer-shell mx-auto max-w-6xl rounded-[2rem] border border-stone-300 bg-[#fffdf7] p-5 shadow-2xl shadow-stone-300/50 sm:p-8">
        <div className="my-flyer-screen-only mb-6 flex flex-wrap items-center justify-between gap-3" data-print-hide>
          <a className="text-sm font-black uppercase tracking-[0.2em] text-orange-700" href="/">
            GroceryView
          </a>
          <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-black uppercase tracking-[0.14em] text-white" type="button">
            Print flyer
          </button>
        </div>

        <header className="my-flyer-print-header grid gap-6 border-b-4 border-slate-950 pb-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="my-flyer-print-kicker text-sm font-black uppercase tracking-[0.22em] text-orange-700">Personal weekly flyer</p>
            <h1 className="my-flyer-title mt-3 text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-7xl">
              {marketName} MyFlyer
            </h1>
            <p className="my-flyer-intro mt-4 max-w-2xl text-lg font-medium leading-7 text-slate-700">
              Print-ready offers ranked from observed Swedish grocery prices. The print stylesheet condenses the view into a compact two-column grid and enlarges product pack shots for aisle checks.
            </p>
          </div>
          <div className="my-flyer-print-date rounded-3xl border-2 border-slate-950 bg-orange-100 p-5 text-right font-black uppercase tracking-[0.16em] text-slate-800">
            <span className="block text-xs text-slate-600">Generated</span>
            <span className="block text-2xl tracking-tight text-slate-950">{generatedAt}</span>
            <span className="my-flyer-print-meta mt-2 block text-xs">{flyerProducts.length} offers</span>
          </div>
        </header>

        <section className="my-flyer-print-summary my-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-stone-300 bg-white p-5">
            <strong className="text-3xl font-black">{flyerProducts.length}</strong>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Printable deals</span>
          </div>
          <div className="rounded-3xl border border-stone-300 bg-white p-5">
            <strong className="text-3xl font-black">{totalSavings.toFixed(0)} kr</strong>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Tagged savings</span>
          </div>
          <div className="rounded-3xl border border-stone-300 bg-white p-5">
            <strong className="text-3xl font-black">2 col</strong>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Print layout</span>
          </div>
        </section>

        <MyFlyerPreferences defaultCountry="se" defaultAlgorithm="watchlist_first" />

        <MyFlyerPushActions
          city={city}
          country="se"
          defaultAlgorithm="watchlist_first"
          limit={flyerProducts.length}
          vapidPublicKey={notificationVapidPublicKey}
        />

        <div className="my-flyer-screen-only mb-6" data-print-hide>
          <AlgorithmPicker
            allowedAlgorithms={['watchlist_first', 'best_savings', 'best_unit_price']}
            defaultSelected="watchlist_first"
          />
        </div>

        <div aria-label="Sponsored placement" className="my-flyer-ad mb-6 rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-4 text-sm font-bold text-orange-800" data-ad data-print-hide>
          Screen-only promo rail hidden by the MyFlyer print stylesheet.
        </div>

        <div className="my-flyer-print-filter-anchor">
          <MyFlyerOffers rows={flyerProducts} />
        </div>

        <p className="my-flyer-print-note mt-6 text-sm font-semibold text-slate-600">
          Print mode hides navigation and advertising elements, keeps source identifiers visible, and expands product images inside each deal card for easier shelf matching.
        </p>
      </section>
    </main>
  );
}
