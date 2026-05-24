import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

const summaryCards = ['Rows', 'Columns', 'Covered cells'];
const heatmapColumns = ['Chain A', 'Chain B', 'Chain C', 'Chain D'];
const heatmapRows = ['Produce', 'Dairy', 'Pantry', 'Snacks', 'Household'];

export default function HeatmapLoading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>TradingView-style heatmap</Eyebrow>
          <Skeleton className="mt-2 h-11 w-full max-w-2xl" />
          <div className="mt-3 max-w-3xl space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {summaryCards.map((label) => (
          <Card className="p-4" key={label}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-9 w-16" />
            <Skeleton className="mt-2 h-4 w-40" />
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[56rem] text-left text-sm">
            <div className="grid grid-cols-[14rem_repeat(4,minmax(10rem,1fr))] border-b border-slate-200">
              <div className="border-r border-slate-200 bg-white px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </div>
              {heatmapColumns.map((column) => (
                <div className="space-y-2 bg-slate-50 px-3 py-3" key={column}>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              ))}
            </div>

            {heatmapRows.map((row) => (
              <div className="grid grid-cols-[14rem_repeat(4,minmax(10rem,1fr))] border-b border-slate-200" key={row}>
                <div className="border-r border-slate-200 bg-white px-4 py-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
                {heatmapColumns.map((column, index) => (
                  <div className="bg-slate-50 p-1.5" key={`${row}-${column}`}>
                    <div className="min-h-24 rounded-lg border border-slate-200 bg-white p-3">
                      <Skeleton className={`h-8 ${index % 2 === 0 ? 'w-16' : 'w-12'}`} />
                      <Skeleton className="mt-3 h-6 w-24 rounded-full" />
                      <Skeleton className="mt-3 h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
