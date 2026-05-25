import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { formatPct, freshnessLagSummary, perClassFreshnessLagReport } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/coverage');
}

export const dynamic = 'force-static';

export default function CoveragePage() {
  return (
    <PageShell>
      <Eyebrow>Freshness coverage</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Per-class freshness lag</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Fresh classes are treated as perishable: observations older than {freshnessLagSummary.freshWindowDays} days are stale. This report shows what share of dated observations in each class is still inside that freshness window.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Observed classes" value={freshnessLagSummary.classCount.toLocaleString('sv-SE')} />
        <Metric label="Total observations" value={freshnessLagSummary.observationCount.toLocaleString('sv-SE')} />
        <Metric label="Fresh observations" value={formatPct(freshnessLagSummary.freshPercent)} />
        <Metric label="Fully stale classes" value={freshnessLagSummary.staleClassCount.toLocaleString('sv-SE')} />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Class lag report</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              As of {freshnessLagSummary.asOf}, rows below rank classes with stale or mixed observation windows first so ingestion cadence gaps are visible.
            </p>
          </div>
          <p className="text-sm font-black text-slate-600">Fresh window: &lt; {freshnessLagSummary.freshWindowDays} days</p>
        </div>

        <div className="mt-5 divide-y divide-slate-200">
          {perClassFreshnessLagReport.map((row) => (
            <div className="grid gap-4 py-5 lg:grid-cols-[1fr_9rem_9rem_9rem]" key={row.slug}>
              <div>
                <p className="font-black text-slate-950">{row.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Latest observation {row.latestObservedAt}; {row.sourceBreakdown}.
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className={row.status === 'stale' ? 'h-2 rounded-full bg-rose-700' : row.status === 'mixed' ? 'h-2 rounded-full bg-amber-600' : 'h-2 rounded-full bg-emerald-700'}
                    style={{ width: `${Math.max(4, row.freshPercent)}%` }}
                  />
                </div>
              </div>
              <Readout label="Fresh" value={formatPct(row.freshPercent)} />
              <Readout label="Fresh obs." value={row.freshObservationCount.toLocaleString('sv-SE')} />
              <Readout label="Stale obs." value={row.staleObservationCount.toLocaleString('sv-SE')} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Claim boundary</h2>
        <p className="mt-2 text-sm leading-6 text-amber-950">{freshnessLagSummary.claimBoundary}</p>
      </Card>

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card className="p-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-800">{value}</p>
    </Card>
  );
}

function Readout({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-emerald-800">{value}</p>
    </div>
  );
}
