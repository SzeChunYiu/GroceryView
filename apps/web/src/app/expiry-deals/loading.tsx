import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

const statCards = ['Active deals', 'Radar alerts', 'Stores', 'Stale reports'];
const boardRows = ['deal-card-1', 'deal-card-2', 'deal-card-3'];
const staleRows = ['stale-report-1', 'stale-report-2'];

export default function ExpiryDealsLoading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>Expiry deal radar</Eyebrow>
          <Skeleton className="mt-2 h-12 w-full max-w-3xl" />
          <div className="mt-3 max-w-3xl space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Skeleton className="h-5 w-36" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {statCards.map((title) => (
          <Card className="p-4" key={title}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-10 w-16" />
            <Skeleton className="mt-2 h-4 w-32" />
            <span className="sr-only">Loading {title}</span>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Skeleton className="h-8 w-80 max-w-full" />
            <div className="mt-2 max-w-3xl space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-lg bg-white/80" />
        </div>

        <div className="mt-5 space-y-3">
          {boardRows.map((row) => (
            <DealRowSkeleton key={row} />
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <Skeleton className="h-8 w-48" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="mt-4 space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <Skeleton className="h-8 w-64 bg-amber-100" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full bg-amber-100" />
            <Skeleton className="h-4 w-5/6 bg-amber-100" />
          </div>
          <div className="mt-4 space-y-3">
            {staleRows.map((row) => (
              <div className="rounded-lg bg-white p-4" key={row}>
                <Skeleton className="h-5 w-44" />
                <Skeleton className="mt-2 h-4 w-28" />
                <Skeleton className="mt-3 h-3 w-56" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function DealRowSkeleton() {
  return (
    <div className="block rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-2 h-7 w-72 max-w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-3 h-8 w-40 rounded-full" />
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-2">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <Skeleton className="h-12 rounded-lg bg-slate-100" />
        <Skeleton className="h-12 rounded-lg bg-slate-100" />
        <Skeleton className="h-12 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-lg bg-emerald-50 p-3">
      <Skeleton className="h-3 w-12 bg-emerald-100" />
      <Skeleton className="mt-2 h-5 w-16 bg-emerald-100" />
    </div>
  );
}
