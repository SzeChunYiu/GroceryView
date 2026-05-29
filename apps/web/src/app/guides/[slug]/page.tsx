import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { findSeoGuide, seoGuides } from '@/lib/seo-guides';
import { JsonLd, buildBreadcrumbJsonLd } from '@/lib/structured-data';

export function generateStaticParams() {
  return seoGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const guide = findSeoGuide(slug);
  if (!guide) return routeMetadata({ path: '/guides', canonicalPath: '/guides', title: 'GroceryView guides', description: 'GroceryView source-backed shopping guides.', noIndex: true });
  return routeMetadata({ path: `/guides/${guide.slug}`, title: `${guide.title} | GroceryView`, description: guide.description });
}

export default async function GuidePage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const guide = findSeoGuide(slug);
  if (!guide) notFound();

  return (
    <PageShell>
      <JsonLd data={buildBreadcrumbJsonLd([{ name: 'Home', item: '/' }, { name: 'Guides', item: '/guides' }, { name: guide.title, item: `/guides/${guide.slug}` }])} />
      <Eyebrow>GroceryView guide</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">{guide.title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{guide.description}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/70">
          <h2 className="text-2xl font-black text-emerald-950">What GroceryView can compare</h2>
          <ul className="mt-3 grid gap-2 text-sm font-bold text-emerald-950">
            {guide.canCompare.map((item) => <li className="rounded-2xl bg-white/80 p-3" key={item}>{item}</li>)}
          </ul>
        </Card>
        <Card className="border-amber-200 bg-amber-50/70">
          <h2 className="text-2xl font-black text-amber-950">What it cannot claim</h2>
          <ul className="mt-3 grid gap-2 text-sm font-bold text-amber-950">
            {guide.cannotClaim.map((item) => <li className="rounded-2xl bg-white/80 p-3" key={item}>{item}</li>)}
          </ul>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Examples and live evidence links</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {guide.examples.map((example) => (
            <Link className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" href={example.href} key={example.href}>
              <p className="font-black text-slate-950">{example.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{example.detail}</p>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">FAQ</h2>
        <div className="mt-4 grid gap-3">
          {guide.faq.map((item) => (
            <section className="rounded-2xl bg-slate-50 p-4" key={item.question}>
              <h3 className="font-black text-slate-950">{item.question}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.answer}</p>
            </section>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
