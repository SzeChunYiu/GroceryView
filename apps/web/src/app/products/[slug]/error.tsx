'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type ProductErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ProductError({ error, reset }: ProductErrorProps) {
  const message = error.message || 'We could not load this product detail right now.';

  return (
    <PageShell>
      <Eyebrow>Product detail error</Eyebrow>
      <Card className="mt-4 border-rose-200 bg-rose-50/80">
        <h1 className="text-3xl font-black tracking-tight text-rose-950">Unable to load product detail</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-rose-900">{message}</p>
        <button
          className="mt-6 rounded-full bg-rose-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </Card>
    </PageShell>
  );
}
