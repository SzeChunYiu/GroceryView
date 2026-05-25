import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { getProductConversionDashboard } from '@/lib/analytics';
import { getSearchToSavingsFunnelDashboard } from '@/lib/search-to-savings-funnel';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/analytics',
    title: 'Product analytics | GroceryView',
    description: 'Aggregate route-level product conversion funnel analytics for shopper value surfaces.',
    noIndex: true
  });
}

function formatPercent(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1, style: 'percent' }).format(value);
}

export default function AdminAnalyticsPage() {
  const funnel = getSearchToSavingsFunnelDashboard();
  const conversions = getProductConversionDashboard();
  const topRoute = conversions.routes[0];

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-800">Product analytics</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Conversion funnels by route</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Monitor aggregate search-to-product, product-to-list, alert creation, and outbound click conversion so product strategy can see which shopper surfaces create value.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={conversions.available ? 'success' : 'warning'}>{conversions.available ? 'Receiving events' : 'Awaiting traffic'}</StatusBadge>
            <StatusBadge>Aggregate only</StatusBadge>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4" aria-label="Product conversion totals">
          <AdminMetricCard detail="Product detail beacons after product search surfaces." label="Search → product" value={conversions.totals.searchToProductCount.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="List or basket planning beacons after product discovery." label="Product → list" value={conversions.totals.productToListCount.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Watchlist and price-alert action beacons." label="Alert creation" value={conversions.totals.alertCreationCount.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Affiliate or store outbound click events." label="Outbound clicks" value={conversions.totals.outboundClickCount.toLocaleString('sv-SE')} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <Eyebrow>Current funnel</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Search-to-savings health</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="font-black text-slate-500">Observations</dt>
                <dd className="mt-1 text-2xl font-black text-slate-950">{funnel.observationCount.toLocaleString('sv-SE')}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="font-black text-slate-500">Largest drop-off</dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {funnel.largestDropOff ? `${funnel.largestDropOff.from} → ${funnel.largestDropOff.to} (${formatPercent(funnel.largestDropOff.percent)})` : 'No drop-off data yet'}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="font-black text-slate-500">Top product route</dt>
                <dd className="mt-1 font-semibold text-slate-800">{topRoute ? `${topRoute.route} · ${topRoute.searchToProductCount.toLocaleString('sv-SE')} product views` : 'Awaiting route events'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <Eyebrow>Route performance</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Product value actions</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Search → product</th>
                    <th className="px-4 py-3">List rate</th>
                    <th className="px-4 py-3">Alert rate</th>
                    <th className="px-4 py-3">Outbound rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(conversions.routes.length > 0 ? conversions.routes : [{ ...conversions.totals, route: 'No route events yet' }]).map((route) => (
                    <tr key={route.route}>
                      <td className="px-4 py-4 font-black text-slate-950">{route.route}</td>
                      <td className="px-4 py-4 text-slate-700">{route.searchToProductCount.toLocaleString('sv-SE')}</td>
                      <td className="px-4 py-4 text-slate-700">{formatPercent(route.listConversionRate)}</td>
                      <td className="px-4 py-4 text-slate-700">{formatPercent(route.alertConversionRate)}</td>
                      <td className="px-4 py-4 text-slate-700">{formatPercent(route.outboundClickRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <Card className="mt-6 border-violet-200 bg-violet-50">
          <Eyebrow>Privacy guardrail</Eyebrow>
          <p className="mt-2 text-sm font-semibold leading-6 text-violet-950">{conversions.guardrail}</p>
          <Link className="mt-4 inline-flex rounded-full bg-violet-800 px-5 py-3 text-sm font-black text-white" href="/admin">Back to admin dashboard</Link>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
