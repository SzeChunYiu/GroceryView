import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/storage',
    'Storage',
    'Table sizes, index sizes, partition growth, and retention posture.'
  );
}

const TABLE_SIZES = [
  { name: 'observations_v2', sizeGb: 42.1, indexGb: 8.2 },
  { name: 'latest_prices', sizeGb: 1.8, indexGb: 0.4 },
  { name: 'search_documents', sizeGb: 3.2, indexGb: 1.1 }
];

export default function AdminStoragePage() {
  return (
    <AdminBackstageScaffold
      description="Storage growth and partition plan. See docs/data/database-scaling-plan.md."
      eyebrow="Database"
      path="/admin/storage"
      title="Storage"
    >
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="py-2 pr-4">Table</th>
            <th className="py-2 pr-4">Data (GB)</th>
            <th className="py-2 pr-4">Indexes (GB)</th>
          </tr>
        </thead>
        <tbody>
          {TABLE_SIZES.map((row) => (
            <tr className="border-t border-slate-100" key={row.name}>
              <td className="py-3 pr-4 font-mono text-xs">{row.name}</td>
              <td className="py-3 pr-4">{row.sizeGb}</td>
              <td className="py-3 pr-4">{row.indexGb}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminBackstageScaffold>
  );
}
