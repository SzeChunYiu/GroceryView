'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// maplibre-gl touches the DOM, so render the map on the client only.
const StoreMap = dynamic(() => import('@/components/store-map').then((m) => m.StoreMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-market-oat/30 text-sm text-market-ink/50">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-market-ink/10 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight">
            GroceryView
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-market-ink/70">
            <Link href="/stores" className="hover:text-market-mint">
              Store list
            </Link>
            <Link href="/products/zoegas-coffee-450g" className="hover:text-market-mint">
              Products
            </Link>
            <Link href="/categories/coffee" className="hover:text-market-mint">
              Categories
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-market-ink/10 bg-white px-4 pb-3">
        <div className="mx-auto max-w-6xl">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">
            Stockholm grocery map
          </div>
          <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
            Every grocery store on one map.
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-market-ink/60">
            Pan and zoom to explore supermarkets across Stockholm county, coloured by chain index score.
            The heat layer highlights districts where nearby chains skew cheaper or pricier. Click a store
            for details and directions. Coverage © OpenStreetMap contributors.
          </p>
        </div>
      </div>

      <main className="relative flex-1">
        <StoreMap />
      </main>
    </div>
  );
}
