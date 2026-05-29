import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const seoPanels = [
  { label: 'Indexable route count', value: 'public + source-backed', detail: 'Static, catalog, fuel, pharmacy, store, product, and guide routes are counted by scripts/ops/seo-indexable-routes-report.mjs.' },
  { label: 'Noindex route count', value: 'private + noisy states', detail: 'Admin, account, settings, login, private watchlist, empty search, and faceted query states are noindex.' },
  { label: 'Sitemap URL count', value: 'audited', detail: 'scripts/ops/seo-sitemap-audit.mjs rejects private/noindex entries and checks domain routes.' },
  { label: 'Missing metadata', value: 'tested', detail: 'apps/web/scripts/page-title-description.test.mjs checks public route title and description policy.' },
  { label: 'Missing structured data', value: 'reported', detail: 'scripts/ops/seo-structured-data-report.mjs checks Organization, WebSite, Breadcrumb, Product, LocalBusiness, GasStation, Pharmacy, and Dataset helpers.' },
  { label: 'Canonical issues', value: 'reported', detail: 'scripts/ops/seo-canonical-report.mjs validates search, deal, and map canonical/noindex decisions.' },
  { label: 'Thin page warnings', value: 'guarded', detail: 'Guide and programmatic pages must include unique intent, examples, links, evidence, and FAQ copy.' },
  { label: 'Top landing pages', value: 'import-ready', detail: 'Search Console import scaffolding stores summary-ready fields without credentials in tests.' },
  { label: 'Top queries', value: 'import-ready', detail: 'Query, impressions, clicks, CTR, and average position fields are normalized by the import scaffold.' },
  { label: 'CTR', value: 'tracked', detail: 'CTR is reported as a Search Console metric, not inferred from client analytics.' },
  { label: 'Average position', value: 'tracked', detail: 'Average position is kept with Search Console rows and never fabricated locally.' },
  { label: 'Search Console import status', value: 'scaffolded', detail: 'scripts/ops/search-console-import.mjs supports dry-run and file import modes.' }
] as const;

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/seo',
    canonicalPath: '/admin/seo',
    title: 'SEO admin report | GroceryView',
    description: 'Backstage SEO route policy, sitemap, structured data, canonical, Search Console, and page experience report status.',
    noIndex: true
  });
}

export default function AdminSeoPage() {
  return (
    <PageShell>
      <Eyebrow>Admin · SEO</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">SEO release gate dashboard</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Backstage summary for route indexing policy, sitemap coverage, structured data contracts, canonical decisions, Search Console import status, growth metrics, and page-experience warnings.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {['seo-indexable-routes-report', 'seo-sitemap-audit', 'seo-structured-data-report', 'seo-canonical-report', 'search-console-import'].map((script) => (
          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white" key={script}>{script}</span>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {seoPanels.map((panel) => (
          <Card key={panel.label}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{panel.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{panel.value}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{panel.detail}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Manual release checks</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          Submit the sitemap in Search Console, inspect the homepage and representative product/fuel/pharmacy URLs, run Rich Results tests, run PageSpeed Insights, and manually check mobile pages before release.
        </p>
        <Link className="mt-4 inline-flex rounded-full bg-amber-900 px-4 py-2 text-sm font-black text-white" href="/data-sources">Review source claims</Link>
      </Card>
    </PageShell>
  );
}
