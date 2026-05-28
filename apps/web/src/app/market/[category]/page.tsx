import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CategorySparklineChart,
  MarketFilterRail,
  MarketKpiRow
} from '@/components/market/market-page-parts';
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
import { formatPercent, formatSek } from '@/lib/mvp/format';
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
    title: `${label} market | GroceryView`,
    description: `Category trends, chain spreads, and verified deal leaders for ${label} from observed grocery prices.`
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

  const categoryRow = data.overview.categoryIndexRows[0];
  const totalProducts = data.chainCards.reduce((sum, card) => sum + card.productCount, 0);

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
        title={`How is ${data.categoryName} pricing this week?`}
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

      <MarketKpiRow
        items={[
          {
            label: 'Weekly change',
            value: formatPercent(categoryRow?.weeklyChangePct),
            detail: 'Based on verified price observations in this category.'
          },
          {
            label: 'Matched products',
            value: totalProducts.toLocaleString('sv-SE'),
            detail: 'Products with chain price coverage in this category.'
          },
          {
            label: 'Verified deals',
            value: data.bestDeals.length.toLocaleString('sv-SE'),
            detail: 'Deal leaders ranked from observed spreads and history.'
          },
          {
            label: 'Observations',
            value: (categoryRow?.observationCount ?? 0).toLocaleString('sv-SE'),
            detail: categoryRow ? `${categoryRow.sourceLabel}` : 'No verified rows yet'
          }
        ]}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[16rem_1fr]">
        <MarketFilterRail action={`/market/${data.categorySlug}`} title="Filter category">
          <label className="block text-sm font-black text-slate-700">
            Region
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" defaultValue={data.overview.selectedRegion} name="region">
              {['stockholm', 'goteborg', 'malmo'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-black text-slate-700">
            Index type
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" defaultValue={data.overview.selectedIndexType} name="index">
              {['chain-price', 'category-price'].map((option) => (
                <option key={option} value={option}>
                  {option.replace('-', ' ')}
                </option>
              ))}
            </select>
          </label>
          {data.chainCards.length > 0 ? (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Chains in category</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.chainCards.map((card) => (
                  <Link
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-emerald-100"
                    href={chainCategorySearchHref(card.chain.toLowerCase(), data.categorySlug)}
                    key={card.chain}
                  >
                    {card.chain}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </MarketFilterRail>

        <div className="space-y-6">
          <CategorySparklineChart categoryName={data.categoryName} row={categoryRow} />

          <MvpSectionCard title="Chain comparison table">
            {data.chainCards.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <th className="py-2 pr-4">Chain</th>
                      <th className="py-2 pr-4">Products</th>
                      <th className="py-2 pr-4">Top spread</th>
                      <th className="py-2">Browse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.chainCards.map((card) => (
                      <tr className="border-b border-slate-100" key={card.chain}>
                        <td className="py-3 pr-4 font-black text-slate-950">{card.chain}</td>
                        <td className="py-3 pr-4 font-semibold">{card.productCount.toLocaleString('sv-SE')}</td>
                        <td className="py-3 pr-4 font-semibold">{formatPercent(card.medianSpreadPct)}</td>
                        <td className="py-3">
                          <Link className="text-sm font-black text-emerald-800 underline" href={chainCategorySearchHref(card.chain.toLowerCase(), data.categorySlug)}>
                            Compare chain
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <NoVerifiedDataPanel message="No chain coverage rows are available for this category yet." />
            )}
          </MvpSectionCard>

          <MvpSectionCard title="Best deals in category">
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
              <NoVerifiedDataPanel message="No verified deal leaders in this category right now." title="No deals yet" />
            )}
          </MvpSectionCard>

          <MvpSectionCard title="Browse by subcategory">
            {data.subcategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.subcategories.map((sub) => (
                  <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-800" href={`${categorySearchHref(data.categorySlug)}&type=${encodeURIComponent(sub.slug)}`} key={sub.slug}>
                    {sub.label} ({sub.productCount})
                  </Link>
                ))}
              </div>
            ) : (
              <NoVerifiedDataPanel message="No subcategory tags are available in verified data yet." title="No subcategories yet" />
            )}
          </MvpSectionCard>

          <MvpSectionCard title="Product preview">
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
        </div>
      </div>
    </PageShell>
  );
}
