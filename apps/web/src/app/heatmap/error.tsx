'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type HeatmapErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function HeatmapError({ error, reset }: HeatmapErrorProps) {
  return (
    <PageShell>
      <Card className="p-6">
        <Eyebrow>Heatmap unavailable</Eyebrow>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">We couldn't load the price heatmap</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
          {error.message || 'The heatmap failed to render. Please try again.'}
        </p>
        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </Card>
    </PageShell>
  );
}
