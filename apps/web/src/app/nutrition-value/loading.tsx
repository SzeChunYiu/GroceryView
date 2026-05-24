import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageShell>
      <Eyebrow>Nutrition per krona</Eyebrow>
      <Skeleton className="mt-2 h-12 max-w-2xl" />
      <div className="mt-3 max-w-3xl space-y-2">
        <Skeleton className="h-5" />
        <Skeleton className="h-5 w-5/6" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-12 w-28" />
            <Skeleton className="mt-4 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-2/3" />
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <Skeleton className="h-8 w-72" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="rounded-2xl border border-slate-200 p-4" key={index}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="ml-auto h-9 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-8 w-64" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
