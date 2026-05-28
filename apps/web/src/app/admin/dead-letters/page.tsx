import Link from 'next/link';
import { AdminBackstageScaffold, AdminReportSourceLabel, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { getDeadLettersReport } from '@/lib/admin-reports/dead-letters';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/dead-letters',
    'Dead letters',
    'Rejected ingestion payloads with reason, severity, and suggested fix.'
  );
}

export default function AdminDeadLettersPage() {
  const report = getDeadLettersReport();

  return (
    <AdminBackstageScaffold
      description="Operator queue for payloads that failed validation or matching. Canonical detail also lives under source health."
      eyebrow="Ingestion"
      path="/admin/dead-letters"
      relatedLinks={[{ href: '/admin/sources/dead-letters', label: 'Source health dead letters' }]}
      title="Dead letters"
    >
      <AdminReportSourceLabel label={report.label} />
      <p className="text-sm font-semibold text-slate-700">
        Use the linked source-health view for live duplicate-spike alerts. This route satisfies the backstage matrix for DLQ review.
      </p>
      <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={report.queueHref}>
        Open dead-letter queue
      </Link>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="py-2 pr-4">ID</th>
            <th className="py-2 pr-4">Run</th>
            <th className="py-2 pr-4">Error</th>
            <th className="py-2 pr-4">Severity</th>
            <th className="py-2 pr-4">Suggested fix</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr className="border-t border-slate-100" key={row.id}>
              <td className="py-3 pr-4 font-mono text-xs">{row.id}</td>
              <td className="py-3 pr-4 font-mono text-xs">{row.sourceRunId}</td>
              <td className="py-3 pr-4">{row.errorClass}</td>
              <td className="py-3 pr-4 font-semibold">{row.severity}</td>
              <td className="py-3 pr-4">{row.suggestedFix}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminBackstageScaffold>
  );
}
