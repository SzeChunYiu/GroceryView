'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type ScreenerErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ScreenerError({ error, reset }: ScreenerErrorProps) {
  return (
    <PageShell>
      <Eyebrow>Deal screener</Eyebrow>
      <Card className="mt-4 border-rose-200 bg-rose-50">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-800">Screener unavailable</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-rose-950">We could not load the deal screener</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-rose-900">
          The screener hit a runtime error before verified deal rows could render. Retry to reload the route without falling back to the generic app error.
        </p>
        <button className="mt-5 rounded-full bg-rose-950 px-4 py-2 text-sm font-black text-white shadow-sm" onClick={reset} type="button">
          Retry screener
        </button>
        {error.digest ? <p className="mt-3 text-xs font-semibold text-rose-800">Error digest: {error.digest}</p> : null}
      </Card>
    </PageShell>
  );
}
