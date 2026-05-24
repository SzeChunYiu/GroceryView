'use client';

import { Card, PageShell } from '@/components/data-ui';

type ExpiryDealsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ExpiryDealsError({ error, reset }: ExpiryDealsErrorProps) {
  const message = error.message || 'The expiry deal radar could not be loaded.';

  return (
    <PageShell>
      <Card className="border-red-200 bg-red-50">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">Expiry deal radar</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Something went wrong</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{message}</p>
        <button
          className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-slate-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </Card>
    </PageShell>
  );
}
