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
        <Eyebrow>Expiry radar</Eyebrow>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-amber-950">Expiry deals could not be loaded</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-950">
          The verified expiry-deal radar hit a runtime issue while reading deal data or opening a product link. Try again to
          refresh the radar.
        </p>
        {error.digest ? <p className="mt-3 text-xs font-semibold text-amber-800">Error reference: {error.digest}</p> : null}
        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900"
          onClick={reset}
          type="button"
        >
          Retry expiry radar
        </button>
      </Card>
    </PageShell>
  );
}
