import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/data-ui';
import { CategoryDualLinks } from '@/components/mvp/category-dual-links';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpPageHeader } from '@/components/mvp/mvp-page-header';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { MvpProductCard } from '@/components/mvp/product-card';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { getCategoryMarketData } from '@/lib/mvp/data';
import { formatSek } from '@/lib/mvp/format';
import { chainCategorySearchHref, categorySearchHref, productRoute } from '@/lib/mvp/routes';
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
    path: `/market/${category}`,
    title: `${label} market index | GroceryView`,
    description: `Category market indexes, chain spreads, and verified deal leaders for ${label} from observed grocery price rows.`
  });
}

export default async function CategoryMarketPage({
  params,
  searchParams
}: Readonly<{ params: Promise<Params>; searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const { category } = await params;
  const resolvedSearch = await (searchParams ?? Promise.resolve({}));
  const data = getCategoryMarketData(category, resolvedSearch);
  if (!data) notFound();

  return (
    <PageShell>
      <MvpBreadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Market', href: '/market' },
          { label: data.categoryName }
        ]}
      />
      <MvpPageHeader
        eyebrow="Category market"
        title={data.categoryName}
        subtitle="Category indexes, chain spreads, and deal leaders use only verified rows for this category."
        actions={
          <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={categorySearchHref(data.categorySlug)}>
            Browse products
          </Link>
        }
      />

      <div className="mt-4">
        <CategoryDualLinks categoryName={data.categoryName} categorySlug={data.categorySlug} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {data.chainCards.map((card) => (
          <Link className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:ring-2 hover:ring-emerald-200" href={chainCategorySearchHref(card.chain.toLowerCase(), data.categorySlug)} key={card.chain}>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Chain</p>
            <p className="mt-1 text-xl font-black text-slate-950">{card.chain}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">{card.productCount} matched products</p>
          </Link>
        ))}
      </div>

      <MvpSectionCard className="mt-6" title="Best deals in category">
        {data.bestDeals.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.bestDeals.map((deal) => (
              <Link className="rounded-2xl border border-slate-100 bg-slate-50 p-4" href={productRoute(deal.product.id)} key={deal.id}>
                <DealBadge label={deal.dealLabel} />
                <p className="mt-2 font-black text-slate-950">{deal.product.name}</p>
                <p className="text-lg font-black text-emerald-800">{formatSek(deal.currentPrice)}</p>
                <EvidenceStrip evidence={deal} />
              </Link>
            ))}
          </div>
        ) : (
          <NoVerifiedDataPanel />
        )}
      </MvpSectionCard>

      <MvpSectionCard className="mt-6" title="Browse by subcategory">
        {data.subcategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.subcategories.map((sub) => (
              <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-800" href={`${categorySearchHref(data.categorySlug)}&type=${encodeURIComponent(sub.slug)}`} key={sub.slug}>
                {sub.label} ({sub.productCount})
              </Link>
            ))}
          </div>
        ) : (
          <NoVerifiedDataPanel title="No subcategory tags in verified data" />
        )}
      </MvpSectionCard>

      <MvpSectionCard className="mt-6" title="Product preview">
        {data.productPreview.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.productPreview.map((product) => (
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
