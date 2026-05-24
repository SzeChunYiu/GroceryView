'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type StoreDetailErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function StoreDetailError({ error, reset }: StoreDetailErrorProps) {
  const message = error.message || 'The store detail page could not be loaded.';

  return (
    <PageShell>
      <Eyebrow>Store detail error</Eyebrow>
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h1 className="text-3xl font-black tracking-tight text-amber-950">We could not load this store</h1>
        <p className="mt-4 leading-7 text-amber-950" role="alert">
          {message}
        </p>
        <button
          className="mt-6 rounded-full bg-amber-950 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-offset-2"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </Card>
    </PageShell>
  );
}
