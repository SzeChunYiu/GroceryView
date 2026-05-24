import { type HTMLAttributes } from 'react';
import { Card, PageShell } from '@/components/data-ui';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} {...props} />;
}

export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-3 h-11 w-80 max-w-full" />
      <div className="mt-4 max-w-3xl space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-4/5" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-12 w-40" />
            <Skeleton className="mt-4 h-4 w-52 max-w-full" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <Skeleton className="h-8 w-64 max-w-full" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={item}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-52 max-w-full" />
                    <Skeleton className="h-4 w-40 max-w-full" />
                  </div>
                  <Skeleton className="h-8 w-28 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-4 w-44 max-w-full" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Skeleton className="h-8 w-56 max-w-full" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((item) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={item}>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="mt-3 h-4 w-48 max-w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-14 rounded-2xl" />
        </Card>
      </div>

      {[0, 1, 2, 3].map((section) => (
        <Card className="mt-6" key={section}>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-3 h-8 w-72 max-w-full" />
          <div className="mt-3 max-w-3xl space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div className="rounded-2xl bg-white p-4" key={item}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-8 w-28" />
                <Skeleton className="mt-2 h-4 w-44 max-w-full" />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {[0, 1].map((item) => (
          <Card key={item}>
            <Skeleton className="h-8 w-56 max-w-full" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton className="h-16 rounded-2xl" key={row} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
