import { AdminBackstageScaffold, AdminReportSourceLabel, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { getStorageReport } from '@/lib/admin-reports/storage';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/storage',
    'Storage',
    'Table sizes, index sizes, partition growth, and retention posture.'
  );
}

export default function AdminStoragePage() {
  const report = getStorageReport();

  return (
    <AdminBackstageScaffold
      description="Storage growth and partition plan. See docs/data/database-scaling-plan.md."
      eyebrow="Database"
      path="/admin/storage"
      title="Storage"
    >
      <AdminReportSourceLabel label={report.label} />
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="py-2 pr-4">Table</th>
            <th className="py-2 pr-4">Data (GB)</th>
            <th className="py-2 pr-4">Indexes (GB)</th>
            <th className="py-2 pr-4">Retention</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr className="border-t border-slate-100" key={row.name}>
              <td className="py-3 pr-4 font-mono text-xs">{row.name}</td>
              <td className="py-3 pr-4">{row.sizeGb}</td>
              <td className="py-3 pr-4">{row.indexGb}</td>
              <td className="py-3 pr-4">{row.retentionNote}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminBackstageScaffold>
  );
}
