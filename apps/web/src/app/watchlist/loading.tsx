import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

const statCards = ['Watched products', 'Active alerts', 'Planned notifications'];
const alertRows = ['baby wipes', 'oat drink', 'diapers'];
const featureCards = ['email digest', 'new-product alerts', 'account preferences', 'notification plan', 'essentials alerts', 'diaper tracking'];

export default function WatchlistLoading() {
  return (
    <PageShell>
      <Eyebrow>Watchlist price alerts</Eyebrow>
      <Skeleton className="mt-3 h-12 max-w-3xl" />
      <Skeleton className="mt-4 h-6 max-w-4xl" />
      <Skeleton className="mt-2 h-6 max-w-2xl" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        {statCards.map((label) => (
          <Card key={label}>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-12 w-20" />
            <Skeleton className="mt-4 h-5 w-full" />
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <Skeleton className="h-8 w-40" />
        <div className="mt-4 space-y-3">
          {alertRows.map((row) => (
            <div className="rounded-2xl border border-slate-200 p-4" key={row}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-7 max-w-sm" />
                  <Skeleton className="mt-2 h-4 max-w-2xl" />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton className="h-12 rounded-2xl" key={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Skeleton className="mt-6 h-24 rounded-2xl" />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {featureCards.map((feature) => (
          <Card key={feature}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 max-w-md" />
            <Skeleton className="mt-3 h-5 w-full" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[0, 1].map((item) => (
                <Skeleton className="h-24 rounded-2xl" key={item} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-4 h-48 rounded-2xl" />
        </Card>
        <Card>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-4 h-48 rounded-2xl" />
        </Card>
      </div>
    </PageShell>
  );
}
