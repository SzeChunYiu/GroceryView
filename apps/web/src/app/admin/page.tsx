import { Card, CoreFunnelDashboard, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin',
    title: 'Admin analytics dashboard | GroceryView',
    description: 'Admin dashboard for aggregate GroceryView workflow funnels and operational review links.',
    noIndex: true
  });
}

const adminLinks = [
  { href: '/admin/moderation', label: 'Moderation thresholds', detail: 'Review routing and risk bands.' },
  { href: '/admin/sources', label: 'Source health', detail: 'Duplicate conflict alerts by source.' },
  { href: '/admin/search-aliases', label: 'Search alias review', detail: 'Structured rejection reasons.' },
  { href: '/analytics/funnel', label: 'Search-to-savings', detail: 'Public aggregate funnel rollup.' }
];

export default function AdminDashboardPage() {
  return (
    <PageShell>
      <Eyebrow>Admin</Eyebrow>
      <div className="mt-2 max-w-3xl">
        <h1 className="text-4xl font-black tracking-tight text-slate-950">Product strategy dashboard</h1>
        <p className="mt-3 text-lg leading-8 text-slate-700">
          Track search-to-product, product-to-alert, list-to-store, and deal-click funnels from aggregate events only.
          The admin surface is blocked from indexing and keeps value signals separate from shopper identifiers.
        </p>
      </div>

      <div className="mt-6">
        <CoreFunnelDashboard />
      </div>

      <Card className="mt-6">
        <Eyebrow>Admin workspaces</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Review queues and source operations</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {adminLinks.map((link) => (
            <a className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-300 hover:bg-emerald-50" href={link.href} key={link.href}>
              <p className="font-black text-slate-950">{link.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{link.detail}</p>
            </a>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
