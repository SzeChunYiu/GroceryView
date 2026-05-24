import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { Skeleton } from '@/components/ui/skeleton';

const summaryCards = ['Rows', 'Columns', 'Covered cells'];
const columns = ['chain-a', 'chain-b', 'chain-c', 'chain-d'];
const rows = ['produce', 'dairy', 'pantry', 'household', 'snacks'];

export default function HeatmapLoading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>TradingView-style heatmap</Eyebrow>
          <Skeleton className="mt-2 h-11 w-full max-w-2xl rounded-xl" />
          <Skeleton className="mt-3 h-4 w-full max-w-3xl rounded-full" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-2xl rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card className="p-4" key={card}>
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="mt-3 h-9 w-16 rounded-xl" />
            <Skeleton className="mt-2 h-4 w-40 rounded-full" />
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[58rem] text-sm">
            <div className="grid grid-cols-[14rem_repeat(4,minmax(10rem,1fr))] border-b border-slate-200 bg-slate-50">
              <div className="border-r border-slate-200 bg-white px-4 py-3">
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
              {columns.map((column) => (
                <div className="px-3 py-3" key={column}>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="mt-2 h-4 w-24 rounded-full" />
                  <Skeleton className="mt-2 h-7 w-28 rounded-full" />
                </div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="grid grid-cols-[14rem_repeat(4,minmax(10rem,1fr))] border-b border-slate-200" key={row}>
                <div className="border-r border-slate-200 bg-white px-4 py-3">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-32 rounded-full" />
                </div>
                {columns.map((column) => (
                  <div className="bg-slate-50 p-1.5" key={`${row}-${column}`}>
                    <div className="min-h-24 rounded-lg border border-slate-200 bg-white p-3">
                      <Skeleton className="h-8 w-16 rounded-xl" />
                      <Skeleton className="mt-3 h-7 w-28 rounded-full" />
                      <Skeleton className="mt-3 h-3 w-24 rounded-full" />
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
