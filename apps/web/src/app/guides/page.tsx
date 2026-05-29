import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { JsonLd, buildBreadcrumbJsonLd } from '@/lib/structured-data';
import { seoGuides } from '@/lib/seo-guides';

export function generateMetadata() {
  return routeMetadata({
    path: '/guides',
    title: 'GroceryView shopping and data guides',
    description: 'Helpful GroceryView guides for comparing groceries, fuel prices, OTC pharmacy rows, confidence labels, and missing data boundaries.'
  });
}

export default function GuidesIndexPage() {
  return (
    <PageShell>
      <JsonLd data={buildBreadcrumbJsonLd([{ name: 'Home', item: '/' }, { name: 'Guides', item: '/guides' }])} />
      <Eyebrow>Guides</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">Source-backed shopping guides</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        These guides explain what GroceryView can compare, what it cannot claim, and where to inspect the live evidence behind grocery, fuel, and OTC pharmacy pages.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {seoGuides.map((guide) => (
          <Card key={guide.slug}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Reviewed guide</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{guide.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{guide.description}</p>
            <Link className="mt-4 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={`/guides/${guide.slug}`}>
              Read guide
            </Link>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
