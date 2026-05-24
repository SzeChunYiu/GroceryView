'use client';

import Link from 'next/link';

export default function WatchlistError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message || 'Something went wrong while loading your watchlist.';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-start gap-4 px-6 py-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Watchlist</p>
      <h1 className="text-3xl font-semibold text-zinc-900">Watchlist is unavailable right now</h1>
      <p className="max-w-xl text-sm text-zinc-600">{message}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
          onClick={reset}
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
