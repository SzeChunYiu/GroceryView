import { AdminBackstageScaffold, AdminReportSourceLabel, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { getQueryPerformanceReport } from '@/lib/admin-reports/query-performance';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/query-performance',
    'Query performance',
    'Slow queries, pg_stat_statements summaries, and route p95.'
  );
}

export default function AdminQueryPerformancePage() {
  const report = getQueryPerformanceReport();

  return (
    <AdminBackstageScaffold
      description="Database and API latency for operator tuning. Use npm run ops:db-io-hotspots for live IO reports."
      eyebrow="Observability"
      path="/admin/query-performance"
      relatedLinks={[{ href: '/admin/performance', label: 'Core Web Vitals' }]}
      title="Query performance"
    >
      <AdminReportSourceLabel label={report.label} />
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="py-2 pr-4">Route</th>
            <th className="py-2 pr-4">p95 (ms)</th>
            <th className="py-2 pr-4">Samples</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr className="border-t border-slate-100" key={row.route}>
              <td className="py-3 pr-4 font-mono text-xs">{row.route}</td>
              <td className="py-3 pr-4">{row.p95Ms}</td>
              <td className="py-3 pr-4">{row.sampleCount.toLocaleString('sv-SE')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminBackstageScaffold>
  );
}
