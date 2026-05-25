import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { getSearchToSavingsFunnelDashboard } from '@/lib/search-to-savings-funnel';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/analytics/funnel');
}

function formatPercent(value: number | null) {
  return value === null ? '—' : new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1, style: 'percent' }).format(value);
}

function formatCount(value: number) {
  return value.toLocaleString('sv-SE');
}

export default function SearchToSavingsFunnelPage() {
  const dashboard = getSearchToSavingsFunnelDashboard();
  const largestDropOff = dashboard.largestDropOff;

  return (
    <PageShell>
      <Eyebrow>Product analytics</Eyebrow>
      <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Search-to-savings funnel dashboard</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Aggregate events follow the shopper path from landing/search to product, compare, watchlist or alert, basket, and savings action.
            Segments are market, device, and guest/account state only, so the team can prioritize UX drop-offs without exposing personal data.
          </p>
        </div>
        <Card className={dashboard.available ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">Runtime evidence</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{formatCount(dashboard.observationCount)}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {dashboard.available
              ? `aggregate events from ${dashboard.sourceCount} source${dashboard.sourceCount === 1 ? '' : 's'}`
              : 'No aggregate funnel events recorded in this runtime yet; no sample metrics are rendered.'}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Latest aggregate</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{dashboard.latestObservedAt ?? 'Not recorded'}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Server-side aggregate timestamp, not a user identifier.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Largest drop-off</p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {largestDropOff ? `${largestDropOff.from} → ${largestDropOff.to}` : 'Not enough data'}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {largestDropOff ? `${formatPercent(largestDropOff.percent)} drop-off (${formatCount(largestDropOff.count)} events)` : 'Drop-offs appear after adjacent funnel steps have aggregate counts.'}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Privacy guardrail</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{dashboard.privacy}</p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Aggregate funnel</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Step conversions and drop-offs</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">{dashboard.guardrail}</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3 font-black">Step</th>
                <th className="px-4 py-3 font-black">Aggregate count</th>
                <th className="px-4 py-3 font-black">Conversion</th>
                <th className="px-4 py-3 font-black">Drop-off</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.steps.map((step) => (
                <tr className="border-t border-slate-100 align-top" key={step.id}>
                  <th className="px-4 py-4">
                    <span className="block font-black text-slate-950">{step.label}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{step.detail}</span>
                  </th>
                  <td className="px-4 py-4 font-black text-emerald-800">{formatCount(step.count)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{formatPercent(step.conversionFromPrevious)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {step.dropOffFromPrevious === null ? '—' : `${formatPercent(step.dropOffFromPrevious)} (${formatCount(step.dropOffCountFromPrevious ?? 0)})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <Eyebrow>Segments</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Market × device × account state</h2>
        {dashboard.segments.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {dashboard.segments.slice(0, 9).map((segment) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={segment.key}>
                <p className="font-black text-slate-950">{segment.market} · {segment.device} · {segment.accountState}</p>
                <p className="mt-2 text-3xl font-black text-emerald-800">{formatPercent(segment.completionRate)}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {formatCount(segment.entryCount)} search entries → {formatCount(segment.savingsActionCount)} savings actions.
                  Largest drop: {segment.largestDropOffStep ?? 'not enough adjacent steps'} {segment.largestDropOffPercent === null ? '' : `(${formatPercent(segment.largestDropOffPercent)})`}.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
            Segment cards appear only after real aggregate events arrive through /api/analytics/search-to-savings-funnel.
          </p>
        )}
      </Card>
    </PageShell>
  );
}
