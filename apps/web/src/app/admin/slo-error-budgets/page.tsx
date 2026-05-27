import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { reliabilitySloDashboard, reliabilitySloDashboardSummary, type ReliabilitySloStatus } from '@/lib/source-health';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/slo-error-budgets',
    title: 'SLO and error-budget dashboard | GroceryView',
    description: 'Admin reliability report for availability, p95 latency, freshness, ingestion success, source coverage, alert delivery, and burn-rate thresholds.',
    noIndex: true
  });
}

export const dynamic = 'force-static';

function formatPercent(value: number | null) {
  if (value === null) return 'Not measured';
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })}%`;
}

function formatBurnRate(value: number | null) {
  if (value === null) return 'n/a';
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })}x`;
}

function statusTone(status: ReliabilitySloStatus): 'neutral' | 'success' | 'warning' {
  if (status === 'healthy') return 'success';
  if (status === 'unmeasured') return 'neutral';
  return 'warning';
}

function statusLabel(status: ReliabilitySloStatus) {
  if (status === 'burning_budget') return 'Burning budget';
  if (status === 'unmeasured') return 'Unmeasured';
  return status;
}

export default function AdminSloErrorBudgetsPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>SRE report</Eyebrow>
            <h1 className="mt-2 text-4xl font-black tracking-tight">SLOs and error budgets</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Reliability objectives for shopper-facing availability, p95 latency, freshness, ingestion success, source coverage, and alert delivery. Rows with no attached metric stay unmeasured instead of pretending budget health.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600">Monitored {reliabilitySloDashboardSummary.monitoredAt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={reliabilitySloDashboardSummary.burningBudgetCount > 0 ? 'warning' : 'success'}>
              {reliabilitySloDashboardSummary.burningBudgetCount.toLocaleString('sv-SE')} burning
            </StatusBadge>
            <StatusBadge tone={reliabilitySloDashboardSummary.unmeasuredSloCount > 0 ? 'warning' : 'success'}>
              {reliabilitySloDashboardSummary.unmeasuredSloCount.toLocaleString('sv-SE')} unmeasured
            </StatusBadge>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4" aria-label="SLO summary">
          <AdminMetricCard
            detail="Availability, latency, freshness, ingestion success, coverage, and alert delivery."
            label="SLOs"
            value={reliabilitySloDashboardSummary.sloCount.toLocaleString('sv-SE')}
          />
          <AdminMetricCard
            detail="Rows with concrete source-health, ingestion, or route-budget evidence."
            label="Measured"
            value={reliabilitySloDashboardSummary.measuredSloCount.toLocaleString('sv-SE')}
          />
          <AdminMetricCard
            detail="Critical journeys represented in the SLO report."
            label="Journeys"
            value={reliabilitySloDashboardSummary.criticalJourneyCount.toLocaleString('sv-SE')}
          />
          <AdminMetricCard
            detail="Rows over the current 30-day budget burn threshold."
            label="Budget burn"
            value={reliabilitySloDashboardSummary.burningBudgetCount.toLocaleString('sv-SE')}
          />
        </section>

        <Card className="mt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Error budgets</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Current SLO status by dimension</h2>
            </div>
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white" href="/admin/source-health">
              View source health
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">SLO</th>
                  <th className="px-4 py-3">Objective</th>
                  <th className="px-4 py-3">Observed</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {reliabilitySloDashboard.map((slo) => (
                  <tr key={slo.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-black text-slate-950">{slo.name}</p>
                      <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-slate-500">{slo.criticalJourney}</p>
                      <p className="mt-2 font-mono text-xs font-black text-slate-500">{slo.dimension}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="max-w-sm font-semibold leading-6 text-slate-950">{slo.objective}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">Source: {slo.measurementSource}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-black text-slate-950">{formatPercent(slo.observedPercent)}</p>
                      <p className="mt-2 max-w-xs text-xs font-semibold leading-5 text-slate-600">{slo.observedLabel}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-slate-950">Remaining {formatPercent(slo.remainingBudgetPercent)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Burn rate {formatBurnRate(slo.burnRate)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{slo.windowDays}d window</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge tone={statusTone(slo.status)}>{statusLabel(slo.status)}</StatusBadge>
                      <p className="mt-3 max-w-xs text-xs font-semibold leading-5 text-slate-600">{slo.nextAction}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <section className="mt-6 grid gap-4 lg:grid-cols-3" aria-label="Burn-rate alert thresholds">
          {reliabilitySloDashboard[0]?.alertThresholds.map((threshold) => (
            <Card className="border-amber-200 bg-amber-50" key={threshold.id}>
              <Eyebrow>{threshold.window}</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">{threshold.burnRate.toLocaleString('sv-SE')}x burn rate</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">{threshold.action}</p>
            </Card>
          ))}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
