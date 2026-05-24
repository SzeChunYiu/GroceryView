import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

const sortFilters = ['sort-biggest-drop', 'sort-cheapest-per-kg', 'sort-widest-spread'];
const categoryFilters = ['all', 'category-1', 'category-2', 'category-3', 'category-4', 'category-5'];
const tableRows = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];
const contextRows = ['leader-1', 'leader-2', 'leader-3', 'leader-4', 'leader-5'];

export default function ScreenerLoading() {
  return (
    <PageShell>
      <Eyebrow>Deal screener</Eyebrow>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_0.36fr] lg:items-end">
        <div>
          <Skeleton className="h-12 w-full max-w-4xl" />
          <div className="mt-3 max-w-3xl space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </div>
        <Card className="p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </Card>
      </div>

      <Card className="mt-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.7fr]">
          <div>
            <Skeleton className="h-4 w-16" />
            <div className="mt-3 flex flex-wrap gap-2">
              {sortFilters.map((filter) => <Skeleton className="h-10 w-36 rounded-lg" key={filter} />)}
            </div>
            <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          </div>

          <div>
            <Skeleton className="h-4 w-36" />
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryFilters.map((filter) => <Skeleton className="h-9 w-24 rounded-lg" key={filter} />)}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <Skeleton className="h-4 w-40 bg-emerald-100" />
            <Skeleton className="mt-4 h-2 w-full bg-emerald-100" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28 bg-emerald-100" />
              <Skeleton className="h-4 w-14 bg-emerald-100" />
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-lg bg-emerald-100" />
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Skeleton className="h-8 w-56" />
              <Skeleton className="mt-2 h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-10 w-44 rounded-full" />
          </div>
        </div>

        <div className="hidden grid-cols-[1.2fr_1fr_0.7fr_0.8fr_0.8fr] gap-4 bg-slate-50 px-5 py-3 sm:grid">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="divide-y divide-slate-200">
          {tableRows.map((row) => <ScreenerTableRowSkeleton key={row} />)}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-8 w-56" />
          <div className="mt-4 space-y-3">
            {contextRows.map((row) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={row}>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-64 max-w-full" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-8 w-80 max-w-full" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Skeleton className="h-28 rounded-lg bg-slate-100" />
            <Skeleton className="h-28 rounded-lg bg-slate-100" />
            <Skeleton className="h-28 rounded-lg bg-slate-100" />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-8 w-96 max-w-full" />
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-36 rounded-2xl bg-slate-100" />
          <Skeleton className="h-36 rounded-2xl bg-slate-100" />
          <Skeleton className="h-36 rounded-2xl bg-slate-100" />
        </div>
      </Card>
    </PageShell>
  );
}

function ScreenerTableRowSkeleton() {
  return (
    <div className="block rounded-2xl bg-white p-4 sm:grid sm:grid-cols-[1.2fr_1fr_0.7fr_0.8fr_0.8fr] sm:gap-4 sm:rounded-none sm:px-5 sm:py-4">
      <div>
        <Skeleton className="h-5 w-52 max-w-full" />
        <Skeleton className="mt-2 h-3 w-28" />
        <Skeleton className="mt-3 h-3 w-36" />
      </div>
      <div className="mt-4 sm:mt-0">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
      </div>
      <Skeleton className="mt-4 h-5 w-24 sm:mt-0" />
      <Skeleton className="mt-4 h-5 w-28 sm:mt-0" />
      <Skeleton className="mt-4 h-10 w-36 rounded-full sm:mt-0" />
    </div>
  );
}
