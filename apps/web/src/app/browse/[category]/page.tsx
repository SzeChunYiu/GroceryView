import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/data-ui';
import { CategoryDualLinks } from '@/components/mvp/category-dual-links';
import { PageQuestionHeader } from '@/components/mvp/handoff-content';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
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
      <PageQuestionHeader
        eyebrow="Category browse"
        question="What is happening in this category, and what should I buy?"
        title={`Browse ${data.categoryName.toLowerCase()} prices`}
        subtitle={`Compare ${data.categoryName.toLowerCase()} prices by chain, type, deal quality, and store. Use the shortcuts below to jump into filtered product results.`}
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
        <MvpSectionCard title={`${data.categoryName} price index by chain`}>
          <p className="text-sm font-semibold leading-6 text-slate-700">
            See which chains are becoming cheaper or more expensive for {data.categoryName.toLowerCase()}. Each chain shortcut opens filtered products for this category.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.chainCards.map((card) => (
              <Link className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-950" href={chainCategorySearchHref(card.chain.toLowerCase(), data.categorySlug)} key={`index-${card.chain}`}>
                {card.chain} chart / products
              </Link>
            ))}
            <Link className="rounded-full bg-white px-3 py-2 text-sm font-black text-emerald-900 underline" href={categoryMarketHref(data.categorySlug)}>
              Full market view
            </Link>
          </div>
        </MvpSectionCard>
        <MvpSectionCard title={`Best ${data.categoryName.toLowerCase()} deals right now`}>
          <div className="grid gap-2 text-sm font-semibold text-slate-700">
            <p>Best deals near you: filtered by verified chain and store evidence.</p>
            <p>Best discounts: compared with historic observations when available.</p>
            <p>Biggest price drops: linked through the central search/product route.</p>
            <p>Watchlist matches: sign in to save products and categories.</p>
          </div>
          <Link className="mt-4 inline-block rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={`${categorySearchHref(data.categorySlug)}&sort=best-deal`}>
            Search best deals
          </Link>
        </MvpSectionCard>
      </div>

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
