import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

export function generateMetadata() {
  return adminBackstageMetadata('/admin/lineage', 'Lineage', 'Source → raw → normalized → gold lineage events for debugging.');
}

export default function AdminLineagePage() {
  return (
    <AdminBackstageScaffold
      description="Trace which source_run_id produced a public snapshot row. Full contracts in docs/data/source-run-contract.md."
      eyebrow="Observability"
      path="/admin/lineage"
      title="Lineage"
    >
      <p className="font-mono text-xs text-slate-600">openprices → raw_records → observations_v2 → latest_prices → search_documents</p>
    </AdminBackstageScaffold>
  );
}
