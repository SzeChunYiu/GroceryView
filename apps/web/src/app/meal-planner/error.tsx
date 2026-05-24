'use client';

import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type MealPlannerErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MealPlannerError({ error, reset }: MealPlannerErrorProps) {
  return (
    <PageShell>
      <Eyebrow>Meal planner unavailable</Eyebrow>
      <Card className="mt-4 border-rose-200 bg-rose-50">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">We could not load the meal planner</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          {error.message || 'The meal planner hit an unexpected error. Please try again.'}
        </p>
        <button
          className="mt-5 rounded-full bg-rose-700 px-5 py-3 text-sm font-black text-white hover:bg-rose-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </Card>
    </PageShell>
  );
}
