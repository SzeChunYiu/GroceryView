import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/query-performance',
    'Query performance',
    'Slow queries, pg_stat_statements summaries, and route p95.'
  );
}

export default function AdminQueryPerformancePage() {
  return (
    <AdminBackstageScaffold
      description="Database and API latency for operator tuning. Use npm run ops:db-io-hotspots for live IO reports."
      eyebrow="Observability"
      path="/admin/query-performance"
      relatedLinks={[{ href: '/admin/performance', label: 'Core Web Vitals' }]}
      title="Query performance"
    >
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="py-2 pr-4">Route</th>
            <th className="py-2 pr-4">p95 (ms)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className="py-3 pr-4 font-mono text-xs">GET /api/products/search</td>
            <td className="py-3 pr-4">420</td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className="py-3 pr-4 font-mono text-xs">GET /api/market/snapshot</td>
            <td className="py-3 pr-4">180</td>
          </tr>
        </tbody>
      </table>
    </AdminBackstageScaffold>
  );
}
