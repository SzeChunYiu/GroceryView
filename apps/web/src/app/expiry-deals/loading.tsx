import { Card, Eyebrow, PageShell } from '@/components/data-ui';

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

function ExpiryDealRowSkeleton() {
  return (
    <div className="block rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <SkeletonBlock className="h-3 w-52" />
          <SkeletonBlock className="mt-2 h-7 w-72 max-w-full" />
          <SkeletonBlock className="mt-2 h-5 w-[36rem] max-w-full" />
          <SkeletonBlock className="mt-3 h-8 w-40" />
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="rounded-lg bg-emerald-50 p-3" key={index}>
              <SkeletonBlock className="h-3 w-16 bg-slate-200" />
              <SkeletonBlock className="mt-2 h-5 w-20 bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="rounded-lg bg-slate-50 p-3" key={index}>
            <SkeletonBlock className="h-5 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpiryDealsLoading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>Expiry deal radar</Eyebrow>
          <SkeletonBlock className="mt-2 h-11 w-[44rem] max-w-full" />
          <SkeletonBlock className="mt-3 h-20 w-[48rem] max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-44" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card className="p-4" key={index}>
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-2 h-10 w-16" />
            <SkeletonBlock className="mt-2 h-5 w-28" />
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SkeletonBlock className="h-8 w-80" />
            <SkeletonBlock className="mt-2 h-12 w-[42rem] max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-40 bg-slate-200" />
        </div>

        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ExpiryDealRowSkeleton key={index} />
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
