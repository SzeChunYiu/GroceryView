import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, Eyebrow, SourceHealthDashboardTable, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { sourceHealthDashboardRows, sourceHealthDashboardSummary } from '@/lib/source-health';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/source-health',
    title: 'Source health dashboard | GroceryView',
    description: 'Admin dashboard for grocery ingestion freshness, row deltas, failures, and stale-data thresholds.',
    noIndex: true
  });
}

export const dynamic = 'force-static';

export default function AdminSourceHealthPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>Source health</Eyebrow>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Ingestion freshness dashboard</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Track every ingestion source with its latest refresh time, row count movement, failure state, and stale-data threshold before prices or catalogue metadata become shopper-facing claims.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600">Monitored {sourceHealthDashboardSummary.monitoredAt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={sourceHealthDashboardSummary.failingSourceCount > 0 ? 'warning' : 'success'}>
              {sourceHealthDashboardSummary.failingSourceCount.toLocaleString('sv-SE')} failed
            </StatusBadge>
            <StatusBadge tone={sourceHealthDashboardSummary.staleSourceCount > 0 ? 'warning' : 'success'}>
              {sourceHealthDashboardSummary.staleSourceCount.toLocaleString('sv-SE')} stale or watch
            </StatusBadge>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4" aria-label="Source health summary">
          <AdminMetricCard
            detail="Ingestion sources with freshness and failure monitoring."
            label="Sources"
            value={sourceHealthDashboardSummary.sourceCount.toLocaleString('sv-SE')}
          />
          <AdminMetricCard
            detail="Rows currently visible across monitored sources."
            label="Rows monitored"
            value={sourceHealthDashboardSummary.totalRows.toLocaleString('sv-SE')}
          />
          <AdminMetricCard
            detail="Net row movement compared with the previous ingest sample."
            label="Row delta"
            value={`${sourceHealthDashboardSummary.rowCountDelta >= 0 ? '+' : ''}${sourceHealthDashboardSummary.rowCountDelta.toLocaleString('sv-SE')}`}
          />
          <AdminMetricCard
            detail="Sources with warnings or hard failures in the latest run."
            label="Attention needed"
            value={(sourceHealthDashboardSummary.warningSourceCount + sourceHealthDashboardSummary.failingSourceCount).toLocaleString('sv-SE')}
          />
        </section>

        <Card className="mt-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Ingestion sources</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Freshness, row deltas, failures, and stale thresholds</h2>
            </div>
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white" href="/data-sources">
              View source provenance
            </Link>
          </div>
          <SourceHealthDashboardTable sources={sourceHealthDashboardRows} />
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
