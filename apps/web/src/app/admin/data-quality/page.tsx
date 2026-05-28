import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/data-quality',
    'Data quality',
    'Critical failures, warnings, freshness SLA, and quality-gate history.'
  );
}

export default function AdminDataQualityPage() {
  return (
    <AdminBackstageScaffold
      description="Quality gates before gold publish. See docs/data/quality-gates.md for critical vs warning gates."
      eyebrow="Observability"
      path="/admin/data-quality"
      relatedLinks={[{ href: '/admin/source-runs', label: 'Source runs' }]}
      title="Data quality"
    >
      <ul className="list-disc space-y-2 pl-5 text-sm font-semibold text-slate-700">
        <li>Critical: schema validation — pass</li>
        <li>Critical: non-empty grocery snapshot — pass</li>
        <li>Warning: ICA coverage below target — open</li>
        <li>Freshness SLA: 94% observations within 48h</li>
      </ul>
    </AdminBackstageScaffold>
  );
}
