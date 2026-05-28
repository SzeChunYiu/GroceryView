import { AdminBackstageScaffold, AdminReportSourceLabel, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { getSourceRunsReport } from '@/lib/admin-reports/source-runs';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/source-runs',
    'Source runs',
    'Ingestion run ledger: connector status, accepted/rejected counts, and quality outcomes.'
  );
}

export default function AdminSourceRunsPage() {
  const report = getSourceRunsReport();

  return (
    <AdminBackstageScaffold
      description="Track bronze-layer source runs before gold publish. Linked from operator source health."
      eyebrow="Ingestion"
      path="/admin/source-runs"
      relatedLinks={[
        { href: '/admin/sources', label: 'Source health' },
        { href: '/admin/dead-letters', label: 'Dead letters' }
      ]}
      title="Source runs"
    >
      <AdminReportSourceLabel label={report.label} />
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="py-2 pr-4">Run</th>
            <th className="py-2 pr-4">Domain</th>
            <th className="py-2 pr-4">Source</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Accepted</th>
            <th className="py-2 pr-4">Dead letters</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((run) => (
            <tr className="border-t border-slate-100" key={run.id}>
              <td className="py-3 pr-4 font-mono text-xs">
                <a className="underline" href={`/admin/source-runs/${run.id}`}>{run.id}</a>
              </td>
              <td className="py-3 pr-4">{run.domain}</td>
              <td className="py-3 pr-4">{run.source}</td>
              <td className="py-3 pr-4 font-semibold">{run.status}</td>
              <td className="py-3 pr-4">{run.accepted.toLocaleString('sv-SE')}</td>
              <td className="py-3 pr-4">{run.deadLetters}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminBackstageScaffold>
  );
}
