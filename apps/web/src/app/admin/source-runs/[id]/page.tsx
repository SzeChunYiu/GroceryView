import { AdminBackstageScaffold, AdminReportSourceLabel, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { getSourceRunDetail, getSourceRunsReport } from '@/lib/admin-reports/source-runs';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return adminBackstageMetadata(
    `/admin/source-runs/${id}`,
    `Source run ${id}`,
    'Run detail: quality checks, lineage, and publish decision.'
  );
}

export default async function AdminSourceRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { label } = getSourceRunsReport();
  const detail = getSourceRunDetail(id);

  return (
    <AdminBackstageScaffold
      description="Raw counts, quality checks, dead letters, and publish gate outcome for a single ingestion run."
      eyebrow="Ingestion"
      path={`/admin/source-runs/${id}`}
      relatedLinks={[{ href: '/admin/source-runs', label: 'All runs' }]}
      title={`Run ${id}`}
    >
      <AdminReportSourceLabel label={label} />
      {detail ? (
        <dl className="grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Quality status</dt>
            <dd className="mt-1 text-slate-950">{detail.qualityStatus}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Publish decision</dt>
            <dd className="mt-1 text-slate-950">{detail.publishDecision}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Raw records</dt>
            <dd className="mt-1 text-slate-950">{detail.rawRecords.toLocaleString('sv-SE')}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dead letters</dt>
            <dd className="mt-1 text-slate-950">{detail.deadLetters} · {detail.deadLetterNote}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm font-semibold text-slate-700">No scaffold detail for run {id}. Connect source_runs lookup next.</p>
      )}
    </AdminBackstageScaffold>
  );
}
