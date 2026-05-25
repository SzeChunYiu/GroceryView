import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { buildPartnerStoreDashboardSummary } from '@/lib/chain-index-data';
import {
  communityModerationQueue,
  moderationPriorityLabel,
  moderationQueueTypeLabel,
  moderationStatusLabel
} from '@/lib/reviews';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin',
    title: 'Admin dashboard | GroceryView',
    description: 'Partner store visibility, catalogue coverage, reported issues, and community moderation queues.',
    noIndex: true
  });
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0, style: 'percent' }).format(value);
}

export default function AdminPage() {
  const flaggedReviews = communityModerationQueue.filter((item) => item.type === 'flagged_review').length;
  const priceReports = communityModerationQueue.filter((item) => item.type === 'price_report').length;
  const duplicateReports = communityModerationQueue.filter((item) => item.type === 'duplicate_product_report').length;
  const dashboard = buildPartnerStoreDashboardSummary();

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-800">Admin dashboard</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-slate-950">Partner operations and community moderation</h1>
            <p className="mt-3 text-lg leading-8 text-slate-700">
              Review partner catalogue visibility, self-service coverage gaps, reported issue states, and community data queues before store-facing claims go live.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600">Partner source: {dashboard.sourceLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="success">Verified snapshot</StatusBadge>
            <StatusBadge tone="warning">Admin only</StatusBadge>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Partner dashboard summary">
          <AdminMetricCard
            detail="Rows with a captured partner catalogue price."
            label="Visible products"
            value={dashboard.totalVisibleProducts.toLocaleString('sv-SE')}
          />
          <AdminMetricCard
            detail="Products present in both partner catalogues."
            label="Comparable matches"
            value={dashboard.matchedProducts.toLocaleString('sv-SE')}
          />
          <AdminMetricCard
            detail="Normalised category groups with matched coverage."
            label="Shared categories"
            value={dashboard.sharedCategoryCount.toLocaleString('sv-SE')}
          />
        </section>

        <Card className="mt-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Store visibility</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Partner catalogue coverage</h2>
            </div>
            <StatusBadge>Branch inventory pending</StatusBadge>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Catalogue coverage</th>
                  <th className="px-4 py-3">Reported issues</th>
                  <th className="px-4 py-3">Next action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {dashboard.stores.map((store) => (
                  <tr key={store.chainKey}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-black text-slate-950">{store.chainName}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-800">{store.lowestPriceWins.toLocaleString('sv-SE')} lowest-price positions</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-slate-950">{store.visibilityLabel}</p>
                      <p className="mt-1 text-slate-600">{store.categoriesCovered} categories represented</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-slate-950">{formatPercent(store.coveragePercent)} matched</p>
                      <p className="mt-1 text-slate-600">{store.catalogueCoverageLabel}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge tone={store.issueSeverity === 'watch' ? 'warning' : 'success'}>{store.reportedIssueCount} tracked</StatusBadge>
                      <p className="mt-2 text-slate-600">{store.reportedIssueSummary}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">{store.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <Eyebrow>Reported issue queue</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Operational gaps to review</h2>
            <div className="mt-5 grid gap-3">
              {dashboard.issues.map((issue) => (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={issue.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-black text-slate-950">{issue.label}</h3>
                    <StatusBadge tone={issue.severity === 'watch' ? 'warning' : 'success'}>{issue.count.toLocaleString('sv-SE')} open</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{issue.detail}</p>
                </article>
              ))}
            </div>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <Eyebrow>Guardrails</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950">No inferred store claims</h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-amber-950">
              {dashboard.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Moderation queue summary">
          <div className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Flagged reviews</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{flaggedReviews}</p>
          </div>
          <div className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">Price reports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{priceReports}</p>
          </div>
          <div className="rounded-[1.5rem] border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">Duplicate reports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{duplicateReports}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4" aria-label="Unified moderation queue">
          {communityModerationQueue.map((item) => (
            <article className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm" key={item.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
                    {moderationQueueTypeLabel(item.type)} · {moderationStatusLabel(item.status)} · {item.reportCount} report(s)
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString('sv-SE')}</p>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800">{moderationPriorityLabel(item.priority)}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{item.detail}</p>
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">Moderator action: {item.actionLabel}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-full bg-amber-800 px-5 py-3 text-sm font-black text-white" href="/admin/reports">Review community reports</Link>
          <Link className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-800" href="/admin/duplicates">Open duplicate review</Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
