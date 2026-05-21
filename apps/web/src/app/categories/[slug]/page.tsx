import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { categorySummaries, formatPct, formatSek, labelFromSlug } from '@/lib/verified-data';

export function generateStaticParams() { return categorySummaries.map((category) => ({ slug: category.slug })); }

export default async function CategoryPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  if (!categoryLabels[slug]) notFound();
  const chainRows = axfoodProducts.filter((product) => product.category === slug).slice(0, 24);
  const openRows = pricedProducts.filter((product) => product.category === slug).slice(0, 24);
  return (
    <PageShell>
      <Eyebrow>Category</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{labelFromSlug(slug)}</h1>
      <p className="mt-3 text-lg text-slate-700">{chainRows.length} Axfood rows and {openRows.length} OpenPrices rows shown from verified source modules.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-2xl font-black">Chain spread rows</h2><div className="mt-4 space-y-3">{chainRows.map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.lowestPrice)} · {formatPct(product.spreadPct)} spread</p></Link>)}</div></Card>
        <Card><h2 className="text-2xl font-black">OpenPrices rows</h2><div className="mt-4 space-y-3">{openRows.map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.priceMedian)} · {product.observationCount} obs. · {product.lastObservedAt}</p></Link>)}</div></Card>
      </div>
    </PageShell>
  );
}
