import { AdminMetricCard, Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import { buildPartnerStoreDashboardSummary } from '@/lib/chain-index-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin',
    title: 'Partner store dashboard | GroceryView',
    description: 'Admin shell for partner stores to review visibility, catalogue coverage, and reported issue gaps.',
    noIndex: true
  });
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0, style: 'percent' }).format(value);
}

export default function AdminDashboardPage() {
  const dashboard = buildPartnerStoreDashboardSummary();

  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="success">Verified snapshot</StatusBadge>
            <StatusBadge tone="warning">Admin only</StatusBadge>
          </>
        }
        eyebrow="Partner operations"
        title="Store partner dashboard"
      >
        <p>
          A launch shell for partner stores to review where GroceryView can show their catalogue today, how much of that catalogue is comparable, and which reported issue gaps still block store-level claims.
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-600">Source: {dashboard.sourceLabel}</p>
      </DashboardHero>

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
    </PageShell>
  );
}
