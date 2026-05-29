import Link from 'next/link';
import { PageShell } from '@/components/data-ui';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpPageHeader } from '@/components/mvp/mvp-page-header';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { sourceCoverage } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/confidence');
}

export default function ConfidencePage() {
  return (
    <PageShell>
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Confidence' }]} />
      <MvpPageHeader
        eyebrow="Confidence"
        title="Source confidence and observation depth"
        subtitle="Confidence badges on product, deal, and index panels summarize how much verified evidence backs each number."
      />

      <MvpSectionCard className="mt-6" title="Confidence levels">
        <ul className="space-y-3 text-sm font-semibold leading-6 text-slate-700">
          <li>
            <strong className="text-slate-950">High</strong> — Many recent observations with strong source agreement.
          </li>
          <li>
            <strong className="text-slate-950">Medium</strong> — Usable sample with some gaps or mixed freshness.
          </li>
          <li>
            <strong className="text-slate-950">Low</strong> — Thin evidence; treat comparisons cautiously.
          </li>
          <li>
            <strong className="text-slate-950">Unknown</strong> — Not enough verified rows to score; panel should stay unavailable.
          </li>
        </ul>
      </MvpSectionCard>

      <MvpSectionCard className="mt-6" title="Source coverage snapshot">
        <div className="grid gap-3 md:grid-cols-2">
          {sourceCoverage.map((source) => (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={source.name}>
              <p className="font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{source.caveat}</p>
            </div>
          ))}
        </div>
        <Link className="mt-4 inline-block text-sm font-black text-emerald-800 underline" href="/coverage">
          Open freshness coverage report →
        </Link>
      </MvpSectionCard>
    </PageShell>
  );
}
