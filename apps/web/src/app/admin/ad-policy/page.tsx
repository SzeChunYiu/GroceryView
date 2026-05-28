import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';
import { AD_SLOT_IDS } from '@/lib/ad-slots';
import { AD_FREE_ROUTE_PREFIXES } from '@/lib/ad-policy';

export function generateMetadata() {
  return adminBackstageMetadata('/admin/ad-policy', 'Ad policy', 'Slot registry, disabled routes, and placement safety rules.');
}

export default function AdminAdPolicyPage() {
  return (
    <AdminBackstageScaffold
      description="Public ad placements must use the Advertisement label, reserved height, and never nest inside cards or maps."
      eyebrow="Monetization"
      path="/admin/ad-policy"
      title="Ad policy"
    >
      <h2 className="text-lg font-black text-slate-950">Slots</h2>
      <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-slate-700">
        {AD_SLOT_IDS.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
      <h2 className="mt-6 text-lg font-black text-slate-950">Ad-free routes</h2>
      <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-slate-700">
        {AD_FREE_ROUTE_PREFIXES.map((prefix) => (
          <li key={prefix}>{prefix}</li>
        ))}
      </ul>
    </AdminBackstageScaffold>
  );
}
