'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

export default function NutritionValueError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageShell>
      <Eyebrow>Nutrition per krona</Eyebrow>
      <Card className="mt-6 border-rose-200 bg-rose-50/70">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Nutrition value could not load</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
          {error.message || 'Something went wrong while loading nutrition value rankings.'}
        </p>
        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </Card>
    </PageShell>
  );
}
