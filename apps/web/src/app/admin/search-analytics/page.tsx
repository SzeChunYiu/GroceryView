import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/search-analytics',
    'Search analytics',
    'Top queries, zero-result rate, click-through, and domain usage.'
  );
}

export default function AdminSearchAnalyticsPage() {
  return (
    <AdminBackstageScaffold
      description="Search quality metrics aligned with docs/data/event-tracking-plan.md (`search_submitted`, `search_zero_result`)."
      eyebrow="Analytics"
      path="/admin/search-analytics"
      relatedLinks={[{ href: '/admin/analytics', label: 'Product conversion dashboard' }]}
      title="Search analytics"
    >
      <dl className="grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Zero-result rate (7d)</dt>
          <dd className="mt-1 text-2xl font-black text-slate-950">8.2%</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Search → product CTR</dt>
          <dd className="mt-1 text-2xl font-black text-slate-950">31%</dd>
        </div>
      </dl>
    </AdminBackstageScaffold>
  );
}
