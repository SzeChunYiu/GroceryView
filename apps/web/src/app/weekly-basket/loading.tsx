import { ArrowDownRight, ArrowUpRight, ShoppingBasket } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const metricTitles = ['Current', 'Usual', 'Delta'];

export default function WeeklyBasketLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-10 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metricTitles.map((title) => (
            <MetricSkeleton key={title} title={title} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.9fr]">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-12" />
        </div>
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <BottomCardSkeleton title="Best verified route" />
        <BottomCardSkeleton title="Promo savings" />
        <BottomCardSkeleton title="Watch item" />
      </section>
    </main>
  );
}

function MetricSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-7 w-24" />
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-11" />
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <article className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.9fr]">
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-14" />
      <Skeleton className="h-5 w-32 rounded-lg" />
    </article>
  );
}

function BottomCardSkeleton({ title }: { title: string }) {
  const Icon = title === 'Best verified route' ? ShoppingBasket : title === 'Promo savings' ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      <Skeleton className="mt-4 h-4 w-32" />
      <Skeleton className="mt-2 h-7 w-24" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  );
}
