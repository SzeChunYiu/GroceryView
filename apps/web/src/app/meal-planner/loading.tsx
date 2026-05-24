import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

export default function MealPlannerLoading() {
  return (
    <PageShell>
      <Eyebrow>Deal-based meals</Eyebrow>
      <Skeleton className="mt-2 h-12 max-w-3xl" />
      <div className="mt-3 max-w-3xl space-y-2">
        <Skeleton className="h-5" />
        <Skeleton className="h-5 w-5/6" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        {['suggestions', 'budget', 'confidence'].map((card) => (
          <Card key={card}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-12 w-28" />
            <Skeleton className="mt-3 h-4 w-52" />
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-4 space-y-4">
          {['first', 'second', 'third'].map((meal) => (
            <div className="rounded-3xl border border-slate-200 p-5" key={meal}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-56 flex-1 space-y-2">
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-4 w-72 max-w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {['protein', 'pantry', 'vegetable'].map((ingredient) => (
                  <div className="rounded-2xl bg-slate-50 p-4" key={ingredient}>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
