import { AdminBackstageScaffold, AdminReportSourceLabel, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { getSearchAnalyticsReport } from '@/lib/admin-reports/search-analytics';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/search-analytics',
    'Search analytics',
    'Top queries, zero-result rate, click-through, and domain usage.'
  );
}

export default function AdminSearchAnalyticsPage() {
  const report = getSearchAnalyticsReport();

  return (
    <AdminBackstageScaffold
      description="Search quality metrics aligned with docs/data/event-tracking-plan.md (`search_submitted`, `search_zero_result`)."
      eyebrow="Analytics"
      path="/admin/search-analytics"
      relatedLinks={[{ href: '/admin/analytics', label: 'Product conversion dashboard' }]}
      title="Search analytics"
    >
      <AdminReportSourceLabel label={report.label} />
      <dl className="grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Zero-result rate (7d)</dt>
          <dd className="mt-1 text-2xl font-black text-slate-950">{report.summary.zeroResultRate7d}%</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Search → product CTR</dt>
          <dd className="mt-1 text-2xl font-black text-slate-950">{report.summary.searchToProductCtr}%</dd>
        </div>
      </dl>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="py-2 pr-4">Query</th>
            <th className="py-2 pr-4">Searches</th>
            <th className="py-2 pr-4">Zero-result</th>
            <th className="py-2 pr-4">CTR</th>
          </tr>
        </thead>
        <tbody>
          {report.summary.topQueries.map((row) => (
            <tr className="border-t border-slate-100" key={row.query}>
              <td className="py-3 pr-4">{row.query}</td>
              <td className="py-3 pr-4">{row.searches.toLocaleString('sv-SE')}</td>
              <td className="py-3 pr-4">{row.zeroResultRate}%</td>
              <td className="py-3 pr-4">{row.clickThroughRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminBackstageScaffold>
  );
}
