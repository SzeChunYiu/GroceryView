import Link from 'next/link';
import { BellRing } from 'lucide-react';

type WatchlistItem = { name: string; store: string; deal: string };

const watchedProducts: WatchlistItem[] = [];
const watchlistDeals: WatchlistItem[] = [];
const trackedStores: string[] = [];

export default function WatchlistPage() {
  const hasContent = watchedProducts.length + watchlistDeals.length + trackedStores.length > 0;

  if (!hasContent) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <BellRing className="h-12 w-12 text-zinc-400" aria-hidden="true" />
        <h1 className="text-3xl font-semibold text-zinc-900">No watchlist activity yet</h1>
        <p className="max-w-2xl text-sm text-zinc-600">Add products and stores to your watchlist to see active alerts and deal signals here.</p>
        <Link href="/products" className="text-sm font-semibold text-emerald-700 underline">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Watchlist</h1>
      <p className="mt-2 text-sm text-zinc-600">Monitor price alerts for your tracked products and stores.</p>
      <ul className="mt-6 space-y-3">
        {watchedProducts.map((item) => (
          <li className="rounded-lg border border-zinc-200 p-4" key={`${item.name}-${item.store}`}>
            <p className="font-semibold text-zinc-900">{item.name}</p>
            <p className="text-sm text-zinc-600">{item.store}</p>
            <p className="text-sm text-zinc-600">{item.deal}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
