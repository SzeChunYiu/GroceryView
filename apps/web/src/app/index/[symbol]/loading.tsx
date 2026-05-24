import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageShell>
      <Eyebrow>Index symbol</Eyebrow>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Skeleton className="h-11 w-full max-w-lg" />
          <Skeleton className="mt-4 h-6 w-full max-w-3xl" />
          <Skeleton className="mt-2 h-6 w-4/5 max-w-2xl" />
        </div>
        <div className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-16 w-40" />
          <Skeleton className="mt-4 h-8 w-48 rounded-full" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {['constituents', 'saving', 'calculation'].map((metric) => (
          <Card key={metric}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-10 w-28" />
            <Skeleton className="mt-3 h-4 w-44" />
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-7 w-72" />
          </div>
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
      </Card>

      <Card className="mt-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-8 w-56" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_0.75fr_0.75fr]" key={index}>
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
