import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { weeklyBasketRows, weeklyBasketSummary } from '@/components/sample-data';

const route = 'weekly-basket';

export default function WeeklyBasketPage() {
  return (
    <PageShell>
      <Eyebrow>Weekly basket</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Weekly basket planner</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Basket rows come from the sample-data driver so the route shows concrete grocery items, store context, and price movement without inventing private household records.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Visible rows</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{weeklyBasketSummary.itemCount}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sample basket items rendered from the route driver.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Planned total</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-800">{weeklyBasketSummary.plannedTotal}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sum of visible sample basket rows.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Strongest move</p>
          <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{weeklyBasketSummary.strongestMove}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{weeklyBasketSummary.strongestMoveValue} versus last week.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Source mode</p>
          <p className="mt-2 text-xl font-black tracking-tight text-slate-950">Sample-data driver</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Private production records remain gated below.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Basket rows</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Concrete sample basket items</h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900">
            {weeklyBasketSummary.plannedTotal}
          </span>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {weeklyBasketRows.map((row) => (
            <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto]" key={`${row.product}-${row.store}`}>
              <div>
                <p className="font-black text-slate-950">{row.product}</p>
                <p className="mt-1 text-sm text-slate-600">{row.store} · {row.quantity} · {row.source}</p>
              </div>
              <p className="font-black text-slate-950">{row.total}</p>
              <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-900">{row.movement}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <NoVerifiedData route={route} title="Weekly basket still has no private production records in this static snapshot" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
