import Link from 'next/link';
import { axfoodProducts } from '@/lib/axfood-products';

export const dynamic = 'force-static';

const CHAIN_LABEL: Record<string, string> = { willys: 'Willys', hemkop: 'Hemköp' };

export default function ComparePage() {
  const crossChain = axfoodProducts.filter((p) => p.inChains.length >= 2);
  const sorted = [...crossChain].sort((a, b) => b.spreadPct - a.spreadPct);
  const avgSpread =
    crossChain.reduce((s, p) => s + p.spreadPct, 0) / Math.max(1, crossChain.length);
  const cheaperOnWillys = crossChain.filter((p) => p.lowestChain === 'willys').length;
  const cheaperOnHemkop = crossChain.filter((p) => p.lowestChain === 'hemkop').length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/stores">Stores</Link>
          <Link href="/products">Products</Link>
          <Link href="/categories">Categories</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Per-chain price comparison</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          {crossChain.length.toLocaleString()} products priced at both Willys and Hemköp.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Real live prices scraped from the chains&rsquo; own product-search endpoints.
          Of these {crossChain.length} cross-chain matches, <strong>{cheaperOnWillys}</strong> are
          cheapest at Willys and <strong>{cheaperOnHemkop}</strong> at Hemköp; average spread is{' '}
          <strong>{avgSpread.toFixed(1)}%</strong>. Both chains share the Axfood backend, so the
          comparison is apples-to-apples (same EAN code).
        </p>
      </header>

      <section className="mb-6 rounded-lg border border-market-ink/10 bg-market-oat/30 p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Cheapest chain per product</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {sorted.slice(0, 6).map((p) => (
            <article key={p.code} className="rounded-md border border-market-ink/10 bg-white p-3">
              <div className="truncate font-black" title={p.name}>{p.name}</div>
              <div className="mt-1 text-sm text-market-ink/60">
                Cheapest at {CHAIN_LABEL[p.lowestChain] || p.lowestChain} · {p.spreadPct.toFixed(1)}% spread
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <span className={p.lowestChain === 'willys' ? 'font-black text-market-mint' : 'text-market-ink/65'}>
                  Willys {p.chains.willys?.price != null ? `${p.chains.willys.price.toFixed(2)} kr` : '—'}
                </span>
                <span className={p.lowestChain === 'hemkop' ? 'font-black text-market-mint' : 'text-market-ink/65'}>
                  Hemköp {p.chains.hemkop?.price != null ? `${p.chains.hemkop.price.toFixed(2)} kr` : '—'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_0.6fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Product</span>
          <span className="text-right">Willys</span>
          <span className="text-right">Hemköp</span>
          <span className="text-right">Cheapest</span>
          <span className="text-right">Spread</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {sorted.slice(0, 300).map((p) => (
            <li key={p.code} className="grid grid-cols-[2.5fr_1fr_1fr_1fr_0.6fr] gap-3 px-4 py-2 text-sm">
              <span className="truncate font-semibold" title={p.name}>
                {p.name}
                {p.subline ? <span className="ml-2 text-xs text-market-ink/45">{p.subline}</span> : null}
              </span>
              <span className="text-right tabular-nums text-market-ink/70">
                {p.chains.willys?.price != null ? `${p.chains.willys.price.toFixed(2)} kr` : '—'}
              </span>
              <span className="text-right tabular-nums text-market-ink/70">
                {p.chains.hemkop?.price != null ? `${p.chains.hemkop.price.toFixed(2)} kr` : '—'}
              </span>
              <span className="text-right font-bold text-market-mint">
                {CHAIN_LABEL[p.lowestChain] || p.lowestChain}
              </span>
              <span className="text-right font-bold tabular-nums">{p.spreadPct.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
        {sorted.length > 300 && (
          <p className="px-4 py-3 text-xs text-market-ink/55">
            Showing top 300 of {sorted.length.toLocaleString()} cross-chain matches by spread.
          </p>
        )}
      </section>
    </main>
  );
}
