'use client';

import { useEffect, useState } from 'react';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, StatusBadge } from '@/components/data-ui';
import { clearEngagementDashboard, readEngagementDashboard, type EngagementDashboard } from '@/lib/engagement';

function formatDuration(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return '0s';
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1, style: 'percent' }).format(value);
}

export default function AdminUxPage() {
  const [dashboard, setDashboard] = useState<EngagementDashboard>(() => readEngagementDashboard());

  useEffect(() => {
    function refreshDashboard() {
      setDashboard(readEngagementDashboard());
    }

    window.addEventListener('groceryview:ux-engagement-updated', refreshDashboard);
    window.addEventListener('storage', refreshDashboard);
    return () => {
      window.removeEventListener('groceryview:ux-engagement-updated', refreshDashboard);
      window.removeEventListener('storage', refreshDashboard);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-800">UX engagement</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Bounce, scroll, and dwell metrics</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Browser-local aggregate metrics show time-on-page, maximum scroll depth, and low-engagement bounces captured on every route.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={dashboard.totals.visits > 0 ? 'success' : 'warning'}>
              {dashboard.totals.visits > 0 ? 'Receiving metrics' : 'Awaiting visits'}
            </StatusBadge>
            <button
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-rose-400 hover:text-rose-800"
              onClick={() => setDashboard(clearEngagementDashboard())}
              type="button"
            >
              Clear local metrics
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4" aria-label="UX engagement totals">
          <AdminMetricCard detail="Recorded route exits in this browser." label="Visits" value={dashboard.totals.visits.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Average dwell time before route change or page hide." label="Avg. time" value={formatDuration(dashboard.totals.averageTimeOnPageMs)} />
          <AdminMetricCard detail="Average maximum page depth reached." label="Avg. scroll" value={`${Math.round(dashboard.totals.averageScrollDepthPercent)}%`} />
          <AdminMetricCard detail="No interaction, shallow scroll, and under 15 seconds." label="Bounce rate" value={formatPercent(dashboard.totals.bounceRate)} />
        </section>

        <Card className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">Route breakdown</p>
              <h2 className="mt-2 text-2xl font-black">Engagement by page</h2>
            </div>
            <p className="text-sm font-bold text-slate-500">Last {dashboard.events.length} captured events</p>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Visits</th>
                  <th className="px-4 py-3">Bounce</th>
                  <th className="px-4 py-3">Avg. time</th>
                  <th className="px-4 py-3">Avg. scroll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dashboard.routes.map((route) => (
                  <tr key={route.path}>
                    <td className="px-4 py-3 font-black text-slate-950">{route.path}</td>
                    <td className="px-4 py-3 font-semibold">{route.visits.toLocaleString('sv-SE')}</td>
                    <td className="px-4 py-3 font-semibold">{formatPercent(route.bounceRate)}</td>
                    <td className="px-4 py-3 font-semibold">{formatDuration(route.averageTimeOnPageMs)}</td>
                    <td className="px-4 py-3 font-semibold">{Math.round(route.averageScrollDepthPercent)}%</td>
                  </tr>
                ))}
                {dashboard.routes.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center font-semibold text-slate-500" colSpan={5}>
                      Navigate between pages, then return here to see local UX engagement metrics.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
