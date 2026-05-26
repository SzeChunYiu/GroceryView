import Link from 'next/link';
import { PageShell } from '@/components/data-ui';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpPageHeader } from '@/components/mvp/mvp-page-header';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/methodology');
}

export default function MethodologyPage() {
  return (
    <PageShell>
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />
      <MvpPageHeader
        eyebrow="Methodology"
        title="How GroceryView scores deals, indexes, and confidence"
        subtitle="Every public panel is designed to fail closed when verified observations are missing."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MvpSectionCard title="Price index">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            Chain and category indexes replay dated observations through <code className="rounded bg-slate-100 px-1">calculateChainPriceIndex</code> on matched unit prices. GroceryView does not forecast forward or fill gaps with synthetic points.
          </p>
        </MvpSectionCard>
        <MvpSectionCard title="Deal score">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            Deal labels compare current prices with historic medians and nearby chain spreads. Real Deal requires strong historic discount, non-negative nearby comparison, confidence ≥ 60%, and fresh or aging observations.
          </p>
        </MvpSectionCard>
        <MvpSectionCard title="Confidence">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            Confidence rises with observation count and source agreement. High confidence needs substantial sample sizes; unknown confidence means the panel cannot support a shopper decision yet.
          </p>
        </MvpSectionCard>
        <MvpSectionCard title="Freshness">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            Fresh observations are younger than two days, aging through seven days, and stale beyond that window for perishable classes. Stale rows may still display with warnings.
          </p>
        </MvpSectionCard>
        <MvpSectionCard title="Missing data">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            When a panel lacks verified observations, GroceryView shows an explicit empty state. The UI never renders placeholder prices, demo deals, or fabricated store comparisons as if they were real.
          </p>
        </MvpSectionCard>
        <MvpSectionCard title="Daily ingestion">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            Production ingestion runs on a scheduled workflow, persists source runs and price observations to PostgreSQL, exports a db-site snapshot, and gates success on required chains and freshness checks.
          </p>
          <Link className="mt-3 inline-block text-sm font-black text-emerald-800 underline" href="/data-sources">
            View data sources →
          </Link>
        </MvpSectionCard>
      </div>
    </PageShell>
  );
}
