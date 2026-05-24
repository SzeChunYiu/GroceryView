import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';

function SkeletonBlock({ className = '' }: Readonly<{ className?: string }>) {
  return <span className={`block animate-pulse rounded bg-slate-200 ${className}`} />;
}

function FilterPillSkeleton({ className = '' }: Readonly<{ className?: string }>) {
  return <SkeletonBlock className={`h-9 rounded-lg ${className}`} />;
}

function ScreenerTableSkeletonRow() {
  return (
    <tr className="block rounded-2xl border border-slate-200 bg-white p-4 align-top shadow-sm sm:table-row sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
        <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Product</span>
        <SkeletonBlock className="h-5 w-44" />
        <SkeletonBlock className="mt-2 h-3 w-24" />
        <SkeletonBlock className="mt-3 h-3 w-32" />
      </td>
      <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
        <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Signal</span>
        <SkeletonBlock className="h-6 w-28 bg-emerald-100" />
        <SkeletonBlock className="mt-3 h-3 w-56 max-w-xs" />
        <SkeletonBlock className="mt-2 h-3 w-40 max-w-xs" />
      </td>
      <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
        <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Price</span>
        <SkeletonBlock className="h-5 w-24" />
      </td>
      <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
        <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Comparison</span>
        <SkeletonBlock className="h-5 w-28" />
      </td>
      <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
        <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Confidence</span>
        <SkeletonBlock className="h-9 w-36 rounded-full bg-emerald-100" />
      </td>
    </tr>
  );
}

function CardListItemSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <SkeletonBlock className="h-4 w-28" />
      <SkeletonBlock className="mt-2 h-4 w-48" />
    </div>
  );
}

function GuardrailCardSkeleton() {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-5/6" />
      <SkeletonBlock className="mt-2 h-4 w-2/3" />
    </div>
  );
}

export default function ScreenerLoading() {
  return (
    <PageShell>
      <Eyebrow>Deal screener</Eyebrow>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_0.36fr] lg:items-end">
        <div>
          <SkeletonBlock className="h-10 max-w-3xl" />
          <SkeletonBlock className="mt-3 h-5 max-w-3xl" />
          <SkeletonBlock className="mt-2 h-5 max-w-2xl" />
        </div>
        <Card className="p-4">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="mt-3 h-8 w-40" />
          <SkeletonBlock className="mt-3 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-4/5" />
        </Card>
      </div>

      <Card className="mt-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.7fr]">
          <div>
            <SkeletonBlock className="h-4 w-14" />
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <FilterPillSkeleton className="w-32" key={index} />
              ))}
            </div>
            <SkeletonBlock className="mt-3 h-4 w-64" />
          </div>

          <div>
            <SkeletonBlock className="h-4 w-32" />
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <FilterPillSkeleton className={index === 0 ? 'w-14' : 'w-20'} key={index} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <SkeletonBlock className="h-4 w-36 bg-emerald-100" />
            <SkeletonBlock className="mt-5 h-2 w-full bg-emerald-100" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <SkeletonBlock className="h-4 w-24 bg-emerald-100" />
              <SkeletonBlock className="h-3 w-12 bg-emerald-100" />
            </div>
            <SkeletonBlock className="mt-3 h-10 w-full rounded-lg bg-emerald-200" />
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SkeletonBlock className="h-8 w-60" />
              <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />
            </div>
            <SkeletonBlock className="h-9 w-40 rounded-full bg-emerald-100" />
          </div>
        </div>

        <div className="overflow-hidden sm:overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3 text-left text-sm sm:min-w-[920px] sm:border-collapse sm:border-spacing-y-0">
            <thead className="hidden bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500 sm:table-header-group">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Signal</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Comparison</th>
                <th className="px-5 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group sm:divide-y sm:divide-slate-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <ScreenerTableSkeletonRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="mt-3 h-8 w-52" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <CardListItemSkeleton key={index} />
            ))}
          </div>
        </Card>

        <Card>
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="mt-3 h-8 w-80 max-w-full" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <GuardrailCardSkeleton key={index} />
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
