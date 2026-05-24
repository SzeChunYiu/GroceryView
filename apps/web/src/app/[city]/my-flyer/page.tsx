import type { Metadata } from 'next';
import { MyFlyerPushOptIn } from '@/components/my-flyer-push-opt-in';
import { axfoodProducts } from '@/lib/axfood-products';
import './print-import.css';

type MyFlyerPageProps = Readonly<{ params: Promise<{ city: string }> }>;

const visibleChains = ['willys', 'hemkop'] as const;
const generatedAt = '2026-05-24';

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

function maxFlyerSavings(rows: ReadonlyArray<{ offer: ReturnType<typeof printablePrice> }>) {
  return rows.reduce((maxSavings, row) => Math.max(maxSavings, row.offer.savings ?? 0), 0);
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
  const maxSavings = maxFlyerSavings(flyerProducts);
  const flyerVersion = `${city || 'se'}-${generatedAt}-${flyerProducts.length}-${Math.round(maxSavings)}`;

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

        <div aria-label="Sponsored placement" className="my-flyer-ad mb-6 rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-4 text-sm font-bold text-orange-800" data-ad data-print-hide>
          Screen-only promo rail hidden by the MyFlyer print stylesheet.
        </div>

        <MyFlyerPushOptIn dealCount={flyerProducts.length} flyerVersion={flyerVersion} maxSavingsKr={maxSavings} />

        <section className="my-flyer-print-grid grid gap-4 lg:grid-cols-2">
          {flyerProducts.map(({ product, offer }) => (
            <article className="my-flyer-product-card rounded-[1.5rem] border border-stone-300 bg-white p-4 shadow-sm" key={product.code}>
              <div className="my-flyer-product-media rounded-2xl bg-stone-50 p-4">
                <img alt="" className="my-flyer-product-image mx-auto h-36 w-full object-contain" src={product.image ?? ''} />
              </div>
              <div className="my-flyer-product-content pt-4">
                <p className="my-flyer-product-brand text-xs font-black uppercase tracking-[0.18em] text-orange-700">{product.brand}</p>
                <h2 className="my-flyer-product-name mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">{product.name}</h2>
                <p className="my-flyer-product-subline mt-1 text-sm font-semibold text-slate-600">{product.subline}</p>
                <div className="my-flyer-product-price-row mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="my-flyer-product-store text-xs font-black uppercase tracking-[0.16em] text-slate-500">{offer.chain}</p>
                    <p className="my-flyer-product-price text-4xl font-black tracking-[-0.06em] text-slate-950">{offer.priceText}</p>
                    <p className="my-flyer-product-unit text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{offer.unit}</p>
                  </div>
                  {offer.savings ? <p className="my-flyer-product-saving rounded-full bg-lime-200 px-3 py-1 text-sm font-black">Save {offer.savings.toFixed(0)} kr</p> : null}
                </div>
                <p className="my-flyer-product-source mt-3 text-xs font-semibold text-slate-500">Observed Axfood catalogue data · {product.code}</p>
              </div>
            </article>
          ))}
        </section>

        <p className="my-flyer-print-note mt-6 text-sm font-semibold text-slate-600">
          Print mode hides navigation and advertising elements, keeps source identifiers visible, and expands product images inside each deal card for easier shelf matching.
        </p>
      </section>
    </main>
  );
}
