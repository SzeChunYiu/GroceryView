import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

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
  return (
    <AdminBackstageScaffold
      description="Raw counts, quality checks, dead letters, and publish gate outcome for a single ingestion run."
      eyebrow="Ingestion"
      path={`/admin/source-runs/${id}`}
      relatedLinks={[{ href: '/admin/source-runs', label: 'All runs' }]}
      title={`Run ${id}`}
    >
      <dl className="grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Quality status</dt>
          <dd className="mt-1 text-slate-950">Passed critical gates · 2 warnings</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Publish decision</dt>
          <dd className="mt-1 text-slate-950">Gold snapshot eligible</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Raw records</dt>
          <dd className="mt-1 text-slate-950">12,462</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dead letters</dt>
          <dd className="mt-1 text-slate-950">2 · review queue</dd>
        </div>
      </dl>
    </AdminBackstageScaffold>
  );
}
