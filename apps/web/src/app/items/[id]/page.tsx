import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categoryPathForSlug } from '@groceryview/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return pricedProducts.map((product) => ({ id: product.code }));
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const item = pricedProducts.find((p) => p.code === id || p.slug === id);
  if (!item) notFound();

  const categorySlug = item.category || 'pantry';
  const categoryLabel = categoryLabels[categorySlug] || categorySlug;
  const categoryPath = categoryPathForSlug(categorySlug);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/categories' },
          ...categoryPath.map((node, index, allNodes) => ({
            label: node.label,
            href: node.routable && index !== allNodes.length - 1 ? `/categories/${node.slug}` : undefined,
          })),
          { label: item.name },
        ]}
      />

      <section className="rounded-lg border border-market-ink/10 bg-white p-6">
        <h1 className="text-3xl font-black tracking-tight">{item.name}</h1>
        <p className="mt-2 text-sm text-market-ink/60">{item.code}</p>
        <p className="mt-4 rounded-md bg-market-oat/45 p-4 text-sm">
          Median price: <strong>SEK {item.priceMedian.toFixed(2)}</strong> · {item.observationCount} observations
        </p>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-market-ink/10 p-3">
            <dt className="font-semibold text-market-ink/55">Category</dt>
            <dd className="mt-1">
              <Link className="font-bold text-market-mint" href={`/categories/${categorySlug}`}>
                {categoryLabel}
              </Link>
            </dd>
          </div>
          <div className="rounded-md border border-market-ink/10 p-3">
            <dt className="font-semibold text-market-ink/55">Brands</dt>
            <dd className="mt-1 font-bold">{item.brands || '—'}</dd>
          </div>
          <div className="rounded-md border border-market-ink/10 p-3">
            <dt className="font-semibold text-market-ink/55">Quantity</dt>
            <dd className="mt-1 font-bold">{item.quantity || '—'}</dd>
          </div>
          <div className="rounded-md border border-market-ink/10 p-3">
            <dt className="font-semibold text-market-ink/55">Price range</dt>
            <dd className="mt-1 font-bold">
              SEK {item.priceMin.toFixed(2)} – SEK {item.priceMax.toFixed(2)}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
