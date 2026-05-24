import { Skeleton } from '@/components/ui/skeleton';

export default function StoreDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="h-4 w-24" />
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="mt-2 h-5 w-1/2" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
      </section>
    </main>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-md bg-market-oat/45 p-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-2 h-4 w-2/5" />
    </div>
  );
}
