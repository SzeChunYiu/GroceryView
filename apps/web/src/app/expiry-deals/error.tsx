'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

export default function ExpiryDealsError({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <PageShell>
      <Card className="border-amber-200 bg-amber-50">
        <Eyebrow>Expiry deal radar</Eyebrow>
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight text-amber-950">Near-expiry radar could not load</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-amber-950">
          Runtime data, product links, or source evidence failed before the radar could render. Retry the route to rebuild the timestamped near-expiry board.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-900">
            Error digest {error.digest}
          </p>
        ) : null}
        <button
          className="mt-5 rounded-full bg-amber-900 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          onClick={reset}
          type="button"
        >
          Retry expiry radar
        </button>
      </Card>
    </PageShell>
  );
}
