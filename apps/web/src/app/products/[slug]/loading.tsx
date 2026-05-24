import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageShell>
      <Eyebrow>Loading product</Eyebrow>
      <Skeleton className="mt-2 h-12 max-w-3xl rounded-2xl" />
      <Skeleton className="mt-3 h-7 max-w-2xl rounded-2xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <Skeleton className="mb-5 aspect-square w-full rounded-[2rem]" />
          <Skeleton className="h-8 w-64 rounded-2xl" />
          <div className="mt-4 grid gap-3">
            <Skeleton className="h-14 w-48 rounded-2xl" />
            <Skeleton className="h-5 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </Card>
        <Card>
          <Skeleton className="h-8 w-44 rounded-2xl" />
          <div className="mt-4 grid gap-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </Card>
      </div>
      <Card className="mt-6 border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full max-w-3xl">
            <Skeleton className="h-4 w-48 rounded-2xl" />
            <Skeleton className="mt-2 h-8 w-72 rounded-2xl" />
            <Skeleton className="mt-2 h-16 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </Card>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Skeleton className="h-4 w-36 rounded-2xl" />
            <Skeleton className="mt-2 h-8 w-64 rounded-2xl" />
            <Skeleton className="mt-2 h-14 w-full max-w-3xl rounded-2xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-3xl lg:w-48" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </Card>
    </PageShell>
  );
}
