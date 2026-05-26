import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { getCoreWebVitalsDashboard, type CoreWebVitalMetric } from '@/lib/core-web-vitals';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/performance',
    title: 'Performance telemetry | GroceryView',
    description: 'Aggregate Core Web Vitals p75 telemetry and route-level regression alerts.',
    noIndex: true
  });
}

function formatMetric(metric: CoreWebVitalMetric, value: number) {
  if (metric === 'CLS') return value.toFixed(3);
  return `${Math.round(value).toLocaleString('sv-SE')} ms`;
}

export default function AdminPerformancePage() {
  const dashboard = getCoreWebVitalsDashboard();
  const regressionCount = dashboard.alerts.filter((alert) => alert.severity === 'regression').length;

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-800">Performance telemetry</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Core Web Vitals p75 by segment</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Monitor production LCP, INP, and CLS observations grouped by route, market, device, and effective connection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={dashboard.available ? 'success' : 'warning'}>{dashboard.available ? 'Receiving events' : 'Awaiting traffic'}</StatusBadge>
            <StatusBadge tone={regressionCount > 0 ? 'warning' : 'success'}>{regressionCount.toLocaleString('sv-SE')} regressions</StatusBadge>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Core Web Vitals summary">
          <AdminMetricCard detail="Accepted privacy-safe metric observations kept in the bounded in-memory window." label="Observations" value={dashboard.observationCount.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Route, market, device, and connection p75 groups currently visible." label="Segments" value={dashboard.segments.length.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Segments above the Core Web Vitals good threshold." label="Alerts" value={dashboard.alerts.length.toLocaleString('sv-SE')} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <Eyebrow>p75 segments</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Route performance</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Metric</th>
                    <th className="px-4 py-3">p75</th>
                    <th className="px-4 py-3">Segment</th>
                    <th className="px-4 py-3">Samples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(dashboard.segments.length > 0 ? dashboard.segments : [{
                    connection: 'unknown',
                    device: 'unknown',
                    market: 'unknown',
                    metric: 'LCP' as const,
                    p75: 0,
                    rating: 'good' as const,
                    route: 'No route events yet',
                    sampleSize: 0
                  }]).map((segment) => (
                    <tr key={`${segment.route}-${segment.metric}-${segment.market}-${segment.device}-${segment.connection}`}>
                      <td className="px-4 py-4 font-black text-slate-950">{segment.route}</td>
                      <td className="px-4 py-4 text-slate-700">{segment.metric}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{formatMetric(segment.metric, segment.p75)}</td>
                      <td className="px-4 py-4 text-slate-700">{segment.market} / {segment.device} / {segment.connection}</td>
                      <td className="px-4 py-4 text-slate-700">{segment.sampleSize.toLocaleString('sv-SE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className={dashboard.alerts.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}>
            <Eyebrow>Regression alerts</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{dashboard.alerts.length > 0 ? 'Segments above threshold' : 'No active p75 alerts'}</h2>
            <div className="mt-5 grid gap-3">
              {(dashboard.alerts.length > 0 ? dashboard.alerts : []).map((alert) => (
                <article className="rounded-2xl border border-white/70 bg-white p-4" key={`${alert.route}-${alert.metric}-${alert.market}-${alert.device}-${alert.connection}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-slate-950">{alert.route} / {alert.metric}</h3>
                    <StatusBadge tone="warning">{alert.severity}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    p75 {formatMetric(alert.metric, alert.p75)} for {alert.market} / {alert.device} / {alert.connection}; threshold {formatMetric(alert.metric, alert.threshold)}.
                  </p>
                </article>
              ))}
              {dashboard.alerts.length === 0 ? (
                <p className="text-sm font-semibold leading-6 text-emerald-950">No p75 segment has crossed the Core Web Vitals good threshold in the current telemetry window.</p>
              ) : null}
            </div>
          </Card>
        </section>

        <Card className="mt-6 border-sky-200 bg-sky-50">
          <Eyebrow>Privacy guardrail</Eyebrow>
          <p className="mt-2 text-sm font-semibold leading-6 text-sky-950">{dashboard.guardrail}</p>
          <Link className="mt-4 inline-flex rounded-full bg-sky-900 px-5 py-3 text-sm font-black text-white" href="/admin">Back to admin dashboard</Link>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
