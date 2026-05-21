import Link from 'next/link';
import { basketItems, formatSek } from '@/components/sample-data';
import { categories, dealOpportunityRail, products, weeklyBasket } from '@/lib/demo-data';

export const dynamic = 'force-static';

function parseSek(value: string): number {
  return Number(value.replace(' SEK', ''));
}

function productSlugFromName(name: string): string {
  const product = products.find((candidate) => candidate.name === name);
  return product?.slug ?? name.toLowerCase().replaceAll(' ', '-');
}

export default function WatchlistPage() {
  const watchedSlugs = new Set([
    ...basketItems.map((item) => productSlugFromName(item.name)),
    ...dealOpportunityRail.map((deal) => deal.productId)
  ]);
  const watchedProducts = products.filter((product) => watchedSlugs.has(product.slug));
  const basketTotal = weeklyBasket.reduce((sum, item) => sum + parseSek(item.total), 0);
  const fallingCategories = categories.filter((category) => category.movement.startsWith('-'));
  const urgentDeals = dealOpportunityRail.filter((deal) => deal.dealScore >= 85);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/products">Products</Link>
          <Link href="/stores">Stores</Link>
          <Link href="/weekly-basket">Weekly basket</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Watchlist</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          {watchedProducts.length} watched staples across {weeklyBasket.length} basket lines.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Tracks household staples from the weekly basket, ranked deal opportunities, and category movement.
          Prices below are backed by the demo grocery observations used across product and basket pages.
        </p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-lg border border-market-ink/10 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-market-ink/55">Current basket</div>
          <p className="mt-2 text-2xl font-black tabular-nums">{basketTotal.toFixed(2)} SEK</p>
          <p className="mt-1 text-xs text-market-ink/55">{weeklyBasket.length} real basket entries</p>
        </article>
        <article className="rounded-lg border border-market-ink/10 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-market-ink/55">Buy-now deals</div>
          <p className="mt-2 text-2xl font-black tabular-nums text-market-mint">{urgentDeals.length}</p>
          <p className="mt-1 text-xs text-market-ink/55">Deal Score 85 or higher</p>
        </article>
        <article className="rounded-lg border border-market-ink/10 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-market-ink/55">Falling categories</div>
          <p className="mt-2 text-2xl font-black tabular-nums">{fallingCategories.length}</p>
          <p className="mt-1 text-xs text-market-ink/55">Category indexes below baseline</p>
        </article>
        <article className="rounded-lg border border-market-ink/10 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-market-ink/55">Watch value</div>
          <p className="mt-2 text-2xl font-black tabular-nums">
            {formatSek(basketItems.reduce((sum, item) => sum + item.currentPrice, 0))}
          </p>
          <p className="mt-1 text-xs text-market-ink/55">sample-data tracked staples</p>
        </article>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-market-ink/10 bg-white">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
            <span>Watched product</span>
            <span>Store</span>
            <span>Price</span>
            <span>Signal</span>
          </div>
          <ul className="divide-y divide-market-ink/5">
            {basketItems.map((item) => {
              const delta = item.currentPrice - item.usualPrice;
              const slug = productSlugFromName(item.name);

              return (
                <li key={item.name} className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr] gap-3 px-4 py-3 text-sm hover:bg-market-oat/40">
                  <Link href={`/products/${slug}`} className="truncate font-semibold text-market-ink hover:text-market-mint" title={item.name}>
                    {item.name}
                  </Link>
                  <span className="truncate text-market-ink/65">{item.store}</span>
                  <span className="font-bold tabular-nums">{formatSek(item.currentPrice)}</span>
                  <span className={delta <= 0 ? 'font-bold text-market-mint' : 'font-bold text-amber-700'}>
                    {delta <= 0 ? '-' : '+'}{formatSek(Math.abs(delta))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-lg border border-market-ink/10 bg-white">
          <div className="border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
            Ranked deal alerts
          </div>
          <ul className="divide-y divide-market-ink/5">
            {dealOpportunityRail.map((deal) => (
              <li key={deal.productId} className="px-4 py-3 text-sm hover:bg-market-oat/40">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/products/${deal.productId}`} className="truncate font-black hover:text-market-mint" title={deal.productName}>
                    {deal.productName}
                  </Link>
                  <span className="text-sm font-black text-market-mint">{deal.dealScore}</span>
                </div>
                <p className="mt-1 text-market-ink/65">
                  {deal.storeName} · {deal.currentPrice.toFixed(2)} SEK · save {deal.priceDrop.toFixed(2)} SEK
                </p>
                <p className="mt-1 text-xs font-semibold text-market-ink/45">{deal.band.verdict}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_0.5fr_0.5fr_1fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Category</span>
          <span>Index</span>
          <span>Move</span>
          <span>Top deal</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {fallingCategories.map((category) => (
            <li key={category.slug} className="grid grid-cols-[1fr_0.5fr_0.5fr_1fr] gap-3 px-4 py-3 text-sm hover:bg-market-oat/40">
              <Link href={`/categories/${category.slug}`} className="font-semibold hover:text-market-mint">
                {category.name}
              </Link>
              <span className="tabular-nums text-market-ink/65">{category.index}</span>
              <span className="font-bold text-market-mint">{category.movement}</span>
              <span className="truncate text-market-ink/65">{category.topDeal}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
