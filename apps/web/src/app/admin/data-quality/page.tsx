import { AdminBackstageScaffold, AdminReportSourceLabel, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { getDataQualityReport } from '@/lib/admin-reports/data-quality';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/data-quality',
    'Data quality',
    'Critical failures, warnings, freshness SLA, and quality-gate history.'
  );
}

export default function AdminDataQualityPage() {
  const report = getDataQualityReport();

  return (
    <AdminBackstageScaffold
      description="Quality gates before gold publish. See docs/data/quality-gates.md for critical vs warning gates."
      eyebrow="Observability"
      path="/admin/data-quality"
      relatedLinks={[{ href: '/admin/source-runs', label: 'Source runs' }]}
      title="Data quality"
    >
      <AdminReportSourceLabel label={report.label} />
      <ul className="list-disc space-y-2 pl-5 text-sm font-semibold text-slate-700">
        {report.gates.map((gate) => (
          <li key={gate.id}>
            {gate.severity === 'critical' ? 'Critical' : 'Warning'}: {gate.label} — {gate.status}
          </li>
        ))}
        <li>
          {report.freshness.label}: {report.freshness.percentWithinSla}% observations within {report.freshness.windowHours}h
        </li>
      </ul>
    </AdminBackstageScaffold>
  );
}
