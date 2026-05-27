import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/data-ui';
import { CategoryDualLinks } from '@/components/mvp/category-dual-links';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpPageHeader } from '@/components/mvp/mvp-page-header';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { MvpProductCard } from '@/components/mvp/product-card';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { getBrowseCategoryData } from '@/lib/mvp/data';
import { categoryMarketHref, categorySearchHref, chainCategorySearchHref } from '@/lib/mvp/routes';
import { routeMetadata } from '@/lib/seo';
import { categoryLabels } from '@/lib/openprices-products';
import { categorySummaries } from '@/lib/verified-data';

type Params = { category: string };

export function generateStaticParams() {
  return categorySummaries.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const label = categoryLabels[category] ?? category;
  return routeMetadata({
    path: `/browse/${category}`,
    title: `Browse ${label} | GroceryView`,
    description: `Browse verified ${label} products with source, confidence, and freshness evidence from the GroceryView snapshot.`
  });
}

export default async function BrowseCategoryPage({ params }: Readonly<{ params: Promise<Params> }>) {
  const { category } = await params;
  const data = getBrowseCategoryData(category);
  if (!data) notFound();

  return (
    <PageShell>
      <MvpBreadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Browse', href: '/browse' },
          { label: data.categoryName }
        ]}
      />
      <CategoryDualLinks categoryName={data.categoryName} categorySlug={data.categorySlug} />
      <MvpPageHeader
        eyebrow="Category browse"
        title={data.categoryName}
        subtitle="Product grid rows come from verified OpenPrices observations and matched chain catalogue coverage."
        actions={
          <>
            <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={categorySearchHref(data.categorySlug)}>
              Search in category
            </Link>
            <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href={categoryMarketHref(data.categorySlug)}>
              Market view
            </Link>
          </>
        }
      />

      <MvpSectionCard className="mt-6" title="Category shopping summary">
        <p className="text-sm font-semibold leading-6 text-slate-700">
          {data.products.length.toLocaleString('sv-SE')} products with verified price observations in this category. Chain and subcategory shortcuts below filter search without inventing prices.
        </p>
      </MvpSectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MvpSectionCard title="Chains">
          {data.chainCards.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.chainCards.map((card) => (
                <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" href={chainCategorySearchHref(card.chain.toLowerCase(), data.categorySlug)} key={card.chain}>
                  {card.chain}
                </Link>
              ))}
            </div>
          ) : (
            <NoVerifiedDataPanel title="No chain spread rows for this category" />
          )}
        </MvpSectionCard>
        <MvpSectionCard title="Subcategories">
          {data.subcategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.subcategories.map((sub) => (
                <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" href={`${categorySearchHref(data.categorySlug)}&type=${encodeURIComponent(sub.slug)}`} key={sub.slug}>
                  {sub.label}
                </Link>
              ))}
            </div>
          ) : (
            <NoVerifiedDataPanel title="No subcategory facets yet" />
          )}
        </MvpSectionCard>
      </div>

      <MvpSectionCard className="mt-6" title="Products">
        {data.products.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.products.map((product) => (
              <MvpProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <NoVerifiedDataPanel />
        )}
      </MvpSectionCard>
    </PageShell>
  );
}
