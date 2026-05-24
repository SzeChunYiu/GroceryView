'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

export default function IndexSymbolError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const message = error.message || 'The index page could not be loaded. Please try again.';

  return (
    <PageShell>
      <Card>
        <Eyebrow>Index error</Eyebrow>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Unable to load this index</h1>
        <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-700">{message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
        >
          Try again
        </button>
      </Card>
    </PageShell>
  );
}
